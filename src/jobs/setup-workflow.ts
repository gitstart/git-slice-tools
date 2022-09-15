import path from 'path'
import fs from 'fs'
import { terminal } from 'terminal-kit'
import { WorkflowInput } from 'types'
import { execSync } from 'child_process'

export const setupWorkflow = async (repoDir: string): Promise<void> => {
    terminal(`Checking git-slice-tool version...`)
    const mainGitSliceToolsVersion = String(
        JSON.parse(
            execSync('curl -s https://raw.githubusercontent.com/GitStartHQ/git-slice-tools/main/package.json').toString(
                'utf8'
            )
        ).version
    )
    const installedGitSliceToolsVersion = execSync('git-slice-tools --version').toString('utf8').trim()
    terminal(`${installedGitSliceToolsVersion}\n`)

    if (mainGitSliceToolsVersion !== installedGitSliceToolsVersion) {
        terminal(`Installed git-slice-tools version ${installedGitSliceToolsVersion} is out of date.\n`)
        terminal(
            `We recommend to update version ${mainGitSliceToolsVersion} before continue. Do you still want to continue? (y/n) `
        )
        const shouldOverride = await terminal.inputField({ cancelable: false }).promise

        if (shouldOverride.toLowerCase() !== 'y') {
            process.exit()
        }

        terminal(`\n`)
    }

    const repoAbsFolder = path.resolve(process.cwd(), repoDir)
    const workflowFilePath = path.resolve(repoAbsFolder, '.github/workflows/git-slice.yml')
    const gitUriRegex = /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i

    terminal(`Setup git-slice workflow in this local repository: ${repoAbsFolder}\n`)

    if (fs.existsSync(workflowFilePath)) {
        terminal('git-slice.yml already exists. Do you want to override it? (y/n) ')
        const shouldOverride = await terminal.inputField({ cancelable: false }).promise

        if (shouldOverride.toLowerCase() !== 'y') {
            process.exit()
        }

        terminal(`\n`)
    }

    terminal(`Loading template...\n`)

    const template = execSync(
        'curl -s https://raw.githubusercontent.com/GitStartHQ/git-slice-tools/main/git-slice.yml'
    ).toString('utf8')
    let content = template

    const requiredInputs: WorkflowInput[] = []

    terminal('Do you want to use open-source workflow?: (y/n) ')
    const useOpensourceWorkflow = (await terminal.inputField({ cancelable: false }).promise).toLowerCase() === 'y'

    terminal(`\n`)

    // GIT_SLICE_OPEN_SOURCE_FLOW
    requiredInputs.push({
        env: 'GIT_SLICE_OPEN_SOURCE_FLOW',
        desc: '',
        value: String(useOpensourceWorkflow),
    })

    // GIT_SLICE_OPEN_SOURCE_URL
    if (useOpensourceWorkflow) {
        requiredInputs.push(
            await getTerminalInput({
                env: 'GIT_SLICE_OPEN_SOURCE_URL',
                desc: 'Open source git url',
                ex: 'https://github.com/cypress-io/cypress.git',
                regex: gitUriRegex,
            })
        )
    } else {
        requiredInputs.push({
            env: 'GIT_SLICE_OPEN_SOURCE_URL',
            desc: '',
            value: "''",
        })
    }

    // GIT_SLICE_SLICE_REPO_URL
    const currentRemoteOrigin = execSync('git config --get remote.origin.url', { cwd: repoAbsFolder }).toString().trim()
    const sliceRepoUrlInput = await getTerminalInput({
        env: 'GIT_SLICE_SLICE_REPO_URL',
        desc: 'Slice repo (internal repo) git url',
        ex: 'https://github.com/GitStartHQ/client-cypress.git',
        regex: gitUriRegex,
        defaultValue: currentRemoteOrigin || undefined,
    })

    requiredInputs.push(sliceRepoUrlInput)

    // GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH
    const sliceRepoDefaultBranchInput = await getTerminalInput({
        env: 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH',
        desc: 'Slice repo (internal repo) default branch',
        defaultValue: 'main',
    })

    requiredInputs.push(sliceRepoDefaultBranchInput)

    // GIT_SLICE_SLICE_REPO_USERNAME
    const sliceRepoUsernameInput = await getTerminalInput({
        env: 'GIT_SLICE_SLICE_REPO_USERNAME',
        desc: 'Slice repo (internal repo) username',
        defaultValue: 'gitstart',
    })

    requiredInputs.push(sliceRepoUsernameInput)

    // GIT_SLICE_SLICE_REPO_EMAIL
    const sliceRepoEmailInput = await getTerminalInput({
        env: 'GIT_SLICE_SLICE_REPO_EMAIL',
        desc: 'Slice repo (internal repo) email',
        defaultValue: 'bot@gitstart.com',
    })

    requiredInputs.push(sliceRepoEmailInput)

    // TODO: Validate slice repo url together with username/password

    // GIT_SLICE_UPSTREAM_REPO_URL
    const upstreamRepoUrlInput = await getTerminalInput({
        env: 'GIT_SLICE_UPSTREAM_REPO_URL',
        desc: `Upstream repo (${useOpensourceWorkflow ? 'forked repo' : 'client repo'}) git url`,
        ex: useOpensourceWorkflow ? 'https://github.com/GitStartHQ/cypress.git' : undefined,
        regex: gitUriRegex,
    })

    requiredInputs.push(upstreamRepoUrlInput)

    // GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH
    const upstreamRepoDefaultBranchInput = await getTerminalInput({
        env: 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH',
        desc: `Upstream repo (${useOpensourceWorkflow ? 'forked repo' : 'client repo'}) default branch`,
        defaultValue: 'main',
    })

    requiredInputs.push(upstreamRepoDefaultBranchInput)

    // GIT_SLICE_UPSTREAM_REPO_USERNAME
    const upstreamRepoUsernameInput = await getTerminalInput({
        env: 'GIT_SLICE_UPSTREAM_REPO_USERNAME',
        desc: `Upstream repo (${useOpensourceWorkflow ? 'forked repo' : 'client repo'}) username`,
        defaultValue: useOpensourceWorkflow ? 'gitstart' : 'gitstart-',
    })

    requiredInputs.push(upstreamRepoUsernameInput)

    // GIT_SLICE_UPSTREAM_REPO_EMAIL
    const upstreamRepoEmailInput = await getTerminalInput({
        env: 'GIT_SLICE_UPSTREAM_REPO_EMAIL',
        desc: `Upstream repo (${useOpensourceWorkflow ? 'forked repo' : 'client repo'}) email`,
        defaultValue: useOpensourceWorkflow
            ? 'bot@gitstart.com'
            : `${upstreamRepoUsernameInput.value.replace('gitstart-', '')}@gitstart.com`,
    })

    requiredInputs.push(upstreamRepoEmailInput)

    terminal('Writing git-slice.yml file with entered inputs...\n')

    requiredInputs.forEach(({ env, value }) => {
        terminal(`  - ${env}: ${value}\n`)

        content = content.replace(`<input-${env}>`, value)
    })

    if (useOpensourceWorkflow && sliceRepoUsernameInput.value === 'gitstart') {
        // if slice repo uses `gitstart` account
        // we should use `${{ secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT }}` instead of `${{ secrets.GIT_SLICE_SLICE_REPO_PASSWORD }}`
        content = content.replace('secrets.GIT_SLICE_SLICE_REPO_PASSWORD', 'secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT')
    }

    if (useOpensourceWorkflow && upstreamRepoUsernameInput.value === 'gitstart') {
        // if slice repo uses `gitstart` account
        // we should use `${{ secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT }}` instead of `${{ secrets.GIT_SLICE_UPSTREAM_REPO_PASSWORD }}`
        content = content.replace(
            'secrets.GIT_SLICE_UPSTREAM_REPO_PASSWORD',
            'secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT'
        )
    }

    fs.mkdirSync(path.dirname(workflowFilePath), { recursive: true })
    fs.writeFileSync(workflowFilePath, `${content}`, { flag: 'w' })

    terminal('Done!\n')
    terminal('Please remember to: \n')
    terminal(`  - Push '.github/workflows/git-slice.yml' file to default branch of slice repo.\n`)

    if (useOpensourceWorkflow) {
        if (upstreamRepoUsernameInput.value !== sliceRepoUsernameInput.value) {
            terminal(`  - Invite '${sliceRepoUsernameInput.value}' as a maintainer of slice repo.\n`)
            terminal(`  - Invite '${upstreamRepoEmailInput.value}' as a maintainer of upstream repo.\n`)
        } else {
            terminal(`  - Invite '${sliceRepoUsernameInput.value}' as a maintainer of both slice and upstream repos.\n`)
        }
    } else {
        terminal(`  - Invite '${sliceRepoUsernameInput.value}' as a maintainer of slice repo.\n`)
    }

    if (!useOpensourceWorkflow || sliceRepoUsernameInput.value !== 'gitstart') {
        terminal(
            `  - Create a repo secret with name is 'GIT_SLICE_SLICE_REPO_PASSWORD' and value is the PAT of '${sliceRepoUsernameInput.value}' account.\n`
        )
    }

    if (!useOpensourceWorkflow || upstreamRepoUsernameInput.value !== 'gitstart') {
        terminal(
            `  - Create a repo secret with name is 'GIT_SLICE_UPSTREAM_REPO_PASSWORD' and value is the PAT of '${upstreamRepoUsernameInput.value}' account.\n`
        )
    }

    terminal(
        `  - Create a repo secret with name is 'GIT_SLICE_UPSTREAM_REPO_CACHE_KEY' and value is a dummy string value.\n`
    )

    process.exit()
}

const getTerminalInput = async (requiredInput: WorkflowInput): Promise<WorkflowInput> => {
    let isValid = false

    while (!isValid) {
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
            terminal(`\n  Invalid '${desc}', should be matched ${String(regex).replace('^', '^^')}\n`)
            continue
        }

        terminal(`\n`)
        isValid = true
    }

    return requiredInput
}
