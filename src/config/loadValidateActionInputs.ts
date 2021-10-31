import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { ActionInputs } from '../types'

dotenv.config()

export const loadValidateActionInputs = (): ActionInputs => {
    if (
        !process.env.GIT_SLICE_UPSTREAM_REPO_DIR ||
        !fs.existsSync(path.resolve(process.cwd(), process.env.GIT_SLICE_UPSTREAM_REPO_DIR))
    ) {
        throw new Error(`Missing 'UPSTREAM_REPO_DIR' or 'UPSTREAM_REPO_DIR' doesn't exist `)
    }

    if (
        !process.env.GIT_SLICE_SLICE_REPO_DIR ||
        !fs.existsSync(path.resolve(process.cwd(), process.env.GIT_SLICE_SLICE_REPO_DIR))
    ) {
        throw new Error(`Missing 'SLICE_REPO_DIR' or 'SLICE_REPO_DIR' doesn't exist `)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH) {
        throw new Error(`Missing 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH'`)
    }

    if (!process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH) {
        throw new Error(`Missing 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH'`)
    }

    const sliceIgnores: string[] = ['.github/workflows', 'git-slice.json']
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

    return {
        upstreamRepoDir: path.resolve(process.cwd(), process.env.GIT_SLICE_UPSTREAM_REPO_DIR),
        upstreamDefaultBranch: process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH,
        sliceRepoDir: path.resolve(process.cwd(), process.env.GIT_SLICE_SLICE_REPO_DIR),
        sliceDefaultBranch: process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH,
        sliceIgnores,
        pushBranchNameTemplate,
        pushCommitMsgRegex,
    }
}
