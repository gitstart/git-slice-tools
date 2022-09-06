import { Octokit } from 'octokit'
import {
    error,
    getIssue,
    getIssueOSSData,
    getProjectFields,
    getProjectManagerViewInfo,
    getProjectV2,
    logger,
    OPEN_SOURCE_FIELDS,
    updateIssueFieldValue,
} from '../../common'
import { ActionInputs } from '../../types'

export const updateEstimate = async (
    actionInputs: ActionInputs,
    repoName: string,
    issueNumber: number,
    credits: number
): Promise<void> => {
    logger.logInputs('open-source update-estimate', { repoName, issueNumber, credits })

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
    const estimateField = projectAllFields.find(x => x.name === OPEN_SOURCE_FIELDS.CreditEstimate)

    logger.logWriteLine('OpenSource', `Updating 'Credit estimate=<credits>'...`)
    await updateIssueFieldValue(sliceOctokit, projectId, itemId, estimateField.id, 'Number', credits)
    logger.logExtendLastLine(`Done!`)
}
