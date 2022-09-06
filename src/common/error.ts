import { Octokit } from 'octokit'
import { addComment } from './github'

/**
 *
 * @param octokit Octokit
 * @param subjectId id of the pull request or the issue
 * @param message Error message and comment body
 */
export const throwWithGithubComment = async (octokit: Octokit, subjectId: string, message: string): Promise<void> => {
    await addComment(octokit, subjectId, `:warning: Error is thrown from \`git-slice-tools\` job:\n${message}`)
    throw new Error(message)
}
