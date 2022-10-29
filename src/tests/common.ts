import fs from 'fs-extra'
import path from 'path'
import process from 'process'
import { Octokit } from 'octokit'
import { terminal } from 'terminal-kit'

export const SAMPLE_BRANCHES = {
    upstreamMain: 'upstream-main',
    sliceMain: 'slice-main',
    correctedSlicedMain: 'sliced-main',
} as const

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
    process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.upstreamMain
    process.env.GIT_SLICE_UPSTREAM_REPO_USERNAME = process.env.TEST_REPO_USERNAME
    process.env.GIT_SLICE_UPSTREAM_REPO_EMAIL = process.env.TEST_REPO_EMAIL
    process.env.GIT_SLICE_UPSTREAM_REPO_PASSWORD = process.env.TEST_REPO_PASSWORD
    process.env.GIT_SLICE_UPSTREAM_REPO_URL = process.env.TEST_REPO_URL

    process.env.GIT_SLICE_SLICE_REPO_DIR = sliceDir
    process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.correctedSlicedMain
    process.env.GIT_SLICE_SLICE_REPO_USERNAME = process.env.TEST_REPO_USERNAME
    process.env.GIT_SLICE_SLICE_REPO_EMAIL = process.env.TEST_REPO_EMAIL
    process.env.GIT_SLICE_SLICE_REPO_PASSWORD = process.env.TEST_REPO_PASSWORD
    process.env.GIT_SLICE_SLICE_REPO_URL = process.env.TEST_REPO_URL

    process.env.GIT_SLICE_PUSH_BRANCH_NAME_TEMPLATE = 'pushed-<branch_name>'

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

export const prependTextFile = async (rootDir: string, filePath: string, text: string) => {
    const absFilePath = path.resolve(rootDir, filePath)
    let fileContent = (await fs.readFile(absFilePath)).toString()
    fileContent = `${text}\n${fileContent}`

    await fs.writeFile(absFilePath, fileContent, { flag: 'w' })

    return fileContent
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
            node: { ref },
        } = await this.octokit.graphql<{ node: { ref: { id: string } | undefined } }>(
            `
            query($repositorId: ID!, $qualifiedName: String!) {
                node(id: $repositorId) {
                    ... on Repository {
                        ref(qualifiedName: $qualifiedName) {
                            id
                        }
                    }
                }
            }
            `,
            {
                repositorId: this.repositorId,
                qualifiedName: `refs/heads/${branchName}`,
            }
        )

        if (!ref?.id) {
            return
        }

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
                refId: ref.id,
            }
        )
    }

    async createNewBranchFromBranch(branchName: string, fromBranchName: string): Promise<void> {
        const {
            node: {
                ref: {
                    target: { oid },
                },
            },
        } = await this.octokit.graphql<{ node: { ref: { target: { oid: string } } } }>(
            `
            query($repositorId: ID!, $qualifiedName: String!) {
                node(id: $repositorId) {
                    ... on Repository {
                        ref(qualifiedName: $qualifiedName) {
                            target {
                                oid
                            }
                        }
                    }
                }
            }
            `,
            {
                repositorId: this.repositorId,
                qualifiedName: `refs/heads/${fromBranchName}`,
            }
        )

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

    async getBranchId(branchName: string): Promise<string | undefined> {
        const {
            node: { ref },
        } = await this.octokit.graphql<{ node: { ref: { id: string } } }>(
            `
            query($repositorId: ID!, $qualifiedName: String!) {
                node(id: $repositorId) {
                    ... on Repository {
                        ref(qualifiedName: $qualifiedName) {
                            id
                        }
                    }
                }
            }
            `,
            {
                repositorId: this.repositorId,
                qualifiedName: `refs/heads/${branchName}`,
            }
        )

        return ref?.id
    }
}
