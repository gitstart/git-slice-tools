import { CleanOptions, SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import { Glob } from 'glob'
import fs from 'fs-extra'
import dirCompare from 'dir-compare'
import { ActionInputs } from '../types'
import path from 'path'

export const pull = async (sliceGit: SimpleGit, upstreamGit: SimpleGit, actionInputs: ActionInputs): Promise<void> => {
    terminal('-'.repeat(20) + '\n')
    terminal('Performing pull job...\n')

    terminal(`Upstream: Checkout and pull last versions '${actionInputs.upstreamDefaultBranch}' branch...`)

    await upstreamGit.checkout(actionInputs.upstreamDefaultBranch)
    await upstreamGit.reset(['--hard', `origin/${actionInputs.upstreamDefaultBranch}`])
    await upstreamGit.pull('origin', actionInputs.upstreamDefaultBranch)

    terminal('Done!\n')

    terminal(`Upstream: Clean...`)

    await upstreamGit.clean(CleanOptions.FORCE)

    terminal('Done!\n')

    terminal(`Upstream: Get last commit oid...`)

    const upstreamLastCommitId = await upstreamGit.revparse('HEAD')

    terminal(`Done! -> ${upstreamLastCommitId}\n`)

    terminal(`Slice: Checkout and pull last versions '${actionInputs.sliceDefaultBranch}' branch...`)

    await sliceGit.checkout(actionInputs.sliceDefaultBranch)
    await sliceGit.reset(['--hard', `origin/${actionInputs.sliceDefaultBranch}`])
    await sliceGit.pull('origin', actionInputs.sliceDefaultBranch)

    terminal('Done!\n')

    terminal(`Slice: Clean...`)

    await sliceGit.clean(CleanOptions.FORCE)

    terminal('Done!\n')

    for (let i = 0; i < actionInputs.sliceIgnores.length; i++) {
        const pattern = actionInputs.sliceIgnores[i]

        terminal(`Upstream: Unlinking ignore files with pattern '${pattern}'...`)

        const mg = new Glob(pattern, {
            cwd: actionInputs.upstreamRepoDir,
            sync: true,
        })

        terminal(`Upstream: Found ${mg.found.length} file(s)!\n`)

        if (mg.found.length === 0) {
            terminal('\n')
            continue
        }

        for (let j = 0; j < mg.found.length; j++) {
            const pathMatch = mg.found[j]

            terminal(`Upstream: Deleting: ${pathMatch}...`)

            fs.unlinkSync(path.join(actionInputs.upstreamRepoDir, pathMatch))

            terminal('Done!\n')
        }
    }

    terminal(`Slice: Copying files from upstream to slice...`)

    fs.copySync(actionInputs.upstreamRepoDir, actionInputs.sliceRepoDir, {
        overwrite: true,
        dereference: true,
        filter: filePath => {
            return !filePath.startsWith(path.join(actionInputs.upstreamRepoDir, '.git'))
        },
    })

    terminal('Done!\n')

    terminal(`Slice: Removing files on slice but not on upstream...`)

    const compareResponse = dirCompare.compareSync(actionInputs.sliceDefaultBranch, actionInputs.upstreamRepoDir, {
        compareContent: false,
        compareDate: false,
        compareSize: false,
        compareSymlink: false,
        excludeFilter: actionInputs.sliceIgnores.join(','),
    })

    if (compareResponse.diffSet) {
        terminal(`Found ${compareResponse.diffSet.length} file(s)!\n`)

        // Filter files only on left = sliceDefaultBranch
        const deletedFiles = compareResponse.diffSet.filter(dif => dif.state === 'left')

        deletedFiles.forEach(deletedFile => {
            terminal(`Slice: Deleting: ${deletedFile.relativePath}...`)

            terminal('Done!\n')
        })
    } else {
        terminal('Found 0 file(s)!\n')
    }

    terminal(`Slice: Status...`)

    terminal('Done!\n')

    const sliceStatus = await sliceGit.status()

    if (sliceStatus.files.length === 0) {
        terminal(`Slice: Up to date with upstream\n`)

        return
    }

    terminal(sliceStatus.files.map(f => f.path).join('\n'))

    terminal(`\nSlice: Creating 'git-slice:${upstreamLastCommitId}' commit...`)

    await sliceGit.add('*')
    await sliceGit.commit(`git-slice:${upstreamLastCommitId}`)

    terminal('Done!\n')

    terminal(`Slice: Pushing... 'git-slice:${upstreamLastCommitId}' commit...`)

    await sliceGit.push('origin', actionInputs.sliceDefaultBranch)

    terminal('Done!\n')

    terminal(`Slice: Up to date with upstream\n`)
}
