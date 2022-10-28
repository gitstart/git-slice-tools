import { ResetMode, SimpleGit } from 'simple-git'
import {
    cleanAndDeleteLocalBranch,
    copyFiles,
    createCommitAndPushCurrentChanges,
    getGitSliceIgoreConfig,
    logger,
    pullRemoteBranchIntoCurrentBranch,
} from '../common'
import { ActionInputs } from '../types'

export const push = async (
    sliceGit: SimpleGit,
    upstreamGit: SimpleGit,
    actionInputs: ActionInputs,
    sliceBranch: string,
    commitMsg: string,
    forcePush: boolean
): Promise<void> => {
    logger.logInputs('push', { sliceBranch, commitMsg, forcePush })

    if (!actionInputs.pushCommitMsgRegex.test(commitMsg)) {
        throw new Error('Commit message failed PUSH_COMMIT_MSG_REGEX')
    }

    // we need to checkout the upstream main branch to get the last '.gitsliceignore'
    await upstreamGit.reset(ResetMode.HARD)
    await upstreamGit.checkout(actionInputs.upstreamRepo.defaultBranch)

    const upstreamGitSliceIgnore = getGitSliceIgoreConfig(actionInputs.upstreamRepo.dir)
    // We will never push changes of `.gitsliceignore`, this file belongs to upstream only
    const resolvedGitSliceIgnoreFiles = [...upstreamGitSliceIgnore, ...actionInputs.sliceIgnores, '.gitsliceignore']

    const upstreamBranch = actionInputs.pushBranchNameTemplate.replace('<branch_name>', sliceBranch)

    await cleanAndDeleteLocalBranch(sliceGit, 'Slice', actionInputs.sliceRepo.defaultBranch, sliceBranch)

    // Find the oid from last gitslice:*** commit

    logger.logWriteLine('Slice', `Finding the last git-slice:*** commit...`)

    const logs = await sliceGit.log({ maxCount: 20 })
    const lastGitSlicePullLog = logs.all.find(x => /^git-slice:.*$/.test(x.message.trim()))

    if (!lastGitSlicePullLog) {
        logger.logExtendLastLine('Not found!')

        throw new Error('Not found git-slice:*** commit in last 20 commits')
    }

    const currentSyncUpstreamCommitId = lastGitSlicePullLog.message.trim().split(':')[1]

    logger.logExtendLastLine(`${currentSyncUpstreamCommitId}\n`)
    logger.logWriteLine('Slice', `Checkout branch '${sliceBranch}'...`)

    try {
        await sliceGit.checkout(sliceBranch)
        await sliceGit.pull('origin', sliceBranch)

        logger.logExtendLastLine('Done!')
    } catch (error) {
        // noop
        logger.logExtendLastLine('Not found!')

        throw error
    }

    await pullRemoteBranchIntoCurrentBranch('Slice', sliceGit, actionInputs.sliceRepo.defaultBranch, sliceBranch)
    await cleanAndDeleteLocalBranch(upstreamGit, 'Upstream', actionInputs.upstreamRepo.defaultBranch, upstreamBranch)

    let upstreamBranchExists = false

    try {
        logger.logWriteLine('Upstream', `Check remote branch '${upstreamBranch}'...`)

        await upstreamGit.show(`remotes/origin/${upstreamBranch}`)

        upstreamBranchExists = true

        logger.logExtendLastLine('Existed!\n')
    } catch (error) {
        logger.logExtendLastLine('Not found!\n')
    }

    if (!upstreamBranchExists || forcePush) {
        logger.logWriteLine('Upstream', `Checkout new branch '${upstreamBranch}'...`)

        await upstreamGit.checkoutLocalBranch(upstreamBranch)

        logger.logExtendLastLine('Done!\n')

        const diffFiles = await copyFiles(
            upstreamGit,
            actionInputs.sliceRepo.dir,
            actionInputs.upstreamRepo.dir,
            resolvedGitSliceIgnoreFiles,
            'Upstream'
        )

        if (!diffFiles.length) {
            return
        }

        await createCommitAndPushCurrentChanges(
            upstreamGit,
            commitMsg,
            upstreamBranch,
            'Upstream',
            upstreamBranchExists && forcePush
        )

        return
    }

    logger.logWriteLine('Upstream', `Checkout branch '${upstreamBranch}'...`)

    await upstreamGit.checkout(upstreamBranch)
    await upstreamGit.pull('origin', upstreamBranch)
    await pullRemoteBranchIntoCurrentBranch(
        'Upstream',
        upstreamGit,
        // we merge the revision which current slice's default branch is synced at
        // instead of upstream's default branch which can be missed matching while running in parallel
        currentSyncUpstreamCommitId,
        upstreamBranch,
        // We ignore merging error on upstream to allow pushing updates when there are conflicts on upstream repo.
        // In this case, commit below will contain both updates + merge base commit
        true
    )

    logger.logExtendLastLine('Done!\n')

    const diffFiles = await copyFiles(
        upstreamGit,
        actionInputs.sliceRepo.dir,
        actionInputs.upstreamRepo.dir,
        resolvedGitSliceIgnoreFiles,
        'Upstream'
    )

    if (!diffFiles.length) {
        return
    }

    await createCommitAndPushCurrentChanges(upstreamGit, commitMsg, upstreamBranch, 'Upstream', false)
}
