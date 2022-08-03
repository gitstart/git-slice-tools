import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { terminal } from 'terminal-kit'
import { logExtendLastLine, logWriteLine } from '../common'
import { ActionInputs, LogScope } from '../types'

export const pullIssue = async (
    actionInputs: ActionInputs,
    fromIssueNumber: number,
    toIssueNumber: number
): Promise<void> => {
    terminal('-'.repeat(30) + '\n')
    terminal(
        `Performing pull-issue job with ${JSON.stringify({
            fromIssueNumber,
            toIssueNumber,
        })}...\n`
    )

    const { sliceRepo, upstreamRepo } = actionInputs
    const upstreamLogScope: LogScope = actionInputs.isOpenSourceFlow ? 'OpenSource' : 'Upstream'
    const upstreamGitUrlObject = actionInputs.isOpenSourceFlow
        ? gitUrlParse(actionInputs.openSourceUrl)
        : gitUrlParse(upstreamRepo.gitHttpUri)
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

    logWriteLine(upstreamLogScope, `Getting issue...`)

    const { data: upstreamIssue } = await upstreamOctokit.rest.issues.get({
        owner: upstreamGitUrlObject.owner,
        repo: upstreamGitUrlObject.name,
        issue_number: fromIssueNumber,
    })

    logExtendLastLine(`Done!`)

    const { title, body } = upstreamIssue

    if (toIssueNumber > 0) {
        logWriteLine('Slice', `Updating issue #${toIssueNumber}...`)

        await sliceOctokit.rest.issues.update({
            owner: sliceGitUrlObject.owner,
            repo: sliceGitUrlObject.name,
            issue_number: toIssueNumber,
            title,
            body,
        })

        logExtendLastLine(`Done!`)

        return
    }

    logWriteLine('Slice', `Creating new issue...`)

    const { data: sliceIssue } = await sliceOctokit.rest.issues.create({
        owner: sliceGitUrlObject.owner,
        repo: sliceGitUrlObject.name,
        title,
        body,
    })

    logExtendLastLine(`Done! -> ${sliceIssue.html_url}`)
}
