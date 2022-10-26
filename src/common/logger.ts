import { terminal } from 'terminal-kit'
import { LogScope } from '../types'

const ignoreTimestamp = process.env.TEST_ENV === 'true'

let lastLogLine = ''
let lastLogTime: Date = new Date()

export const logWriteLine = (scope: LogScope, content: string) => {
    if (process.env.GIT_SLICE_UPSTREAM_REPO_PASSWORD) {
        content = content.replace(new RegExp(process.env.GIT_SLICE_UPSTREAM_REPO_PASSWORD), '***')
    }

    if (process.env.GIT_SLICE_SLICE_REPO_PASSWORD) {
        content = content.replace(new RegExp(process.env.GIT_SLICE_SLICE_REPO_PASSWORD), '***')
    }

    lastLogTime = new Date()

    const timestamp = ignoreTimestamp ? '' : `[${lastLogTime.toISOString()}] `

    lastLogLine = `${timestamp}${scope}: ${content.trim()}`

    terminal(`${lastLogLine}\n`)
}

export const logExtendLastLine = (content: string) => {
    const duration = ignoreTimestamp ? 0 : (new Date().getTime() - lastLogTime.getTime()) / 1000

    terminal.up(1)(`${lastLogLine}${content.trim()} (${duration.toFixed(3)}s)\n`)
}

export const logInputs = (jobName: string, ipnuts: unknown = {}) => {
    terminal('-'.repeat(30) + '\n')
    terminal(`Performing '${jobName}' job with ${JSON.stringify(ipnuts)}...\n`)
}
