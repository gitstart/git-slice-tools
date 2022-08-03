import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { terminal } from 'terminal-kit'
import { delay, logExtendLastLine, logWriteLine } from '../common'
import { ActionInputs } from '../types'

export const pullReview = async (
    actionInputs: ActionInputs,
    slicePrNumber: number,
    upstreamPrReviewLink: string
): Promise<void> => {
    terminal('-'.repeat(30) + '\n')
    terminal(`Performing pull-review job with ${JSON.stringify({ slicePrNumber, upstreamPrReviewLink })}...\n`)

    const { sliceRepo, upstreamRepo } = actionInputs
    const upstreamGitUrlObject = gitUrlParse(upstreamRepo.gitHttpUri)
    const sliceGitUrlObject = gitUrlParse(sliceRepo.gitHttpUri)
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

    const upstreamPrNumber = Number(prReivewLinkRegResult[1])
    const upstreamPrReviewNumber = Number(prReivewLinkRegResult[2])

    logWriteLine('Upstream', `Getting PR review...`)

    const { data: upstreamReview } = await upstreamOctokit.rest.pulls.getReview({
        owner: upstreamGitUrlObject.owner,
        repo: upstreamGitUrlObject.name,
        pull_number: upstreamPrNumber,
        review_id: upstreamPrReviewNumber,
    })

    logExtendLastLine(`Done!`)

    logWriteLine('Upstream', `Getting PR review comments...`)

    const { data: upstreamReviewComments } = await upstreamOctokit.rest.pulls.listCommentsForReview({
        owner: upstreamGitUrlObject.owner,
        repo: upstreamGitUrlObject.name,
        pull_number: upstreamPrNumber,
        review_id: upstreamPrReviewNumber,
        // Assume that 100 comments per review is good limit
        per_page: 100,
        page: 1,
    })

    logExtendLastLine(`Done!`)

    logWriteLine('Upstream', `Getting PR review comments details...`)

    const detailedPullReviewComments: {
        path: string
        position?: number
        body: string
        line?: number
        side?: string
        start_line?: number
        start_side?: string
    }[] = []

    for (const comment of upstreamReviewComments) {
        const { data: upstreamReviewComment } = await upstreamOctokit.rest.pulls.getReviewComment({
            owner: upstreamGitUrlObject.owner,
            repo: upstreamGitUrlObject.name,
            pull_number: upstreamPrNumber,
            review_id: upstreamPrReviewNumber,
            comment_id: comment.id,
        })

        const { path, body, user } = comment

        detailedPullReviewComments.push({
            path,
            body: `From **_${user?.login}_**:\n${body}`,
            side: upstreamReviewComment.side ?? undefined,
            start_side: upstreamReviewComment.start_side ?? undefined,
            line: upstreamReviewComment.original_line ?? upstreamReviewComment.line ?? undefined,
            start_line: upstreamReviewComment.original_start_line ?? upstreamReviewComment.start_line ?? undefined,
        })

        // Just to make sure we don't reach github api limit
        await delay(500)
    }

    logExtendLastLine(`Done!`)

    logWriteLine('Slice', `Creating PR review...`)

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

    logExtendLastLine(`Done! -> ${sliceReview.html_url}`)
}
