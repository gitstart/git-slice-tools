import { Octokit } from 'octokit'
import {
    error,
    getCurrentIssueStatusOfProjectItem,
    getIssueOSSData,
    getProjectFields,
    getProjectManagerViewInfo,
    getProjectV2,
    getPullRequest,
    isMaintainerOfRepo,
    logger,
    OPEN_SOURCE_FIELDS,
    OPEN_SOURCE_STATUS_OPTIONS,
    updateIssueFieldValue,
} from '../../common'
import { ActionInputs } from '../../types'

export const pushPR = async (
    actionInputs: ActionInputs,
    maintainer: string,
    repoName: string,
    prNumber: number
): Promise<void> => {
    logger.logInputs('open-source push-pr ', { repoName, prNumber, maintainer })

    const sliceOctokit = new Octokit({
        auth: actionInputs.sliceRepo.userToken,
    })
    const projectManangerView = getProjectManagerViewInfo(actionInputs.openSourceManagerProjectView)
    repoName = repoName.replace(new RegExp(`^${projectManangerView.org}/`, 'i'), '')

    const isMaintainer = await isMaintainerOfRepo(sliceOctokit, projectManangerView.org, repoName, maintainer)
    const { projectId } = await getProjectV2(sliceOctokit, projectManangerView.org, projectManangerView.projectNumber)
    const { linkedIssues, prId } = await getPullRequest(sliceOctokit, projectManangerView.org, repoName, prNumber)

    if (!isMaintainer) {
        await error.throwWithGithubComment(
            sliceOctokit,
            prId,
            `@${maintainer} has to have 'ADMIN' or 'MAINTAIN' permission on \`${repoName}\` repository`
        )
    }

    if (!linkedIssues.length) {
        await error.throwWithGithubComment(sliceOctokit, prId, "Couldn't find any linked issues on this pull request")
    }

    // Assume that this PR has only one linked issue
    const { issueId, issueNumber } = linkedIssues[0]

    logger.logWriteLine('OpenSource', `This PR is linked to issue #${issueNumber}`)

    const issueOSSData = await getIssueOSSData(sliceOctokit, issueId)

    if (!issueOSSData) {
        await error.throwWithGithubComment(sliceOctokit, prId, "Couldn't find OSS data comment of this issue")
    }

    const { itemId } = issueOSSData
    const projectAllFields = await getProjectFields(sliceOctokit, projectId)
    const currentStatus = await getCurrentIssueStatusOfProjectItem(sliceOctokit, itemId)
    const statusField = projectAllFields.find(x => x.name === OPEN_SOURCE_FIELDS.Status)
    const statusClientReviewOption = statusField.options?.find(x => x.name === OPEN_SOURCE_STATUS_OPTIONS.ClientReview)

    if (currentStatus !== OPEN_SOURCE_STATUS_OPTIONS.ReadyToPushUpstream) {
        await error.throwWithGithubComment(
            sliceOctokit,
            prId,
            `Issue status has to be \`${OPEN_SOURCE_STATUS_OPTIONS.ReadyToPushUpstream}\` to execute this job`
        )
    }

    logger.logWriteLine('OpenSource', `Updating 'Status=Client review'...`)
    await updateIssueFieldValue(
        sliceOctokit,
        projectId,
        itemId,
        statusField.id,
        'SingleSelect',
        statusClientReviewOption?.id
    )
    logger.logExtendLastLine(`Done!`)
}
