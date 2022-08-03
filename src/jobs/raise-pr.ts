import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { terminal } from 'terminal-kit'
import { isErrorLike, logExtendLastLine, logWriteLine } from '../common'
import { ActionInputs, LogScope } from '../types'

export const raisePr = async (actionInputs: ActionInputs, sliceBranch: string): Promise<void> => {
    terminal('-'.repeat(30) + '\n')
    terminal(`Performing raise-pr job with ${JSON.stringify({ sliceBranch })}...\n`)

    const { upstreamRepo, sliceRepo, isOpenSourceFlow, openSourceUrl } = actionInputs
    const upstreamGitUrlObject = gitUrlParse(upstreamRepo.gitHttpUri)
    const openSourceGitUrlObject = isOpenSourceFlow ? gitUrlParse(openSourceUrl) : null
    const sliceGitUrlObject = gitUrlParse(sliceRepo.gitHttpUri)

    if (upstreamGitUrlObject.source !== 'github.com') {
        throw new Error(`Unsuported codehost '${upstreamGitUrlObject.source}'`)
    }

    logWriteLine('Slice', `Finding PR (${sliceRepo.defaultBranch} <- ${sliceBranch}) ...`)

    const sliceOctokit = new Octokit({
        auth: sliceRepo.userToken,
    })

    let listResponse = await sliceOctokit.rest.pulls.list({
        owner: sliceGitUrlObject.owner,
        repo: sliceGitUrlObject.name,
        base: sliceRepo.defaultBranch,
        head: `${sliceGitUrlObject.owner}:${sliceBranch}`,
        state: 'open',
    })

    if (listResponse.data.length === 0) {
        logExtendLastLine(`Not found!`)

        throw new Error(`Couldn't find PR (${sliceRepo.defaultBranch} <- ${sliceBranch}) for getting title/description`)

        return
    }

    const { title, body, number: slicePrNumber } = listResponse.data[0]

    logExtendLastLine(`PR #${slicePrNumber}`)

    if (!body) {
        throw new Error('PR #${slicePrNumber} has an empty description')
    }

    const upstreamOctokit = new Octokit({
        auth: upstreamRepo.userToken,
    })

    const upstreamBranch = actionInputs.pushBranchNameTemplate.replace('<branch_name>', sliceBranch)

    let targetGitUrlOwner = upstreamGitUrlObject.owner
    let targetGitUrlRepo = upstreamGitUrlObject.name
    let targetLogScope: LogScope = 'Upstream'

    if (isOpenSourceFlow) {
        targetGitUrlOwner = openSourceGitUrlObject.owner
        targetGitUrlRepo = openSourceGitUrlObject.name
        targetLogScope = 'OpenSource'
    }

    logWriteLine(targetLogScope, `Checking existing PR (${upstreamRepo.defaultBranch} <- ${upstreamBranch})...`)

    listResponse = await upstreamOctokit.rest.pulls.list({
        owner: targetGitUrlOwner,
        repo: targetGitUrlRepo,
        base: upstreamRepo.defaultBranch,
        head: `${upstreamGitUrlObject.owner}:${upstreamBranch}`,
        state: 'open',
    })

    if (listResponse.data.length !== 0) {
        logExtendLastLine(`Found PR #${listResponse.data[0].number} (${listResponse.data[0].html_url})`)
        logWriteLine(targetLogScope, `Done!`)

        return
    }

    logExtendLastLine(`Not found!`)

    logWriteLine(targetLogScope, `Raising new PR (${upstreamRepo.defaultBranch} <- ${upstreamBranch})...`)

    const createResponse = await upstreamOctokit.rest.pulls.create({
        owner: targetGitUrlOwner,
        repo: targetGitUrlRepo,
        title,
        body,
        base: upstreamRepo.defaultBranch,
        head: `${upstreamGitUrlObject.owner}:${upstreamBranch}`,
        draft: actionInputs.prDraft,
        maintainer_can_modifyboolean: true,
    })
    const prNumber = createResponse.data.number

    logExtendLastLine(`Done PR #${prNumber}`)

    logWriteLine(targetLogScope, `Adding assignees into PR #${prNumber}...`)
    try {
        await upstreamOctokit.rest.issues.addAssignees({
            issue_number: prNumber,
            owner: targetGitUrlOwner,
            repo: targetGitUrlRepo,
            assignees: [upstreamRepo.username],
        })

        logExtendLastLine(`Done!`)
    } catch (error) {
        if (isErrorLike(error)) {
            terminal(`Failed with following error: '${error.message}'\n`)

            return
        }
    }

    if (actionInputs.prLabels.length) {
        logWriteLine(targetLogScope, `Adding labels into PR #${prNumber}...`)
        try {
            await upstreamOctokit.rest.issues.addLabels({
                issue_number: prNumber,
                owner: upstreamGitUrlObject.owner,
                repo: targetGitUrlRepo,
                labels: actionInputs.prLabels,
            })

            logExtendLastLine(`Done!`)
        } catch (error) {
            if (isErrorLike(error)) {
                terminal(`Failed with following error: '${error.message}'\n`)

                return
            }
        }
    }

    logWriteLine(targetLogScope, `Created PR #${prNumber} (${createResponse.data.html_url}) successfully`)
}
