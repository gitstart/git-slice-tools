import { Glob } from 'glob'
import path from 'path'
import fs from 'fs-extra'
import { terminal } from 'terminal-kit'
import { SimpleGit } from 'simple-git'
import { compareSync } from 'dir-compare'

export const deleteSliceIgnoresFilesDirs = async (
    sliceIgnores: string[],
    rootDir: string,
    logPrefix: string
): Promise<void> => {
    for (let i = 0; i < sliceIgnores.length; i++) {
        const pattern = sliceIgnores[i]

        terminal(`${logPrefix}: Getting ingoring files/directores with pattern '${pattern}'...`)

        const mg = new Glob(pattern, {
            cwd: rootDir,
            sync: true,
        })

        terminal(`Found ${mg.found.length} files/directories!\n`)

        if (mg.found.length === 0) {
            terminal('\n')
            continue
        }

        for (let j = 0; j < mg.found.length; j++) {
            const pathMatch = mg.found[j]
            const resolvedPath = path.join(rootDir, pathMatch)

            terminal(`${logPrefix}: Deleting: ${pathMatch}...`)

            fs.rmSync(resolvedPath, { force: true, recursive: true })

            terminal('Done!\n')
        }
    }
}

export const createCommitAndPushCurrentChanges = async (
    git: SimpleGit,
    commitMsg: string,
    branch: string,
    logPrefix: string,
    forcePush = false
): Promise<boolean> => {
    const status = await git.status()

    if (status.files.length === 0) {
        terminal(`${logPrefix}: No changes found\n`)

        return false
    }

    terminal(`${logPrefix}: Stage changes\n`)

    await git.add('.')

    terminal(
        [
            ...status.modified.map(x => ({ filePath: x, changeType: '~' })),
            ...status.deleted.map(x => ({ filePath: x, changeType: '-' })),
            ...status.created.map(x => ({ filePath: x, changeType: '+' })),
        ]
            .map(x => `${logPrefix}: Commit (${x.changeType}) ${x.filePath}`)
            .join('\n') + '\n'
    )

    terminal(`${logPrefix}: Creating '${commitMsg}' commit...\n`)

    await git.commit(commitMsg)

    terminal('Done!\n')

    terminal(`${logPrefix}: Pushing...`)

    await git.push('origin', branch, forcePush ? ['--force'] : [])

    terminal('Done!\n')

    return true
}

export const copyFiles = async (
    git: SimpleGit,
    fromDir: string,
    toDir: string,
    sliceIgnores: string[],
    logPrefix: string
): Promise<boolean> => {
    terminal(`${logPrefix}: Copy files from '${fromDir}' to '${toDir}'...`)

    fs.copySync(fromDir, toDir, {
        overwrite: true,
        dereference: false,
        filter: filePath => {
            return !filePath.startsWith(path.join(fromDir, '.git/'))
        },
    })

    terminal('Done!\n')

    terminal(`${logPrefix}: Removing files on '${toDir}' but not on '${fromDir}'...`)

    const compareResponse = compareSync(toDir, fromDir, {
        compareContent: false,
        compareDate: false,
        compareSize: false,
        compareSymlink: true,
        excludeFilter: [
            '**/.git/**',
            // It requires to have `**/` as prefix to work with dir-compare filter
            ...sliceIgnores.map(x => (x.startsWith('**/') ? x : `**/${x.replace(/^\/+/, '')}`)),
        ].join(','),
    })

    if (compareResponse.diffSet) {
        // Filter files only on left = sliceRepoDir
        const deletedFiles = compareResponse.diffSet.filter(dif => dif.state === 'left')

        terminal(`Found ${deletedFiles.length} file(s)!\n`)

        deletedFiles.forEach(deletedFile => {
            const filePath = `${deletedFile.relativePath.substring(1)}/${deletedFile.name1}`
            terminal(`${logPrefix}: Deleting: ${filePath}...`)

            fs.rmSync(path.join(toDir, filePath), { force: true, recursive: true })

            terminal('Done!\n')
        })
    } else {
        terminal('Found 0 file(s)!\n')
    }

    const status = await git.status()

    if (status.files.length === 0) {
        terminal(`${logPrefix}: No changes found\n`)

        return false
    }

    return true
}
