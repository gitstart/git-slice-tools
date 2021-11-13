import simpleGit, { SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import { ActionInputs } from '../types'
import { gitInit } from '../common'

export const init = async (
    actionInputs: ActionInputs
): Promise<{
    sliceGit: SimpleGit
    upstreamGit: SimpleGit
}> => {
    let sliceGit: SimpleGit
    let upstreamGit: SimpleGit

    if (actionInputs.forceInit) {
        sliceGit = await gitInit(actionInputs.sliceRepo)
        upstreamGit = await gitInit(actionInputs.upstreamRepo)
    } else {
        sliceGit = simpleGit(actionInputs.sliceRepo.dir, { binary: 'git' })
        upstreamGit = simpleGit(actionInputs.upstreamRepo.dir, { binary: 'git' })
    }

    terminal('Slice: Fetching...')

    await sliceGit.fetch('origin', ['-p'])

    terminal('Done!\n')

    const sliceRemote = await sliceGit.remote(['-v'])

    terminal('Slice: Repo: \n')
    terminal(sliceRemote)

    // const sliceUser = await sliceGit.getConfig('user.name')

    // terminal(`Slice: User: ${sliceUser.value}\n`)

    terminal('Upstream: Feching...')

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
