import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { CleanOptions, ResetMode, SimpleGit } from 'simple-git'
import { cleanAndDeleteLocalBranch, copyFiles, createCommitAndPushCurrentChanges, logger } from '../common'
import { ActionInputs } from '../types'

export const pullBranch = async (
    sliceGit: SimpleGit,
    upstreamGit: SimpleGit,
    actionInputs: ActionInputs,
    upstreamBranch: string,
    targetSliceBranch?: string
): Promise<void> => {
    logger.logInputs('pull-branch', { upstreamBranch, targetSliceBranch })

    const sliceBranch = `upstream-${upstreamBranch}`

    logger.logWriteLine('Upstream', `Checkout and pull last versions '${upstreamBranch}' branch...`)
    await upstreamGit.reset(ResetMode.HARD)
    await upstreamGit.checkout(upstreamBranch)
    await upstreamGit.reset(['--hard', `origin/${upstreamBranch}`])
    await upstreamGit.pull('origin', upstreamBranch)
    logger.logExtendLastLine('Done!')

    logger.logWriteLine('Upstream', `Clean...`)
    await upstreamGit.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)
    logger.logExtendLastLine('Done!')

    logger.logWriteLine('Slice', `Checkout and pull last versions '${actionInputs.sliceRepo.defaultBranch}' branch...`)
    await sliceGit.checkout(actionInputs.sliceRepo.defaultBranch)
    await sliceGit.reset(['--hard', `origin/${actionInputs.sliceRepo.defaultBranch}`])
    await sliceGit.pull('origin', actionInputs.sliceRepo.defaultBranch)
    logger.logExtendLastLine('Done!')

    logger.logWriteLine('Slice', `Clean...`)
    await sliceGit.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)
    logger.logExtendLastLine('Done!')

    logger.logWriteLine('Slice', `Checkout new branch '${sliceBranch}'...`)
    await cleanAndDeleteLocalBranch(sliceGit, 'Slice', actionInputs.sliceRepo.defaultBranch, sliceBranch)
    await sliceGit.checkoutLocalBranch(sliceBranch)
    logger.logExtendLastLine('Done!')

    logger.logWriteLine('Slice', `Copying diffs from upstream branch to slice branch...`)
    await copyFiles(
        sliceGit,
        actionInputs.upstreamRepo.dir,
        actionInputs.sliceRepo.dir,
        actionInputs.sliceIgnores,
        'Slice'
    )
    logger.logExtendLastLine('Done!')

    logger.logWriteLine('Slice', `Staging diffs...`)
    await sliceGit.raw('add', '.', '--force')
    logger.logExtendLastLine('Done!')

    await createCommitAndPushCurrentChanges(
        sliceGit,
        `feat: pull changes from upstream branch ${upstreamBranch}`,
        sliceBranch,
        'Slice',
        true
    )

    if (!targetSliceBranch) {
        logger.logWriteLine('Slice', `Pulled upstream branch '${upstreamBranch}' to slice branch ${sliceBranch}`)
        return
    }

    const sliceGitUrlObject = gitUrlParse(actionInputs.sliceRepo.gitHttpUri)
    const sliceOctokit = new Octokit({
        auth: actionInputs.sliceRepo.userToken,
    })

    logger.logWriteLine('Slice', `Finding PR (${targetSliceBranch} <- ${sliceBranch}) ...`)

    const listResponse = await sliceOctokit.rest.pulls.list({
        owner: sliceGitUrlObject.owner,
        repo: sliceGitUrlObject.name,
        base: targetSliceBranch,
        head: `${sliceGitUrlObject.owner}:${sliceBranch}`,
        state: 'open',
    })

    if (listResponse.data.length !== 0) {
        const { number: slicePrNumber, html_url } = listResponse.data[0]

        logger.logExtendLastLine(`PR #${slicePrNumber}`)

        logger.logWriteLine(
            'Slice',
            `Pulled upstream branch '${upstreamBranch}' to slice branch ${sliceBranch} and PR ${slicePrNumber} (${html_url}) is available`
        )
    }

    logger.logExtendLastLine(`Not found!`)

    logger.logWriteLine('Slice', `Raising new PR (${targetSliceBranch} <- ${sliceBranch})...`)
    const createResponse = await sliceOctokit.rest.pulls.create({
        owner: sliceGitUrlObject.owner,
        repo: sliceGitUrlObject.name,
        title: `${targetSliceBranch} <- upstream ${upstreamBranch}`,
        body: `This PR is for synching changes from branch ${upstreamBranch} on upstream repo to branch ${targetSliceBranch} on slice repo`,
        base: targetSliceBranch,
        head: `${sliceGitUrlObject.owner}:${sliceBranch}`,
        draft: actionInputs.prDraft,
        maintainer_can_modifyboolean: true,
    })
    logger.logExtendLastLine(`Done PR #${createResponse.data.number}`)

    logger.logWriteLine(
        'Slice',
        `Pulled upstream branch '${upstreamBranch}' to slice branch ${sliceBranch} and PR ${createResponse.data.number} (${createResponse.data.html_url}) is available`
    )
}
