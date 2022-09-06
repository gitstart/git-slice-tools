import { Octokit } from 'octokit'
import {
    addComment,
    error,
    getCurrentIssueStatusOfProjectItem,
    getIssueOSSData,
    getProjectFields,
    getProjectManagerViewInfo,
    getProjectV2,
    getPullRequest,
    isMemberOfTeam,
    logger,
    OPEN_SOURCE_COMMENT_PR_APPROVED,
    OPEN_SOURCE_FIELDS,
    OPEN_SOURCE_STATUS_OPTIONS,
    updateIssueFieldValue,
} from '../../common'
import { ActionInputs } from '../../types'

export const reviewerApprovePR = async (
    actionInputs: ActionInputs,
    reviewer: string,
    repoName: string,
    prNumber: number
): Promise<void> => {
    logger.logInputs('open-source reviewer-approve-pr', { reviewer, repoName, prNumber })

    const sliceOctokit = new Octokit({
        auth: actionInputs.sliceRepo.userToken,
    })
    const projectManangerView = getProjectManagerViewInfo(actionInputs.openSourceManagerProjectView)
    repoName = repoName.replace(new RegExp(`^${projectManangerView.org}/`, 'i'), '')

    const hasRightPermission = await isMemberOfTeam(
        sliceOctokit,
        projectManangerView.org,
        actionInputs.openSourceTeamReviewingCommittee,
        reviewer
    )
    const { projectId } = await getProjectV2(sliceOctokit, projectManangerView.org, projectManangerView.projectNumber)
    const { linkedIssues, prId } = await getPullRequest(sliceOctokit, projectManangerView.org, repoName, prNumber)

    if (!hasRightPermission) {
        await error.throwWithGithubComment(
            sliceOctokit,
            prId,
            `@${reviewer} has to be a member of team @${projectManangerView.org}/${actionInputs.openSourceTeamReviewingCommittee}`
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
    const PRReviewerField = projectAllFields.find(x => x.name === OPEN_SOURCE_FIELDS.PRReviewer)
    const statusReadyToPushUpstreamOption = statusField.options?.find(
        x => x.name === OPEN_SOURCE_STATUS_OPTIONS.ReadyToPushUpstream
    )

    if (currentStatus !== OPEN_SOURCE_STATUS_OPTIONS.ReadyForLastReview) {
        await error.throwWithGithubComment(
            sliceOctokit,
            prId,
            `Issue status has to be \`${OPEN_SOURCE_STATUS_OPTIONS.ReadyForLastReview}\` to execute this job`
        )
    }

    logger.logWriteLine('OpenSource', `Updating 'Status=<Ready to push upstream>'...`)
    await updateIssueFieldValue(
        sliceOctokit,
        projectId,
        itemId,
        statusField.id,
        'SingleSelect',
        statusReadyToPushUpstreamOption?.id
    )
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Updating 'PR reviewer=<reviewer>'...`)
    await updateIssueFieldValue(sliceOctokit, projectId, itemId, PRReviewerField.id, 'Text', reviewer)
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Leaving comment to infom maintainer...`)
    await addComment(sliceOctokit, prId, OPEN_SOURCE_COMMENT_PR_APPROVED.replace('{reviewer}', reviewer))
    logger.logExtendLastLine(`Done!`)
}
