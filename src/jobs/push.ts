import { CleanOptions, ResetMode, SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import { copyFiles, createCommitAndPushCurrentChanges, deleteSliceIgnoresFilesDirs } from '../common'
import { ActionInputs } from '../types'

const cleanAndDeleteLocalBranch = async (
    git: SimpleGit,
    gitLogPrefix: string,
    defaultBranch: string,
    branch: string
): Promise<void> => {
    terminal(`${gitLogPrefix}: Clean...`)

    await git.reset(ResetMode.HARD)
    await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)

    terminal('Done!\n')

    terminal(`${gitLogPrefix}: Fetch...`)

    await git.fetch('origin')

    terminal('Done!\n')

    terminal(`${gitLogPrefix}: Delete local branch '${branch}'...`)

    try {
        await git.checkout(defaultBranch)
        await git.branch(['-D', branch])
        await git.branch(['-Dr', branch])
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
    commitMsg: string,
    forcePush: boolean
): Promise<void> => {
    terminal('-'.repeat(30) + '\n')
    terminal(`Performing push job branch with ${JSON.stringify({ sliceBranch, commitMsg, forcePush })}...\n`)

    if (!actionInputs.pushCommitMsgRegex.test(commitMsg)) {
        throw new Error('Commit message failed PUSH_COMMIT_MSG_REGEX')
    }

    const upstreamBranch = actionInputs.pushBranchNameTemplate.replace('<branch_name>', sliceBranch)

    await cleanAndDeleteLocalBranch(sliceGit, 'Slice', actionInputs.sliceDefaultBranch, sliceBranch)

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

        await sliceGit.pull('origin', actionInputs.sliceDefaultBranch, ['--no-rebase'])
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

    await deleteSliceIgnoresFilesDirs(actionInputs.sliceIgnores, actionInputs.sliceRepoDir, 'Slice')

    await cleanAndDeleteLocalBranch(upstreamGit, 'Upstream', actionInputs.upstreamDefaultBranch, upstreamBranch)

    let upstreamBranchExists = false

    try {
        terminal(`Upstream: Check remote branch '${upstreamBranch}'...`)

        await upstreamGit.show(`remotes/origin/${upstreamBranch}`)

        upstreamBranchExists = true

        terminal('Existed!\n')
    } catch (error) {
        terminal('Not found!\n')
    }

    if (!upstreamBranchExists || forcePush) {
        terminal(`Upstream: Checkout new branch '${upstreamBranch}'...`)

        await upstreamGit.checkoutLocalBranch(upstreamBranch)

        terminal('Done!\n')

        const hasChanges = await copyFiles(
            upstreamGit,
            actionInputs.sliceRepoDir,
            actionInputs.upstreamRepoDir,
            actionInputs.sliceIgnores,
            'Upstream'
        )

        if (!hasChanges) {
            return
        }

        await createCommitAndPushCurrentChanges(upstreamGit, commitMsg, upstreamBranch, 'Upstream', true)

        return
    }

    terminal(`Upstream: Checkout branch '${upstreamBranch}'...`)

    await upstreamGit.checkout(upstreamBranch)
    await upstreamGit.pull('origin', upstreamBranch)

    terminal('Done!\n')

    const hasChanges = await copyFiles(
        upstreamGit,
        actionInputs.sliceRepoDir,
        actionInputs.upstreamRepoDir,
        actionInputs.sliceIgnores,
        'Upstream'
    )

    if (!hasChanges) {
        return
    }

    await createCommitAndPushCurrentChanges(upstreamGit, commitMsg, upstreamBranch, 'Upstream', false)
}
