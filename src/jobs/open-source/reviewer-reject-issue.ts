import { Octokit } from 'octokit'
import {
    addComment,
    closeIssue,
    closePR,
    error,
    getCurrentIssueStatusOfProjectItem,
    getIssue,
    getIssueOSSData,
    getIssueRelatedPRs,
    getProjectFields,
    getProjectManagerViewInfo,
    getProjectV2,
    isMemberOfTeam,
    logger,
    OPEN_SOURCE_FIELDS,
    OPEN_SOURCE_STATUS_OPTIONS,
    updateIssueFieldValue,
} from '../../common'
import { ActionInputs } from '../../types'

export const reviewerRejectIssue = async (
    actionInputs: ActionInputs,
    reviewer: string,
    repoName: string,
    issueNumber: number
): Promise<void> => {
    logger.logInputs('open-source reviewer-reject-issue', { reviewer, repoName, issueNumber })

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
    const { issueId, issueAddedBy } = await getIssue(sliceOctokit, projectManangerView.org, repoName, issueNumber)
    const issueOSSData = await getIssueOSSData(sliceOctokit, issueId)

    if (!hasRightPermission) {
        await error.throwWithGithubComment(
            sliceOctokit,
            issueId,
            `@${reviewer} has to be a member of team @${projectManangerView.org}/${actionInputs.openSourceTeamReviewingCommittee}`
        )
    }

    if (!issueOSSData) {
        await error.throwWithGithubComment(sliceOctokit, issueId, "Couldn't find OSS data comment of this issue")
    }

    const { itemId } = issueOSSData
    const projectAllFields = await getProjectFields(sliceOctokit, projectId)
    const currentStatus = await getCurrentIssueStatusOfProjectItem(sliceOctokit, itemId)
    const statusField = projectAllFields.find(x => x.name === OPEN_SOURCE_FIELDS.Status)
    const issueReviewerField = projectAllFields.find(x => x.name === OPEN_SOURCE_FIELDS.IssueReviewer)
    const statusIssueRejectedOption = statusField.options?.find(
        x => x.name === OPEN_SOURCE_STATUS_OPTIONS.IssueRejected
    )

    if (currentStatus !== OPEN_SOURCE_STATUS_OPTIONS.PendingIssue) {
        await error.throwWithGithubComment(
            sliceOctokit,
            issueId,
            `Issue status has to be \`${OPEN_SOURCE_STATUS_OPTIONS.PendingIssue}\` to execute this job`
        )
    }

    logger.logWriteLine('OpenSource', `Updating 'Status=<Issue rejected>'...`)
    await updateIssueFieldValue(
        sliceOctokit,
        projectId,
        itemId,
        statusField.id,
        'SingleSelect',
        statusIssueRejectedOption?.id
    )
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Updating 'Issue reviewer=<reviewer>'...`)
    await updateIssueFieldValue(sliceOctokit, projectId, itemId, issueReviewerField.id, 'Text', reviewer)
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Leaving comment to infom devs...`)
    await addComment(sliceOctokit, issueId, `:disappointed: Sorry @${issueAddedBy}, @${reviewer} rejected this issue.`)
    logger.logExtendLastLine(`Done!`)

    await closeIssue(sliceOctokit, issueId)

    logger.logWriteLine('OpenSource', `Finding related PRs...`)
    const relatedPRs = await getIssueRelatedPRs(sliceOctokit, issueId)
    logger.logExtendLastLine(`Found ${relatedPRs.length} PRs: ${relatedPRs.map(x => `#${x.prNumber}`).join(', ')}`)

    for (const relatedPR of relatedPRs) {
        await closePR(sliceOctokit, relatedPR.prId, relatedPR.prNumber)
    }
}
