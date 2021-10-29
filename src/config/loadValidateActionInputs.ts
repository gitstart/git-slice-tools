import dotenv from 'dotenv'
import fs from 'fs'
import { ActionInputs } from '../types'

dotenv.config()

export const loadValidateActionInputs = (): ActionInputs => {
    if (!process.env.GIT_SLICE_UPSTREAM_REPO_DIR || !fs.existsSync(process.env.GIT_SLICE_UPSTREAM_REPO_DIR)) {
        throw new Error(`Missing 'UPSTREAM_REPO_DIR' or 'UPSTREAM_REPO_DIR' doesn't exist `)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_DIR || !fs.existsSync(process.env.GIT_SLICE_SLICE_REPO_DIR)) {
        throw new Error(`Missing 'SLICE_REPO_DIR' or 'SLICE_REPO_DIR' doesn't exist `)
    }

    if (!process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH) {
        throw new Error(`Missing 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH'`)
    }

    if (!process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH) {
        throw new Error(`Missing 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH'`)
    }

    return {
        upstreamRepoDir: process.env.GIT_SLICE_SLICE_REPO_DIR,
        upstreamDefaultBranch: process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH,
        sliceRepoDir: process.env.GIT_SLICE_UPSTREAM_REPO_DIR,
        sliceDefaultBranch: process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH,
    }
}
