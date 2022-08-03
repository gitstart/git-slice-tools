import simpleGit, { GitConfigScope, SimpleGit } from 'simple-git'
import { LogScope, Repo } from '../types'
import { OPEN_SOURCE_REMOTE } from './constants'
import { logExtendLastLine, logWriteLine } from './logger'

export const gitInit = async (scope: LogScope, originRepo: Repo, openSourceUrl?: string): Promise<SimpleGit> => {
    logWriteLine(scope, `Git init...`)

    // fs.rmSync(path.resolve(repo.dir, '.git'), { force: true, recursive: true })

    const git = simpleGit(originRepo.dir, { binary: 'git' })

    // git config init.defaultBranch main
    await git.addConfig('init.defaultBranch', originRepo.defaultBranch, false, GitConfigScope.global)

    await git.init()

    // git config user.email $EMAIL
    await git.addConfig('user.email', originRepo.userEmail, false, GitConfigScope.local)

    // git config user.name $USERNAME
    await git.addConfig('user.name', originRepo.username, false, GitConfigScope.local)

    if (originRepo.gitHttpUri.toLowerCase().includes('github.com')) {
        // git config url."https://$USERNAME:$PAT@github.com/".insteadOf "https://github.com/"

        await git.addConfig(
            `url.https://${originRepo.username}:${originRepo.userToken}@github.com/.insteadOf`,
            'https://github.com/',
            false,
            GitConfigScope.local
        )
    } else if (originRepo.gitHttpUri.toLowerCase().includes('gitlab.com')) {
        // git config url."https://$USERNAME:$PAT@gitlab.com/".insteadOf "https://gitlab.com/"

        await git.addConfig(
            `url."https://${originRepo.username}:${originRepo.userToken}@gitlab.com/".insteadOf`,
            'https://gitlab.com/',
            false,
            GitConfigScope.local
        )
    } else {
        throw Error('Support only github.com and gitlab.com')
    }

    const remotes = await git.getRemotes()

    if (remotes.find(x => x.name === 'origin')) {
        // git remote set-url origin https://github.com/GitStartHQ/client-sourcegraph.git
        await git.raw('remote', 'set-url', 'origin', originRepo.gitHttpUri)
    } else {
        // git remote add -t \* -f origin https://github.com/GitStartHQ/client-sourcegraph.git
        await git.raw('remote', 'add', '-t', '*', '-f', 'origin', originRepo.gitHttpUri)
    }

    logExtendLastLine(`Done!`)

    if (openSourceUrl) {
        logWriteLine(scope, `Setting \`open-source\` origin...`)

        if (remotes.find(x => x.name === OPEN_SOURCE_REMOTE)) {
            // git remote set-url open-source https://github.com/GitStartHQ/client-sourcegraph.git
            await git.raw('remote', 'set-url', OPEN_SOURCE_REMOTE, openSourceUrl)
        } else {
            // git remote add -t \* -f open-source https://github.com/GitStartHQ/client-sourcegraph.git
            await git.raw('remote', 'add', '-t', '*', '-f', OPEN_SOURCE_REMOTE, openSourceUrl)
        }

        logExtendLastLine(`Done!`)
    }

    return git
}
