import { terminal } from 'terminal-kit'
import yargs from 'yargs/yargs'
import { loadValidateActionInputs } from './config'
import { init, pull, push } from './jobs'

const argv = yargs(process.argv.slice(2))
    .options({
        action: { choices: ['pull', 'push'], alias: 'a' },
        branch: { alias: 'b' },
        message: { alias: 'b' },
    })
    .parseSync()

const actionInputs = loadValidateActionInputs()

init(actionInputs).then(({ sliceGit, upstreamGit }) => {
    terminal('Initialized git instances\n')

    switch (argv.action) {
        case 'pull': {
            return pull(sliceGit, upstreamGit, actionInputs)
        }
        case 'push': {
            if (!argv.branch || typeof argv.branch !== 'string') {
                throw new Error(`Push job: 'branch' in string is required`)
            }

            if (!argv.message || typeof argv.message !== 'string') {
                throw new Error(`Push job: 'message' in string is required`)
            }

            return push(sliceGit, upstreamGit, actionInputs, argv.branch, argv.message)
        }
        default: {
            return
        }
    }
})
