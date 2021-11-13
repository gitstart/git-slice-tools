import { CleanOptions, SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import { ActionInputs } from '../types'

export const checkout = async (
    sliceGit: SimpleGit,
    upstreamGit: SimpleGit,
    actionInputs: ActionInputs
): Promise<void> => {
    terminal('-'.repeat(30) + '\n')
    terminal('Performing checkout job...\n')

    terminal(`Slice: Clean...`)
    await sliceGit.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)
    terminal(`Done!\n`)

    terminal(`Slice: Checkout default branch...`)
    await sliceGit.checkout(actionInputs.sliceRepo.defaultBranch)
    terminal(`Done!\n`)

    terminal(`Upstream: Clean...`)
    await upstreamGit.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)
    terminal(`Done!\n`)

    terminal(`Upstream: Checkout default branch...`)
    await upstreamGit.checkout(actionInputs.upstreamRepo.defaultBranch)
    terminal(`Done!\n`)
}
