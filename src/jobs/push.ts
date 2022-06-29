import { CleanOptions, ResetMode, SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import {
    copyFiles,
    createCommitAndPushCurrentChanges,
    deleteSliceIgnoresFilesDirs,
    pullRemoteBranchIntoCurrentBranch,
} from '../common'
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
        await git.pull('origin', defaultBranch)
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
    terminal(`Performing push job with ${JSON.stringify({ sliceBranch, commitMsg, forcePush })}...\n`)

    if (!actionInputs.pushCommitMsgRegex.test(commitMsg)) {
        throw new Error('Commit message failed PUSH_COMMIT_MSG_REGEX')
    }

    const upstreamBranch = actionInputs.pushBranchNameTemplate.replace('<branch_name>', sliceBranch)

    await cleanAndDeleteLocalBranch(sliceGit, 'Slice', actionInputs.sliceRepo.defaultBranch, sliceBranch)

    // Find the oid from last gitslice:*** commit

    terminal(`Finding the last git-slice:*** commit...`)

    const logs = await sliceGit.log({ maxCount: 20 })
    const lastGitSlicePullLog = logs.all.find(x => /^git-slice:.*$/.test(x.message.trim()))

    if (!lastGitSlicePullLog) {
        terminal('Not found!\n')

        throw new Error('Not found git-slice:*** commit in last 20 commits')
    }

    const currentSyncUpstreamCommitId = lastGitSlicePullLog.message.trim().split(':')[1]

    terminal(`${currentSyncUpstreamCommitId}\n`)
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

    await pullRemoteBranchIntoCurrentBranch('Slice', sliceGit, actionInputs.sliceRepo.defaultBranch, sliceBranch)
    await deleteSliceIgnoresFilesDirs(actionInputs.sliceIgnores, actionInputs.sliceRepo.dir, 'Slice')
    await cleanAndDeleteLocalBranch(upstreamGit, 'Upstream', actionInputs.upstreamRepo.defaultBranch, upstreamBranch)

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

        const diffFiles = await copyFiles(
            upstreamGit,
            actionInputs.sliceRepo.dir,
            actionInputs.upstreamRepo.dir,
            actionInputs.sliceIgnores,
            'Upstream'
        )

        if (!diffFiles.length) {
            return
        }

        await createCommitAndPushCurrentChanges(upstreamGit, commitMsg, upstreamBranch, 'Upstream', true)

        return
    }

    terminal(`Upstream: Checkout branch '${upstreamBranch}'...`)

    await upstreamGit.checkout(upstreamBranch)
    await upstreamGit.pull('origin', upstreamBranch)
    await pullRemoteBranchIntoCurrentBranch(
        'Upstream',
        upstreamGit,
        // TODO: should we merge the revision which current slice's default branch is synced as
        // instead of upstream's default branch which can be missed matching..
        // actionInputs.upstreamRepo.defaultBranch,
        currentSyncUpstreamCommitId,
        upstreamBranch
    )

    terminal('Done!\n')

    const diffFiles = await copyFiles(
        upstreamGit,
        actionInputs.sliceRepo.dir,
        actionInputs.upstreamRepo.dir,
        actionInputs.sliceIgnores,
        'Upstream'
    )

    if (!diffFiles.length) {
        return
    }

    await createCommitAndPushCurrentChanges(upstreamGit, commitMsg, upstreamBranch, 'Upstream', false)
}
