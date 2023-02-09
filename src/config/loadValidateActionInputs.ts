import { AUTO_CO_AUTHORS_COMMITS_OPTIONS } from '../common'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { ActionInputs } from '../types'

export const loadValidateActionInputs = (envFilePath?: string, ignoreCheckDirs = false): ActionInputs => {
    const ignoreDotenv = process.env.TEST_ENV === 'true'

    if (!ignoreDotenv) {
        if (envFilePath && !fs.existsSync(path.resolve(process.cwd(), envFilePath))) {
            throw new Error(`${envFilePath} doesn't exist`)
        }

        dotenv.config(envFilePath ? { path: envFilePath } : undefined)
    }

    const forceInit = !process.env.GIT_SLICE_FORCE_GIT_INIT || process.env.GIT_SLICE_FORCE_GIT_INIT !== 'false'

    if (
        !ignoreCheckDirs &&
        (!process.env.GIT_SLICE_UPSTREAM_REPO_DIR ||
            !fs.existsSync(path.resolve(process.cwd(), process.env.GIT_SLICE_UPSTREAM_REPO_DIR)))
    ) {
        throw new Error(`Missing 'UPSTREAM_REPO_DIR' or 'UPSTREAM_REPO_DIR' doesn't exist `)
    }

    if (
        !ignoreCheckDirs &&
        (!process.env.GIT_SLICE_SLICE_REPO_DIR ||
            !fs.existsSync(path.resolve(process.cwd(), process.env.GIT_SLICE_SLICE_REPO_DIR)))
    ) {
        throw new Error(`Missing 'SLICE_REPO_DIR' or 'SLICE_REPO_DIR' doesn't exist `)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH) {
        throw new Error(`Missing 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH'`)
    }

    if (!process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH) {
        throw new Error(`Missing 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH'`)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_USERNAME) {
        throw new Error(`Missing 'GIT_SLICE_SLICE_REPO_USERNAME'`)
    }

    if (!process.env.GIT_SLICE_UPSTREAM_REPO_USERNAME) {
        throw new Error(`Missing 'GIT_SLICE_UPSTREAM_REPO_USERNAME'`)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_PASSWORD) {
        throw new Error(`Missing 'GIT_SLICE_SLICE_REPO_PASSWORD'`)
    }

    if (!process.env.GIT_SLICE_UPSTREAM_REPO_PASSWORD) {
        throw new Error(`Missing 'GIT_SLICE_UPSTREAM_REPO_PASSWORD'`)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_URL) {
        throw new Error(`Missing 'GIT_SLICE_SLICE_REPO_URL'`)
    }

    if (!process.env.GIT_SLICE_UPSTREAM_REPO_URL) {
        throw new Error(`Missing 'GIT_SLICE_UPSTREAM_REPO_URL'`)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_EMAIL) {
        throw new Error(`Missing 'GIT_SLICE_SLICE_REPO_EMAIL'`)
    }

    if (!process.env.GIT_SLICE_UPSTREAM_REPO_EMAIL) {
        throw new Error(`Missing 'GIT_SLICE_UPSTREAM_REPO_EMAIL'`)
    }

    const sliceIgnores: string[] = ['.github', '!.github/PULL_REQUEST_TEMPLATE.md', 'git-slice.json']
    if (process.env.GIT_SLICE_SLICE_IGNORES) {
        try {
            const parsedSliceIgnores = JSON.parse(process.env.GIT_SLICE_SLICE_IGNORES)

            if (!Array.isArray(parsedSliceIgnores)) {
                throw new Error()
            }

            sliceIgnores.push(...parsedSliceIgnores)
        } catch (error) {
            throw new Error(`Parsing 'GIT_SLICE_SLICE_IGNORES' failed`)
        }
    }

    const pushBranchNameTemplate = process.env.GIT_SLICE_PUSH_BRANCH_NAME_TEMPLATE || '<branch_name>'
    const pushCommitMsgRegex = new RegExp(process.env.GIT_SLICE_PUSH_COMMIT_MSG_REGEX || '.*', 'gi')

    const prLabels: string[] = []
    if (process.env.GIT_SLICE_PR_LABELS) {
        try {
            const parsedPRLabels = JSON.parse(process.env.GIT_SLICE_PR_LABELS)

            if (!Array.isArray(parsedPRLabels)) {
                throw new Error()
            }

            prLabels.push(...parsedPRLabels)
        } catch (error) {
            throw new Error(`Parsing 'GIT_SLICE_PR_LABELS' failed`)
        }
    }

    const prDraft = !process.env.GIT_SLICE_PR_DRAFT || process.env.GIT_SLICE_PR_DRAFT !== 'false'
    const isOpenSourceFlow = process.env.GIT_SLICE_OPEN_SOURCE_FLOW === 'true'
    const openSourceUrl = process.env.GIT_SLICE_OPEN_SOURCE_URL
    const openSourceAutoCoAuthorsCommit =
        process.env.GIT_SLICE_OPEN_SOURCE_AUTO_CO_AUTHORS_COMMITS || AUTO_CO_AUTHORS_COMMITS_OPTIONS.GitLogs

    if (isOpenSourceFlow && !openSourceUrl) {
        throw new Error(`Missing 'GIT_SLICE_OPEN_SOURCE_URL'`)
    }

    if (!(Object.values(AUTO_CO_AUTHORS_COMMITS_OPTIONS) as string[]).includes(openSourceAutoCoAuthorsCommit)) {
        throw new Error(
            `Invalid 'GIT_SLICE_OPEN_SOURCE_AUTO_CO_AUTHORS_COMMITS' should be on of [${Object.values(
                AUTO_CO_AUTHORS_COMMITS_OPTIONS
            ).join(', ')}]`
        )
    }

    return {
        sliceIgnores,
        pushBranchNameTemplate,
        pushCommitMsgRegex,
        forceInit,
        prLabels,
        prDraft,
        isOpenSourceFlow,
        openSourceUrl,
        openSourceInstanceName: process.env.GIT_SLICE_OPEN_SOURCE_INSTANCE_NAME,
        openSourceManagerProjectView: process.env.GIT_SLICE_OPEN_SOURCE_MANAGER_PROJECT_VIEW,
        openSourceTeamReviewingCommittee: process.env.GIT_SLICE_OPEN_SOURCE_TEAM_REVIEWING_COMMITTEE,
        autoCoAuthorsCommits: openSourceAutoCoAuthorsCommit,
        sliceRepo: {
            name: 'Slice',
            dir: path.resolve(process.cwd(), process.env.GIT_SLICE_SLICE_REPO_DIR),
            defaultBranch: process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH,
            username: process.env.GIT_SLICE_SLICE_REPO_USERNAME,
            userEmail: process.env.GIT_SLICE_SLICE_REPO_EMAIL,
            userToken: process.env.GIT_SLICE_SLICE_REPO_PASSWORD,
            gitHttpUri: process.env.GIT_SLICE_SLICE_REPO_URL,
        },
        upstreamRepo: {
            name: 'Upstream',
            dir: path.resolve(process.cwd(), process.env.GIT_SLICE_UPSTREAM_REPO_DIR),
            defaultBranch: process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH,
            username: process.env.GIT_SLICE_UPSTREAM_REPO_USERNAME,
            userEmail: process.env.GIT_SLICE_UPSTREAM_REPO_EMAIL,
            userToken: process.env.GIT_SLICE_UPSTREAM_REPO_PASSWORD,
            gitHttpUri: process.env.GIT_SLICE_UPSTREAM_REPO_URL,
        },
    }
}
