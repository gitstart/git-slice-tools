import { CleanOptions, SimpleGit } from 'simple-git'
import { logger } from '../common'
import { ActionInputs } from '../types'

export const checkout = async (
    sliceGit: SimpleGit,
    upstreamGit: SimpleGit,
    actionInputs: ActionInputs
): Promise<void> => {
    logger.logInputs('checkout', {})

    logger.logWriteLine('Slice', `Cleaning...`)
    await sliceGit.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('Slice', `Checking out default branch...`)
    await sliceGit.checkout(actionInputs.sliceRepo.defaultBranch)
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('Upstream', `Cleaning...`)
    await upstreamGit.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)
    logger.logExtendLastLine(`Done!`)

    logger.logWriteLine('Upstream', `Checking out default branch...`)
    await upstreamGit.checkout(actionInputs.upstreamRepo.defaultBranch)
    logger.logExtendLastLine(`Done!`)
}
