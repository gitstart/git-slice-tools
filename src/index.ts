import { terminal } from 'terminal-kit'
import { loadValidateActionInputs } from './config'
import { init, pull } from './jobs'

const actionInputs = loadValidateActionInputs()

init(actionInputs).then(({ sliceGit, upstreamGit }) => {
    terminal('Initialized git instances\n')

    return pull(sliceGit, upstreamGit, actionInputs)
})
