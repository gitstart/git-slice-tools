import { terminal } from 'terminal-kit'

import { Repo } from '../types'
import simpleGit, { GitConfigScope, SimpleGit } from 'simple-git'

export const gitInit = async (repo: Repo): Promise<SimpleGit> => {
    terminal(`${repo.name}: Forcing git init...`)

    // fs.rmSync(path.resolve(repo.dir, '.git'), { force: true, recursive: true })

    const git: SimpleGit = simpleGit(repo.dir, { binary: 'git' })

    // git config init.defaultBranch main
    await git.addConfig('init.defaultBranch', repo.defaultBranch, false, GitConfigScope.global)

    await git.init()

    // git config user.email $EMAIL
    await git.addConfig('user.email', repo.userEmail, false, GitConfigScope.local)

    // git config user.name $USERNAME
    await git.addConfig('user.name', repo.username, false, GitConfigScope.local)

    if (repo.gitHttpUri.toLowerCase().includes('github.com')) {
        // git config url."https://$USERNAME:$PAT@github.com/".insteadOf "https://github.com/"

        await git.addConfig(
            `url.https://${repo.username}:${repo.userToken}@github.com/.insteadOf`,
            'https://github.com/',
            false,
            GitConfigScope.local
        )
    } else if (repo.gitHttpUri.toLowerCase().includes('gitlab.com')) {
        // git config url."https://$USERNAME:$PAT@gitlab.com/".insteadOf "https://gitlab.com/"

        await git.addConfig(
            `url."https://${repo.username}:${repo.userToken}@gitlab.com/".insteadOf`,
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
        await git.raw('remote', 'set-url', 'origin', repo.gitHttpUri)
    } else {
        // git remote add -t \* -f origin https://github.com/GitStartHQ/client-sourcegraph.git
        await git.raw('remote', 'add', '-t', '*', '-f', 'origin', repo.gitHttpUri)
    }

    terminal(`Done!\n`)

    return git
}
