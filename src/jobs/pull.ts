import { ResetMode, SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import { ActionInputs } from '../types'

export const pull = async (sliceGit: SimpleGit, upstreamGit: SimpleGit, actionInputs: ActionInputs): Promise<void> => {
    terminal('-'.repeat(20) + '\n')
    terminal('Performing pull job...\n')

    terminal(`Upstream: Checkout and pull last versions '${actionInputs.upstreamDefaultBranch}' branch...`)

    await upstreamGit.checkout(actionInputs.upstreamDefaultBranch)
    await upstreamGit.reset(['--hard', `origin/${actionInputs.upstreamDefaultBranch}`])
    await upstreamGit.pull('origin', actionInputs.upstreamDefaultBranch)

    terminal('Done!\n')

    terminal(`Upstream: Get last commit oid...`)

    const upstreamLastCommitId = await upstreamGit.revparse('HEAD')

    terminal(`Done! -> ${upstreamLastCommitId}\n`)

    terminal(`Slice: Checkout and pull last versions '${actionInputs.sliceDefaultBranch}' branch...`)

    await sliceGit.checkout(actionInputs.sliceDefaultBranch)
    await sliceGit.reset(['--hard', `origin/${actionInputs.sliceDefaultBranch}`])
    await sliceGit.pull('origin', actionInputs.sliceDefaultBranch)

    terminal('Done!\n')
}
