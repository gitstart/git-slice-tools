import { AUTO_CO_AUTHORS_COMMITS_OPTIONS, logger } from '../common'
import gitUrlParse from 'git-url-parse'
import { Octokit } from 'octokit'
import { SimpleGit } from 'simple-git'
import { CoAuthor, Repo } from 'types'

export const getCoAuthorsFromCliArgs = (coAuthorCliArgs: string[]): CoAuthor[] => {
    if (!coAuthorCliArgs || coAuthorCliArgs.length === 0) {
        return []
    }

    return coAuthorCliArgs
        .map(authorStr => {
            const [authorUserName, authorEmail] = authorStr.split(',').map(x => x.trim())

            return { authorUserName, authorEmail }
        })
        .reduce((prev, coAuthor) => {
            const userName = coAuthor.authorUserName.toLowerCase()

            if (
                ['gitstart', 'gitstart-bot'].includes(userName) ||
                prev.some(x => x.authorUserName.toLocaleLowerCase() == userName.toLocaleLowerCase())
            ) {
                return prev
            }

            return [...prev, coAuthor]
        }, [] as CoAuthor[])
}

export const getCoAuthorsFromGitLogs = async (
    sliceGit: SimpleGit,
    sliceRepo: Repo,
    sliceBranch: string
): Promise<CoAuthor[]> => {
    logger.logWriteLine(
        'Slice',
        `Finding co-authors with 'GIT_SLICE_OPEN_SOURCE_AUTO_CO_AUTHORS_COMMITS: ${AUTO_CO_AUTHORS_COMMITS_OPTIONS.GitLogs}'`
    )
    const { all } = await sliceGit.log({ from: sliceRepo.defaultBranch, to: sliceBranch })
    const mergeMessageRegex = /^merge branch .* into .*$/gi

    return all
        .filter(commit => !mergeMessageRegex.test(commit.message.trim()))
        .reduce((prev, next) => {
            if (prev.some(x => x.authorUserName === next.author_name || x.authorEmail === next.author_email)) {
                return prev
            }

            return [...prev, { authorUserName: next.author_name, authorEmail: next.author_email }]
        }, [] as CoAuthor[])
}

export const getCoAuthorsFromPR = async (sliceRepo: Repo, sliceBranch: string): Promise<CoAuthor[]> => {
    logger.logWriteLine(
        'Slice',
        `Finding co-authors with 'GIT_SLICE_OPEN_SOURCE_AUTO_CO_AUTHORS_COMMITS: ${AUTO_CO_AUTHORS_COMMITS_OPTIONS.PrAssignees}'`
    )

    const sliceGitUrlObject = gitUrlParse(sliceRepo.gitHttpUri)

    if (sliceGitUrlObject.source !== 'github.com') {
        throw new Error(`Unsuported codehost '${sliceGitUrlObject.source}'`)
    }

    logger.logWriteLine('Slice', `Finding PR (${sliceRepo.defaultBranch} <- ${sliceBranch}) ...`)

    const sliceOctokit = new Octokit({
        auth: sliceRepo.userToken,
    })

    const listResponse = await sliceOctokit.rest.pulls.list({
        owner: sliceGitUrlObject.owner,
        repo: sliceGitUrlObject.name,
        base: sliceRepo.defaultBranch,
        head: `${sliceGitUrlObject.owner}:${sliceBranch}`,
        state: 'open',
    })

    if (listResponse.data.length === 0) {
        logger.logExtendLastLine(`Not found!`)

        return []
    }

    const { assignees } = listResponse.data[0]

    return assignees
        .filter(x => x.type === 'User')
        .map(x => {
            return {
                authorUserName: x.name ?? x.login,
                authorEmail: x.email ?? `${x.id}+${x.login}@users.noreply.github.com`,
            }
        })
}
