import { Octokit } from 'octokit'
import {
    addComment,
    getIssue,
    getIssueOSSData,
    getProjectFields,
    getProjectManagerViewInfo,
    getProjectV2,
    logger,
    OPEN_SOURCE_COMMENT_REQUEST_ISSUE_REVIEW,
    OPEN_SOURCE_FIELDS,
    OPEN_SOURCE_STATUS_OPTIONS,
    updateIssueFieldValue,
} from '../../common'
import { ActionInputs } from '../../types'

export const addIssue = async (actionInputs: ActionInputs, repoName: string, issueNumber: number): Promise<void> => {
    logger.logInputs('open-source add-issue', { repoName, issueNumber })

    const sliceOctokit = new Octokit({
        auth: actionInputs.sliceRepo.userToken,
    })
    const projectManangerView = getProjectManagerViewInfo(actionInputs.openSourceManagerProjectView)
    repoName = repoName.replace(new RegExp(`^${projectManangerView.org}/`, 'i'), '')

    const { projectId } = await getProjectV2(sliceOctokit, projectManangerView.org, projectManangerView.projectNumber)
    const { issueId, issueAddedBy } = await getIssue(sliceOctokit, projectManangerView.org, repoName, issueNumber)
    const issueOSSData = await getIssueOSSData(sliceOctokit, issueId)

    if (issueOSSData) {
        // Issue is already added into OSS project table
        return
    }

    logger.logWriteLine('OpenSource', `Adding issue into project...`)

    const {
        addProjectV2ItemById: {
            item: { id: itemId },
        },
    } = await sliceOctokit.graphql<{ addProjectV2ItemById: { item: { id: string } } }>(
        `
        mutation($projectId: ID!, $issueId: ID!) {
          addProjectV2ItemById(input: {projectId: $projectId, contentId: $issueId}) {
            item {
              id
            }
          }
        }
        `,
        {
            projectId,
            issueId,
        }
    )

    logger.logExtendLastLine(`Item id: ${itemId}`)

    const allFields = await getProjectFields(sliceOctokit, projectId)
    const statusField = allFields.find(x => x.name === OPEN_SOURCE_FIELDS.Status)
    const instanceNameField = allFields.find(x => x.name === OPEN_SOURCE_FIELDS.InstanceName)
    const addedByField = allFields.find(x => x.name === OPEN_SOURCE_FIELDS.AddedBy)
    const statusPendingOption = statusField.options?.find(x => x.name === OPEN_SOURCE_STATUS_OPTIONS.PendingIssue)

    logger.logWriteLine('OpenSource', `Updating 'Status="Pending review"'...`)
    await updateIssueFieldValue(
        sliceOctokit,
        projectId,
        itemId,
        statusField.id,
        'SingleSelect',
        statusPendingOption?.id
    )
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Updating 'Instance name=<openSourceInstanceName config>'...`)
    await updateIssueFieldValue(
        sliceOctokit,
        projectId,
        itemId,
        instanceNameField.id,
        'Text',
        actionInputs.openSourceInstanceName
    )
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Updating 'Added by=<issue creator>'...`)
    await updateIssueFieldValue(sliceOctokit, projectId, itemId, addedByField.id, 'Text', issueAddedBy)
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Saving oss project data comment...`)
    await addComment(
        sliceOctokit,
        issueId,
        `OSS data:
        - itemId: ${itemId}
        - issueId: ${issueId}
        \n\n_Do not edit or delete this comment_
        `
    )
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('OpenSource', `Tagging reviewing comittee...`)
    await addComment(
        sliceOctokit,
        issueId,
        OPEN_SOURCE_COMMENT_REQUEST_ISSUE_REVIEW.replace(
            '{reviewing_committee_team}',
            `${projectManangerView.org}/${actionInputs.openSourceTeamReviewingCommittee}`
        )
    )
    logger.logExtendLastLine(`Done!`)
}
