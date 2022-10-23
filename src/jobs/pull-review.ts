import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { delay, logger } from '../common'
import { ActionInputs, LogScope } from '../types'

export const pullReview = async (
    actionInputs: ActionInputs,
    slicePrNumber: number,
    upstreamPrReviewOrCommentLink: string
): Promise<void> => {
    logger.logInputs('pull-review', { slicePrNumber, upstreamPrReviewOrCommentLink })

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

    const inputLinkRegex = /\/pull\/(\d+)#(pullrequestreview|issuecomment)-(\d+)/i
    const inputLinkRegexResult = inputLinkRegex.exec(upstreamPrReviewOrCommentLink)

    if (!inputLinkRegexResult) {
        throw new Error(`Invalid PR review/comment url: '${upstreamPrReviewOrCommentLink}'`)
    }

    let targetGitUrlOwner = upstreamGitUrlObject.owner
    let targetGitUrlRepo = upstreamGitUrlObject.name
    let targetLogScope: LogScope = 'Upstream'

    if (isOpenSourceFlow) {
        targetGitUrlOwner = openSourceGitUrlObject.owner
        targetGitUrlRepo = openSourceGitUrlObject.name
        targetLogScope = 'OpenSource'
    }

    const targetPrNumber = Number(inputLinkRegexResult[1])
    const instanceNumber = Number(inputLinkRegexResult[3])
    const instanceType = inputLinkRegexResult[2] as keyof typeof PullReviewActions

    await PullReviewActions[instanceType](
        targetLogScope,
        upstreamPrReviewOrCommentLink,
        upstreamOctokit,
        targetGitUrlOwner,
        targetGitUrlRepo,
        targetPrNumber,
        instanceNumber,
        sliceOctokit,
        sliceGitUrlObject.owner,
        sliceGitUrlObject.name,
        slicePrNumber
    )
}

const pullPrComment = async (
    targetLogScope: LogScope,
    upstreamPrReviewOrCommentLink: string,
    upstreamOctokit: Octokit,
    targetGitUrlOwner: string,
    targetGitUrlRepo: string,
    _targetPrNumber: number,
    targetComment: number,
    sliceOctokit: Octokit,
    sliceGitUrlOwner: string,
    sliceGitUrlRepo: string,
    slicePrNumber: number
) => {
    logger.logWriteLine(targetLogScope, `Getting PR comment...`)

    const { data: upstreamComment } = await upstreamOctokit.rest.issues.getComment({
        owner: targetGitUrlOwner,
        repo: targetGitUrlRepo,
        comment_id: targetComment,
    })

    logger.logWriteLine('Slice', `Creating PR review...`)

    const { data: sliceComment } = await sliceOctokit.rest.issues.createComment({
        owner: sliceGitUrlOwner,
        repo: sliceGitUrlRepo,
        issue_number: slicePrNumber,
        body: `Pull request comment is synched from ${upstreamPrReviewOrCommentLink} by git-slice-tools:\nFrom **_${
            upstreamComment.user?.login
        }_**:\n${upstreamComment.body ?? ''}`,
    })

    logger.logExtendLastLine(`Done! -> ${sliceComment.html_url}`)
}

const pullPrReview = async (
    targetLogScope: LogScope,
    upstreamPrReviewOrCommentLink: string,
    upstreamOctokit: Octokit,
    targetGitUrlOwner: string,
    targetGitUrlRepo: string,
    targetPrNumber: number,
    targetReviewId: number,
    sliceOctokit: Octokit,
    sliceGitUrlOwner: string,
    sliceGitUrlRepo: string,
    slicePrNumber: number
) => {
    logger.logWriteLine(targetLogScope, `Getting PR review...`)

    const { data: upstreamReview } = await upstreamOctokit.rest.pulls.getReview({
        owner: targetGitUrlOwner,
        repo: targetGitUrlRepo,
        pull_number: targetPrNumber,
        review_id: targetReviewId,
    })

    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine(targetLogScope, `Getting PR review comments...`)

    const { data: targetReviewComments } = await upstreamOctokit.rest.pulls.listCommentsForReview({
        owner: targetGitUrlOwner,
        repo: targetGitUrlRepo,
        pull_number: targetPrNumber,
        review_id: targetReviewId,
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
            review_id: targetReviewId,
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
        owner: sliceGitUrlOwner,
        repo: sliceGitUrlRepo,
        pull_number: slicePrNumber,
        event: 'COMMENT',
        body: `Pull request review is synched from ${upstreamPrReviewOrCommentLink} by git-slice-tools:\nFrom **_${
            upstreamReview.user?.login
        }_**:\n${upstreamReview.body ?? ''}`,
        comments: detailedPullReviewComments,
    })

    logger.logExtendLastLine(`Done! -> ${sliceReview.html_url}`)
}

const PullReviewActions = {
    issuecomment: pullPrComment,
    pullrequestreview: pullPrReview,
} as const
