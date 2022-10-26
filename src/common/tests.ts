import fs from 'fs-extra'
import path from 'path'
import process from 'process'
import { Octokit } from 'octokit'
import { terminal } from 'terminal-kit'

export const getCurrentTerminal = () => terminal.str()

/**
 * This method creates 2 new dirs with unique names for upstream and slice repos
 * together with setting `GIT_SLICE_UPSTREAM_REPO_DIR` `GIT_SLICE_SLICE_REPO_DIR` envs
 * @param name
 * @returns
 */
export const prepareTestEnvs = async (name: string) => {
    const key = String(new Date().getTime())
    const upstreamDir = path.join(process.cwd(), `.test_dir/${name}-${key}/upstream`)
    const sliceDir = path.join(process.cwd(), `.test_dir/${name}-${key}/slice`)

    fs.mkdirSync(upstreamDir, { recursive: true })
    fs.mkdirSync(sliceDir, { recursive: true })

    process.env.GIT_SLICE_UPSTREAM_REPO_DIR = upstreamDir
    process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = 'upstream-main'
    process.env.GIT_SLICE_UPSTREAM_REPO_USERNAME = process.env.TEST_REPO_USERNAME
    process.env.GIT_SLICE_UPSTREAM_REPO_EMAIL = process.env.TEST_REPO_EMAIL
    process.env.GIT_SLICE_UPSTREAM_REPO_PASSWORD = process.env.TEST_REPO_PASSWORD
    process.env.GIT_SLICE_UPSTREAM_REPO_URL = process.env.TEST_REPO_URL

    process.env.GIT_SLICE_SLICE_REPO_DIR = sliceDir
    process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = 'slice-main'
    process.env.GIT_SLICE_SLICE_REPO_USERNAME = process.env.TEST_REPO_USERNAME
    process.env.GIT_SLICE_SLICE_REPO_EMAIL = process.env.TEST_REPO_EMAIL
    process.env.GIT_SLICE_SLICE_REPO_PASSWORD = process.env.TEST_REPO_PASSWORD
    process.env.GIT_SLICE_SLICE_REPO_URL = process.env.TEST_REPO_URL

    const testRepo = new TestRepo(process.env.TEST_REPO_URL, process.env.TEST_REPO_PASSWORD)

    await testRepo.init()

    const cleanUp = async (branches: string[]) => {
        await Promise.all(
            branches.map(branch => {
                try {
                    return testRepo.deleteBranch(branch)
                } catch (error) {
                    console.log(`Couldn't delete ${branch}`)
                }
            })
        )

        fs.removeSync(path.join(process.cwd(), `.test_dir/${name}-${key}`))
    }

    return {
        upstreamDir,
        sliceDir,
        key,
        testRepo,
        cleanUp,
    }
}

class TestRepo {
    private readonly owner: string
    private readonly repo: string
    private readonly octokit: Octokit

    private repositorId: string

    constructor(repoUrl: string, password: string) {
        const [, owner, repo] = /https:\/\/github\.com\/([\w+-_]+)\/([\w+-_]+)\.git/gi.exec(repoUrl)

        this.owner = owner
        this.repo = repo
        this.octokit = new Octokit({
            auth: password,
        })
    }

    async init(): Promise<void> {
        const {
            repository: { id: repositorId },
        } = await this.octokit.graphql<{ repository: { id: string } }>(
            `
            query($name: String!, $owner: String!) {
                repository(name: $name, owner: $owner) {
                    id
                }
            }
            `,
            {
                name: this.repo,
                owner: this.owner,
            }
        )

        this.repositorId = repositorId
    }

    async deleteBranch(branchName: string): Promise<void> {
        const {
            node: {
                refs: { nodes: refNodes },
            },
        } = await this.octokit.graphql<{ node: { refs: { nodes: { id: string }[] } } }>(
            `
            query($repositorId: ID!, $branchName: String!) {
                node(id: $repositorId) {
                    ... on Repository {
                        refs(first: 1, query: $branchName, refPrefix: "refs/heads/") {
                            nodes {
                                ... on Ref {
                                    id
                                }
                            }
                        }
                    }
                }
            }
            `,
            {
                repositorId: this.repositorId,
                branchName,
            }
        )

        const refId = refNodes[0].id

        await this.octokit.graphql(
            `
            mutation($refId: ID!) {
                deleteRef(
                    input: {
                        refId: $refId
                    }
                ) {
                    clientMutationId
                }
            }
            `,
            {
                refId,
            }
        )
    }

    async createNewBranchFromBranch(branchName: string, fromBranchName: string): Promise<void> {
        const {
            node: {
                refs: { nodes: refNodes },
            },
        } = await this.octokit.graphql<{ node: { refs: { nodes: { target: { oid: string } }[] } } }>(
            `
            query($repositorId: ID!, $fromBranchName: String!) {
                node(id: $repositorId) {
                    ... on Repository {
                        refs(first: 1, query: $fromBranchName, refPrefix: "refs/heads/") {
                            nodes {
                                ... on Ref {
                                    target {
                                        oid
                                    }
                                }
                            }
                        }
                    }
                }
            }
            `,
            {
                repositorId: this.repositorId,
                fromBranchName,
            }
        )

        const oid = refNodes[0].target.oid

        await this.octokit.graphql(
            `
            mutation($name: String!, $repositoryId: ID!, $oid: GitObjectID!) {
                createRef(
                    input: {
                        name: $name,
                        repositoryId: $repositoryId,
                        oid: $oid
                    }
                ) {
                    clientMutationId
                }
            }
            `,
            {
                name: `refs/heads/${branchName}`,
                repositoryId: this.repositorId,
                oid,
            }
        )
    }
}
