import { Octokit } from 'octokit'
import {
    error,
    getCurrentIssueStatusOfProjectItem,
    getIssue,
    getIssueOSSData,
    getProjectFields,
    getProjectManagerViewInfo,
    getProjectV2,
    logger,
    OPEN_SOURCE_FIELDS,
    OPEN_SOURCE_STATUS_OPTIONS,
    updateIssueFieldValue,
} from '../../common'
import { ActionInputs } from '../../types'

export const assignDev = async (
    actionInputs: ActionInputs,
    assignee: string,
    repoName: string,
    issueNumber: number
): Promise<void> => {
    logger.logInputs('open-source assign-dev', { repoName, issueNumber, assignee })

    const sliceOctokit = new Octokit({
        auth: actionInputs.sliceRepo.userToken,
    })
    const projectManangerView = getProjectManagerViewInfo(actionInputs.openSourceManagerProjectView)
    repoName = repoName.replace(new RegExp(`^${projectManangerView.org}/`, 'i'), '')

    const { projectId } = await getProjectV2(sliceOctokit, projectManangerView.org, projectManangerView.projectNumber)
    const { issueId } = await getIssue(sliceOctokit, projectManangerView.org, repoName, issueNumber)
    const issueOSSData = await getIssueOSSData(sliceOctokit, issueId)

    if (!issueOSSData) {
        await error.throwWithGithubComment(sliceOctokit, issueId, "Couldn't find OSS data comment of this issue")
    }

    const { itemId } = issueOSSData
    const projectAllFields = await getProjectFields(sliceOctokit, projectId)
    const currentStatus = await getCurrentIssueStatusOfProjectItem(sliceOctokit, itemId)
    const statusField = projectAllFields.find(x => x.name === OPEN_SOURCE_FIELDS.Status)
    const statusInProgressOption = statusField.options?.find(x => x.name === OPEN_SOURCE_STATUS_OPTIONS.InProgress)

    if (currentStatus !== OPEN_SOURCE_STATUS_OPTIONS.IssueApproved) {
        await error.throwWithGithubComment(
            sliceOctokit,
            issueId,
            `Issue status has to be \`${OPEN_SOURCE_STATUS_OPTIONS.IssueApproved}\` to execute this job`
        )
    }

    logger.logWriteLine('OpenSource', `Updating 'Status=In progress'...`)
    await updateIssueFieldValue(
        sliceOctokit,
        projectId,
        itemId,
        statusField.id,
        'SingleSelect',
        statusInProgressOption?.id
    )
    logger.logExtendLastLine(`Done!`)
}
