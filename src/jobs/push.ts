import { CleanOptions, ResetMode, SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import fs from 'fs-extra'
import { deleteSliceIgnoresFilesDirs } from '../common'
import { ActionInputs } from '../types'
import path from 'path'

const cleanAndDeleteLocalBranch = async (git: SimpleGit, gitLogPrefix: string, branch: string): Promise<void> => {
    terminal(`${gitLogPrefix}: Clean...`)

    await git.reset(ResetMode.HARD)
    await git.clean(CleanOptions.FORCE + CleanOptions.IGNORED_INCLUDED + CleanOptions.DRY_RUN)

    terminal('Done!\n')

    terminal(`${gitLogPrefix}: Fetch...`)

    await git.fetch('origin')

    terminal('Done!\n')

    terminal(`${gitLogPrefix}: Delete local branch '${branch}'...`)

    try {
        await git.deleteLocalBranch(branch, true)
    } catch (error) {
        // noop
    }

    terminal('Done!\n')
}

export const push = async (
    sliceGit: SimpleGit,
    upstreamGit: SimpleGit,
    actionInputs: ActionInputs,
    sliceBranch: string,
    commitMsg: string
): Promise<void> => {
    terminal('-'.repeat(30) + '\n')
    terminal(`Performing push job branch with ${JSON.stringify({ sliceBranch, commitMsg })}...\n`)

    if (!actionInputs.pushCommitMsgRegex.test(commitMsg)) {
        throw new Error('Commit message failed PUSH_COMMIT_MSG_REGEX')
    }

    const upstreamBranch = actionInputs.pushBranchNameTemplate.replace('<branch_name>', sliceBranch)

    await cleanAndDeleteLocalBranch(sliceGit, 'Slice', sliceBranch)

    terminal(`Slice: Checkout branch '${sliceBranch}'...`)

    try {
        await sliceGit.checkout(sliceBranch)
        await sliceGit.pull('origin', sliceBranch)

        terminal('Done!\n')
    } catch (error) {
        // noop
        terminal('Not found!\n')

        throw error
    }

    try {
        terminal(
            `Slice: Try to merge default branch '${actionInputs.sliceDefaultBranch}' into branch '${sliceBranch}'...`
        )

        await sliceGit.pull('origin', actionInputs.sliceDefaultBranch)
        const status = await sliceGit.status()

        if (status.ahead) {
            await sliceGit.push('origin', sliceBranch)
            terminal('Merged!\n')
        } else {
            terminal('None!\n')
        }
    } catch (error) {
        // noop
        terminal('Failed!\n')

        throw error
    }

    await cleanAndDeleteLocalBranch(upstreamGit, 'Upstream', upstreamBranch)

    terminal(`Upstream: Try to checkout branch '${upstreamBranch}'...`)
    let upstreamBranchIsNew = false

    try {
        await upstreamGit.checkout(upstreamBranch)
        await upstreamGit.pull('origin', upstreamBranch)

        terminal('Done!\n')
    } catch (error) {
        // noop
        terminal('Not found!\n')

        upstreamBranchIsNew = true

        terminal(`Upstream: Create new branch '${upstreamBranch}'...`)
    }

    deleteSliceIgnoresFilesDirs(actionInputs.sliceIgnores, actionInputs.sliceRepoDir, 'Slice')

    if (upstreamBranchIsNew) {
        terminal(`Upstream: Copying files from upstream to slice...`)

        fs.copySync(actionInputs.sliceRepoDir, actionInputs.upstreamRepoDir, {
            overwrite: true,
            dereference: true,
            filter: filePath => {
                return !filePath.startsWith(path.join(actionInputs.sliceRepoDir, '.git'))
            },
        })

        terminal('Done!\n')

        // TODO: Check delete file
    }
}
