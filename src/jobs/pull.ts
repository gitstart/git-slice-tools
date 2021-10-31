import { CleanOptions, SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import { Glob } from 'glob'
import fs from 'fs-extra'
import { compareSync } from 'dir-compare'
import { ActionInputs } from '../types'
import path from 'path'
import { deleteSliceIgnoresFilesDirs } from '../common'

export const pull = async (sliceGit: SimpleGit, upstreamGit: SimpleGit, actionInputs: ActionInputs): Promise<void> => {
    terminal('-'.repeat(30) + '\n')
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

        terminal(`Upstream: Getting ingoring files/directores with pattern '${pattern}'...`)

        const mg = new Glob(pattern, {
            cwd: actionInputs.upstreamRepoDir,
            sync: true,
        })

        terminal(`Found ${mg.found.length} files/directories!\n`)

        if (mg.found.length === 0) {
            terminal('\n')
            continue
        }

        for (let j = 0; j < mg.found.length; j++) {
            const pathMatch = mg.found[j]
            const resolvedPath = path.join(actionInputs.upstreamRepoDir, pathMatch)

            terminal(`Upstream: Deleting: ${pathMatch}...`)

            fs.rmSync(resolvedPath, { force: true, recursive: true })

            terminal('Done!\n')
        }
    }

    deleteSliceIgnoresFilesDirs(actionInputs.sliceIgnores, actionInputs.upstreamRepoDir, 'Upstream')

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

    const compareResponse = compareSync(actionInputs.sliceRepoDir, actionInputs.upstreamRepoDir, {
        compareContent: false,
        compareDate: false,
        compareSize: false,
        compareSymlink: false,
        excludeFilter: [
            '**/.git',
            // It requires to have `**/` as prefix to work with dir-compare filter
            ...actionInputs.sliceIgnores.map(x => (x.startsWith('**/') ? x : `**/${x.replace(/^\/+/, '')}`)),
        ].join(','),
    })

    if (compareResponse.diffSet) {
        // Filter files only on left = sliceRepoDir
        const deletedFiles = compareResponse.diffSet.filter(dif => dif.state === 'left')

        terminal(`Found ${deletedFiles.length} file(s)!\n`)

        deletedFiles.forEach(deletedFile => {
            const filePath = `${deletedFile.relativePath.substring(1)}/${deletedFile.name1}`
            terminal(`Slice: Deleting: ${filePath}...`)

            fs.rmSync(path.join(actionInputs.sliceRepoDir, filePath), { force: true, recursive: true })

            terminal('Done!\n')
        })
    } else {
        terminal('Found 0 file(s)!\n')
    }

    terminal(`Slice: Status...`)

    terminal('Done!\n')

    const sliceStatus = await sliceGit.status()

    if (sliceStatus.files.length === 0) {
        terminal(`Slice: No changes found\n`)
        terminal(`Slice: Up to date with upstream\n`)

        return
    }

    terminal(
        [
            ...sliceStatus.modified.map(x => ({ filePath: x, changeType: '~' })),
            ...sliceStatus.deleted.map(x => ({ filePath: x, changeType: '-' })),
            ...sliceStatus.created.map(x => ({ filePath: x, changeType: '+' })),
        ]
            .map(x => `Slice: Commit (${x.changeType}) ${x.filePath}`)
            .join('\n') + '\n'
    )

    terminal(`Slice: Creating 'git-slice:${upstreamLastCommitId}' commit...`)

    await sliceGit.add('.')
    await sliceGit.commit(`git-slice:${upstreamLastCommitId}`)

    terminal('Done!\n')

    terminal(`Slice: Pushing...`)

    await sliceGit.push('origin', actionInputs.sliceDefaultBranch)

    terminal('Done!\n')

    terminal(`Slice: Up to date with upstream\n`)
}
