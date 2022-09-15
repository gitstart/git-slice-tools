import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { terminal } from 'terminal-kit'
import { WorkflowInput } from 'types'
import { execSync } from 'child_process'

export const setupWorkflow = async (repoDir: string): Promise<void> => {
    const repoAbsFolder = path.resolve(process.cwd(), repoDir)
    const workflowFilePath = path.resolve(repoAbsFolder, '.github/workflows/git-slice-open-source.yml')

    terminal(`Setup git-slice-open-source workflow in this local repository: ${repoAbsFolder}\n`)

    if (fs.existsSync(workflowFilePath)) {
        terminal('git-slice-open-source.yml already exists. Do you want to override it? (y/n) ')
        const shouldOverride = await terminal.inputField({ cancelable: false }).promise

        if (shouldOverride.toLowerCase() !== 'y') {
            process.exit()
        }

        terminal(`\n`)
    }

    terminal(`Loading template...\n`)

    const template = execSync(
        'curl -s https://raw.githubusercontent.com/GitStartHQ/git-slice-tools/main/git-slice-open-source.yml'
    ).toString('utf8')
    let content = template

    terminal(`Please enter following inputs (enter 'q' to exit):\n`)

    const requiredInputs: WorkflowInput[] = [
        {
            env: 'GIT_SLICE_OPEN_SOURCE_INSTANCE_NAME',
            desc: 'Name of open source instance',
        },
        {
            env: 'GIT_SLICE_OPEN_SOURCE_URL',
            desc: 'Open source git url',
            ex: 'https://github.com/cypress-io/cypress.git',
            regex: /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i,
        },
        {
            env: 'GIT_SLICE_UPSTREAM_REPO_URL',
            desc: 'Upstream repo (forked repo) git url',
            ex: 'https://github.com/GitStartHQ/cypress.git',
            regex: /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i,
        },
        {
            env: 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH',
            desc: 'Upstream repo (forked repo) default branch',
            defaultValue: 'main',
        },
        {
            env: 'GIT_SLICE_SLICE_REPO_URL',
            desc: 'Slice repo (internal repo) git url',
            ex: 'https://github.com/GitStartHQ/client-cypress.git',
            regex: /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i,
        },
        {
            env: 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH',
            desc: 'Slice repo (internal repo) default branch',
            defaultValue: 'main',
        },
    ]

    for (let i = 0; i < requiredInputs.length; i++) {
        const requiredInput = requiredInputs[i]
        const { desc, ex, defaultValue, regex = /.{1}/ } = requiredInput

        terminal(`${desc}${ex ? ` (Ex: ${ex})` : ''}: `)

        requiredInput.value = await terminal.inputField({
            cancelable: false,
            default: defaultValue,
        }).promise

        if (requiredInput.value === 'q') {
            terminal(`\nYou entered 'q'. Existing... \n`)
            process.exit()
        }

        regex.lastIndex = 0
        if (!regex.test(requiredInput.value)) {
            terminal(`\n  Invalid '${desc}', should be matched ${String(regex).replace('^', '^^')}`)
            i -= 1
        }

        terminal(`\n`)
    }

    terminal('Writing git-slice-open-source.yml file with entered inputs...\n')

    requiredInputs.unshift({ env: 'GIT_SLICE_CHECKOUT_CACHED_KEY', desc: '', value: crypto.randomUUID() })

    requiredInputs.forEach(({ env, value }) => {
        terminal(`  - ${env}: ${value}\n`)

        content = content.replace(`<input-${env}>`, value)
    })

    fs.mkdirSync(path.dirname(workflowFilePath), { recursive: true })
    fs.writeFileSync(workflowFilePath, `${content}`, { flag: 'w' })

    terminal('Done!\n')
    terminal('Please remember to: \n')
    terminal(`  - Push '.github/workflows/git-slice-open-source.yml' file to default branch of slice repo.\n`)
    terminal(`  - Invite 'gitstart' (bot@gitstart.com) as a maintainer of both slice and upstream repos.\n`)

    process.exit()
}
