import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { logger } from '../common'
import { ActionInputs, LogScope } from '../types'

export const pullIssue = async (
    actionInputs: ActionInputs,
    fromIssue: string,
    toIssueNumber: number,
    actor?: string
): Promise<void> => {
    logger.logInputs('pull-issue', { fromIssue, toIssueNumber })

    const { sliceRepo, upstreamRepo } = actionInputs
    const sliceGitUrlObject = gitUrlParse(sliceRepo.gitHttpUri)
    const upstreamOctokit = new Octokit({
        auth: upstreamRepo.userToken,
    })
    const sliceOctokit = new Octokit({
        auth: actionInputs.sliceRepo.userToken,
    })

    let upstreamLogScope: LogScope = 'Other'
    let upstreamGitUrlObject: gitUrlParse.GitUrl
    let fromIssueNumber = parseInt(fromIssue, 10)
    const isUpstreamIssueNumber = !isNaN(fromIssueNumber)

    if (isUpstreamIssueNumber) {
        // fromIssue is an issue number from upstream
        upstreamLogScope = actionInputs.isOpenSourceFlow ? 'OpenSource' : 'Upstream'
        upstreamGitUrlObject = actionInputs.isOpenSourceFlow
            ? gitUrlParse(actionInputs.openSourceUrl)
            : gitUrlParse(upstreamRepo.gitHttpUri)
    } else {
        // fromIssue is an issue link
        upstreamLogScope = 'Other'
        const regexResult = /(https:\/\/github\.com\/)?([^/]+\/[^/]+)\/issues\/(\d+)/gi.exec(fromIssue)

        if (!regexResult || !regexResult[2] || isNaN(parseInt(regexResult[3], 10))) {
            throw new Error(`Unsuported fromIssue arg '${fromIssue}'`)
        }

        fromIssueNumber = parseInt(regexResult[3], 10)
        upstreamGitUrlObject = gitUrlParse(`${regexResult[1] ?? 'https://github.com/'}${regexResult[2]}.git`)
    }

    if (upstreamGitUrlObject.source !== 'github.com') {
        throw new Error(`Unsuported codehost '${upstreamGitUrlObject.source}'`)
    }

    logger.logWriteLine(upstreamLogScope, `Getting issue...`)

    const { data: upstreamIssue } = await upstreamOctokit.rest.issues.get({
        owner: upstreamGitUrlObject.owner,
        repo: upstreamGitUrlObject.name,
        issue_number: fromIssueNumber,
    })

    logger.logExtendLastLine(`Done!`)

    const { title, body, html_url } = upstreamIssue
    const pulledIssueBody = `<!-- @${
        actor || actionInputs.sliceRepo.username
    } -->\nPulled from ${html_url} by git-slice-tools:\n${body}`

    if (toIssueNumber > 0) {
        logger.logWriteLine('Slice', `Updating issue #${toIssueNumber}...`)

        await sliceOctokit.rest.issues.update({
            owner: sliceGitUrlObject.owner,
            repo: sliceGitUrlObject.name,
            issue_number: toIssueNumber,
            title,
            body: pulledIssueBody,
        })

        logger.logExtendLastLine(`Done!`)

        return
    }

    logger.logWriteLine('Slice', `Creating new issue...`)

    const { data: sliceIssue } = await sliceOctokit.rest.issues.create({
        owner: sliceGitUrlObject.owner,
        repo: sliceGitUrlObject.name,
        title,
        body: pulledIssueBody,
    })

    logger.logExtendLastLine(`Done! -> ${sliceIssue.html_url}`)
}
