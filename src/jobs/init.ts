import simpleGit, { SimpleGit } from 'simple-git'
import { ActionInputs } from '../types'
import { gitInit, logExtendLastLine, logWriteLine, OPEN_SOURCE_REMOTE } from '../common'

export const init = async (
    actionInputs: ActionInputs
): Promise<{
    sliceGit: SimpleGit
    upstreamGit: SimpleGit
}> => {
    let sliceGit: SimpleGit
    let upstreamGit: SimpleGit

    if (actionInputs.forceInit) {
        sliceGit = await gitInit('Slice', actionInputs.sliceRepo)
        upstreamGit = await gitInit(
            'Upstream',
            actionInputs.upstreamRepo,
            actionInputs.isOpenSourceFlow ? actionInputs.openSourceUrl : undefined
        )
    } else {
        sliceGit = simpleGit(actionInputs.sliceRepo.dir, { binary: 'git' })
        upstreamGit = simpleGit(actionInputs.upstreamRepo.dir, { binary: 'git' })
    }

    logWriteLine('Slice', 'Fetching...')

    await sliceGit.fetch('origin', ['-p'])

    logExtendLastLine('Done!')

    const sliceRemote = await sliceGit.remote(['-v'])

    logWriteLine('Slice', `Repo:\n${sliceRemote}`)

    // const sliceUser = await sliceGit.getConfig('user.name')

    // terminal(`Slice: User: ${sliceUser.value}\n`)

    logWriteLine('Upstream', 'Feching...')

    await upstreamGit.fetch('origin', ['-p'])

    logExtendLastLine('Done!')

    if (actionInputs.isOpenSourceFlow) {
        logWriteLine('OpenSource', 'Feching...')

        await upstreamGit.fetch(OPEN_SOURCE_REMOTE, ['-p'])

        logExtendLastLine('Done!')
    }

    const upstreamRemote = await upstreamGit.remote(['-v'])

    logWriteLine('Upstream', `Repo:\n${upstreamRemote}`)

    // const upstreamUser = await upstreamGit.getConfig('user.name')

    // terminal(`Upstream: User: ${upstreamUser.value}\n`)

    return {
        sliceGit,
        upstreamGit,
    }
}
