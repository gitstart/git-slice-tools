import { terminal } from 'terminal-kit'
import yargs from 'yargs/yargs'
import { loadValidateActionInputs } from './config'
import { init, pull } from './jobs'

const argv = yargs(process.argv.slice(2))
    .options({
        action: { choices: ['pull'] },
    })
    .parseSync()

const actionInputs = loadValidateActionInputs()

init(actionInputs).then(({ sliceGit, upstreamGit }) => {
    terminal('Initialized git instances\n')

    switch (argv.action) {
        case 'pull': {
            return pull(sliceGit, upstreamGit, actionInputs)
        }
        default: {
            return
        }
    }
})
