import { SimpleGit } from 'simple-git'
import {
    checkoutAndPullLastVersion,
    copyFiles,
    createCommitAndPushCurrentChanges,
    deleteGitSliceIgnoreFiles,
    getGitSliceIgoreConfig,
    logger,
} from '../common'
import { ActionInputs } from '../types'

export const pull = async (sliceGit: SimpleGit, upstreamGit: SimpleGit, actionInputs: ActionInputs): Promise<void> => {
    logger.logInputs('pull')

    await checkoutAndPullLastVersion(upstreamGit, 'Upstream', actionInputs.upstreamRepo.defaultBranch)

    if (actionInputs.isOpenSourceFlow) {
        await checkoutAndPullLastVersion(upstreamGit, 'OpenSource', actionInputs.upstreamRepo.defaultBranch, true)

        logger.logWriteLine(
            'Upstream',
            `Push '${actionInputs.upstreamRepo.defaultBranch}' branch to make sure it up-to-date open-source repo ...`
        )

        await upstreamGit.push('origin', actionInputs.upstreamRepo.defaultBranch)

        logger.logExtendLastLine('Done!')
    }

    logger.logWriteLine('Upstream', `Get last commit oid...`)

    const upstreamLastCommitId = await upstreamGit.revparse('HEAD')

    logger.logExtendLastLine(`Done! -> ${upstreamLastCommitId}`)

    await checkoutAndPullLastVersion(sliceGit, 'Slice', actionInputs.sliceRepo.defaultBranch)

    const upstreamGitSliceIgnore = getGitSliceIgoreConfig(actionInputs.upstreamRepo.dir)
    const resolvedGitSliceIgnoreFiles = [...upstreamGitSliceIgnore, ...actionInputs.sliceIgnores]

    await deleteGitSliceIgnoreFiles(resolvedGitSliceIgnoreFiles, actionInputs.upstreamRepo.dir, 'Upstream')

    const diffFiles = await copyFiles(
        sliceGit,
        actionInputs.upstreamRepo.dir,
        actionInputs.sliceRepo.dir,
        actionInputs.sliceIgnores,
        'Slice'
    )

    if (diffFiles.length !== 0) {
        await sliceGit.raw('add', '.', '--force')

        await createCommitAndPushCurrentChanges(
            sliceGit,
            `git-slice:${upstreamLastCommitId}`,
            actionInputs.sliceRepo.defaultBranch,
            'Slice'
        )
    }

    logger.logWriteLine('Slice', `Up to date`)
}
