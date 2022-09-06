import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { delay, logger } from '../common'
import { ActionInputs, LogScope } from '../types'

export const pullReview = async (
    actionInputs: ActionInputs,
    slicePrNumber: number,
    upstreamPrReviewLink: string
): Promise<void> => {
    logger.logInputs('pull-review', { slicePrNumber, upstreamPrReviewLink })

    const { sliceRepo, upstreamRepo, isOpenSourceFlow, openSourceUrl } = actionInputs
    const upstreamGitUrlObject = gitUrlParse(upstreamRepo.gitHttpUri)
    const sliceGitUrlObject = gitUrlParse(sliceRepo.gitHttpUri)
    const openSourceGitUrlObject = isOpenSourceFlow ? gitUrlParse(openSourceUrl) : null
    const upstreamOctokit = new Octokit({
        auth: upstreamRepo.userToken,
    })
    const sliceOctokit = new Octokit({
        auth: actionInputs.sliceRepo.userToken,
    })

    if (upstreamGitUrlObject.source !== 'github.com') {
        throw new Error(`Unsuported codehost '${upstreamGitUrlObject.source}'`)
    }

    const prReivewLinkRegResult = /\/pull\/(\d+)#pullrequestreview-(\d+)$/i.exec(upstreamPrReviewLink)

    if (!prReivewLinkRegResult || !prReivewLinkRegResult[1] || !prReivewLinkRegResult[2]) {
        throw new Error(`Invalid pr-preview-link '${upstreamPrReviewLink}'`)
    }

    const targetPrNumber = Number(prReivewLinkRegResult[1])
    const targetPrReviewNumber = Number(prReivewLinkRegResult[2])

    let targetGitUrlOwner = upstreamGitUrlObject.owner
    let targetGitUrlRepo = upstreamGitUrlObject.name
    let targetLogScope: LogScope = 'Upstream'

    if (isOpenSourceFlow) {
        targetGitUrlOwner = openSourceGitUrlObject.owner
        targetGitUrlRepo = openSourceGitUrlObject.name
        targetLogScope = 'OpenSource'
    }

    logger.logWriteLine(targetLogScope, `Getting PR review...`)

    const { data: upstreamReview } = await upstreamOctokit.rest.pulls.getReview({
        owner: targetGitUrlOwner,
        repo: targetGitUrlRepo,
        pull_number: targetPrNumber,
        review_id: targetPrReviewNumber,
    })

    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine(targetLogScope, `Getting PR review comments...`)

    const { data: targetReviewComments } = await upstreamOctokit.rest.pulls.listCommentsForReview({
        owner: targetGitUrlOwner,
        repo: targetGitUrlRepo,
        pull_number: targetPrNumber,
        review_id: targetPrReviewNumber,
        // Assume that 100 comments per review is good limit
        per_page: 100,
        page: 1,
    })

    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine(targetLogScope, `Getting PR review comments details...`)

    const detailedPullReviewComments: {
        path: string
        position?: number
        body: string
        line?: number
        side?: string
        start_line?: number
        start_side?: string
    }[] = []

    for (const comment of targetReviewComments) {
        const { data: targetReviewComment } = await upstreamOctokit.rest.pulls.getReviewComment({
            owner: targetGitUrlOwner,
            repo: targetGitUrlRepo,
            pull_number: targetPrNumber,
            review_id: targetPrReviewNumber,
            comment_id: comment.id,
        })

        const { path, body, user } = comment

        detailedPullReviewComments.push({
            path,
            body: `From **_${user?.login}_**:\n${body}`,
            side: targetReviewComment.side ?? undefined,
            start_side: targetReviewComment.start_side ?? undefined,
            line: targetReviewComment.original_line ?? targetReviewComment.line ?? undefined,
            start_line: targetReviewComment.original_start_line ?? targetReviewComment.start_line ?? undefined,
        })

        // Just to make sure we don't reach github api limit
        await delay(500)
    }

    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('Slice', `Creating PR review...`)

    const { data: sliceReview } = await sliceOctokit.rest.pulls.createReview({
        owner: sliceGitUrlObject.owner,
        repo: sliceGitUrlObject.name,
        pull_number: slicePrNumber,
        event: 'COMMENT',
        body: `Pull request review is synched from ${upstreamPrReviewLink} by git-slice-tools:\nFrom **_${
            upstreamReview.user?.login
        }_**:\n${upstreamReview.body ?? ''}`,
        comments: detailedPullReviewComments,
    })

    logger.logExtendLastLine(`Done! -> ${sliceReview.html_url}`)
}
