import simpleGit, { SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import { ActionInputs } from '../types'

export const init = async (
    actionInputs: ActionInputs
): Promise<{
    upstreamGit: SimpleGit
    sliceGit: SimpleGit
}> => {
    const upstreamGit: SimpleGit = simpleGit(actionInputs.upstreamRepoDir, { binary: 'git' })
    const sliceGit: SimpleGit = simpleGit(actionInputs.sliceRepoDir, { binary: 'git' })

    terminal('Slice: Fetching...')

    await sliceGit.addConfig('pull.rebase', 'false')
    await sliceGit.fetch('origin', ['-p'])

    terminal('Done!\n')

    const sliceRemote = await sliceGit.remote(['-v'])

    terminal('Slice: Repo: \n')
    terminal(sliceRemote)

    // const sliceUser = await sliceGit.getConfig('user.name')

    // terminal(`Slice: User: ${sliceUser.value}\n`)

    terminal('Upstream: Feching...')

    await upstreamGit.addConfig('pull.rebase', 'false')
    await upstreamGit.fetch('origin', ['-p'])

    terminal('Done!\n')

    const upstreamRemote = await upstreamGit.remote(['-v'])

    terminal('Upstream: Repo: \n')
    terminal(upstreamRemote)

    // const upstreamUser = await upstreamGit.getConfig('user.name')

    // terminal(`Upstream: User: ${upstreamUser.value}\n`)

    return {
        sliceGit,
        upstreamGit,
    }
}
