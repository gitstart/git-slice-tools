import { compareSync, DifferenceState, Reason } from 'dir-compare'
import fs from 'fs-extra'
import path from 'path'
import { CleanOptions, GitError, ResetMode, SimpleGit } from 'simple-git'
import { CoAuthor, ErrorLike, LogScope } from '../types'
import { OPEN_SOURCE_REMOTE } from './constants'
import { getFilesMatchPatterns } from './ignore'
import { logExtendLastLine, logWriteLine } from './logger'

export * from './constants'
export * from './gitInit'
export * from './ignore'
export * from './logger'
export * from './github'
export * as coAuthorHelpers from './coAuthors'
export * as logger from './logger'
export * as error from './error'

export const isErrorLike = (value: unknown): value is ErrorLike =>
    typeof value === 'object' && value !== null && ('stack' in value || 'message' in value)

export const delay = (time: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, time))
}

export const pullRemoteBranchIntoCurrentBranch = async (
    logScope: LogScope,
    git: SimpleGit,
    remoteBranch: string,
    currentBranch: string,
    ignoreMergeConflictsError = false,
    noPush = false
) => {
    try {
        logWriteLine(logScope, `Try to pull remote branch '${remoteBranch}' into current branch '${currentBranch}'...`)

        await git.pull('origin', remoteBranch, ['--no-rebase'])
        const status = await git.status()

        if (status.ahead) {
            if (!noPush) {
                await git.push('origin', currentBranch)
                logExtendLastLine('Merged!\n')

                return
            }

            logExtendLastLine('Done!\n')

            return
        }

        logExtendLastLine('None!\n')
    } catch (error) {
        if (ignoreMergeConflictsError && isErrorLike(error) && error instanceof GitError) {
            logWriteLine(logScope, `Skipped with following error: '${error.message}'\n`)

            return
        }

        // noop
        logExtendLastLine('Failed!\n')

        throw error
    }
}

/**
 *
 * @param git
 * @param commitMsg
 * @param branch
 * @param scope
 * @param forcePush
 * @param coAuthors should be "false" or string in format "username1,username1@email.com;username2,username2@email.com"
 * @returns
 */
export const createCommitAndPushCurrentChanges = async (
    git: SimpleGit,
    commitMsg: string,
    branch: string,
    scope: LogScope,
    forcePush: boolean,
    coAuthors: CoAuthor[] = []
): Promise<boolean> => {
    const status = await git.status()

    if (status.files.length === 0) {
        logWriteLine(scope, `No changes found`)

        return false
    }

    logWriteLine(scope, `Stage changes`)

    await git.add('.')

    logWriteLine(
        scope,
        [
            ...status.modified.map(x => ({ filePath: x, changeType: '~' })),
            ...status.deleted.map(x => ({ filePath: x, changeType: '-' })),
            ...status.created.map(x => ({ filePath: x, changeType: '+' })),
        ]
            .map(x => `Commit (${x.changeType}) ${x.filePath}`)
            .join('\n') + '\n'
    )

    logWriteLine(scope, `Creating '${commitMsg}' commit...`)

    let resolvedCommitMsg = commitMsg.trim()
    if (coAuthors.length > 0) {
        resolvedCommitMsg = coAuthors.reduce((prev, { authorEmail, authorUserName }) => {
            return (
                prev +
                `Co-authored-by: ${authorUserName} <${authorEmail ?? `${authorUserName}@users.noreply.github.com`}>\n`
            )
        }, `${resolvedCommitMsg}\n\n`)
    }

    await git.commit(resolvedCommitMsg)

    logExtendLastLine('Done!')

    logWriteLine(scope, `Pushing...`)

    await git.push('origin', branch, forcePush ? ['--force'] : [])

    logExtendLastLine('Done!')

    return true
}

export const copyFiles = async (
    git: SimpleGit,
    fromDir: string,
    toDir: string,
    sliceIgnores: string[],
    scope: LogScope
): Promise<string[]> => {
    logWriteLine(scope, `Copy files from '${fromDir}' to '${toDir}'...`)

    const ingoredFilesFromFromDir = await getFilesMatchPatterns(sliceIgnores, fromDir)
    const ingoredFilesFromToDir = await getFilesMatchPatterns(sliceIgnores, toDir)
    const excludeFilterFiles = Array.from(
        new Set([
            // It requires to have `**/` as prefix to work with dir-compare filter
            '**/.DS_Store',
            '**/.git/**',
            // It requires to have `/` as prefix to work with dir-compare filter
            ...ingoredFilesFromToDir.map(x => `/${x.replace(/^\/+/, '')}`),
            ...ingoredFilesFromFromDir.map(x => `/${x.replace(/^\/+/, '')}`),
        ])
    )

    const compareResponse = compareSync(toDir, fromDir, {
        compareContent: true,
        compareDate: false,
        compareSize: false,
        compareSymlink: true,
        excludeFilter: excludeFilterFiles.join(','),
    })

    logExtendLastLine('Done!')

    if (!compareResponse.diffSet || compareResponse.diffSet.length === 0) {
        logWriteLine(scope, `Found 0 diff file(s)!`)

        return []
    }

    const fileChanges: string[] = []
    const symlinkFiles: { filePath: string; targetLink: string; reason: Reason; state: DifferenceState }[] = []

    // Filter files only on left = to Dir
    const onlyOnToDirFiles = compareResponse.diffSet.filter(dif => dif.state === 'left')

    logWriteLine(scope, `Found ${onlyOnToDirFiles.length} onlyOnToDir file(s)!`)

    for (let i = 0; i < onlyOnToDirFiles.length; i++) {
        const diff = onlyOnToDirFiles[i]
        const filePath = `${diff.relativePath.substring(1)}/${diff.name1}`
        const absPath = path.join(toDir, filePath)

        if (!fs.existsSync(absPath)) {
            // For this case:
            // 1. Trying to delete a file which is a direct or in-direct symlink to a deleted file

            logWriteLine(scope, `Ignored: ${filePath}... (missing symlink direct/indirect file)`)

            continue
        }

        const lstat = await fs.lstat(path.join(toDir, filePath))

        if (lstat.isSymbolicLink()) {
            const targetLink = await fs.readlink(path.join(toDir, filePath))

            symlinkFiles.push({
                filePath,
                targetLink,
                reason: diff.reason,
                state: diff.state,
            })

            continue
        }

        if (lstat.isDirectory()) {
            // We don't handle directories here .i.e deleting directories since git focuses on files
            // this may be an empty directory or all its files are in ignored files list
            logWriteLine(scope, `Ignored: ${filePath}`)

            continue
        }

        logWriteLine(scope, `Deleting: ${filePath}...`)

        fs.rmSync(absPath, { force: true, recursive: true })

        fileChanges.push(absPath)

        logExtendLastLine('Done!')
    }

    // TODO: Getting problem with `.gitignore` related case
    // + Client push update some files, then add them to .gitignore
    // + When we copy those files into slice ropo (included .gitignore) => source won't have those files

    // Filter files only on right = from Dir
    const onlyOnFromDirFiles = compareResponse.diffSet.filter(dif => dif.state === 'right')

    logWriteLine(scope, `Found ${onlyOnFromDirFiles.length} onlyOnFromDir file(s)!`)

    for (let i = 0; i < onlyOnFromDirFiles.length; i++) {
        const diff = onlyOnFromDirFiles[i]
        const filePath = `${diff.relativePath.substring(1)}/${diff.name2}`
        const lstat = await fs.lstat(path.join(fromDir, filePath))

        if (lstat.isSymbolicLink()) {
            const targetLink = await fs.readlink(path.join(fromDir, filePath))

            symlinkFiles.push({
                filePath,
                targetLink,
                reason: diff.reason,
                state: diff.state,
            })

            continue
        }

        if (lstat.isFile()) {
            logWriteLine(scope, `Copying: ${filePath}...`)

            fs.copySync(path.join(fromDir, filePath), path.join(toDir, filePath), {
                overwrite: true,
                dereference: false,
                recursive: false,
            })

            fileChanges.push(path.join(toDir, filePath))

            logExtendLastLine('Done!')

            continue
        }

        // This happens when:
        // 1. This is a directory and all its files are in ignored files list
        logWriteLine(scope, `Ignored: ${filePath}`)
    }

    const distinctFiles = compareResponse.diffSet.filter(dif => dif.state === 'distinct')

    logWriteLine(scope, `Found ${distinctFiles.length} distinct file(s)!`)

    for (let i = 0; i < distinctFiles.length; i++) {
        const diff = distinctFiles[i]
        const filePath = `${diff.relativePath.substring(1)}/${diff.name1}`
        const lstat = await fs.lstat(path.join(fromDir, filePath))

        if (lstat.isSymbolicLink()) {
            const targetLink = await fs.readlink(path.join(fromDir, filePath))

            symlinkFiles.push({
                filePath,
                targetLink,
                reason: diff.reason,
                state: diff.state,
            })

            continue
        }

        if (lstat.isFile()) {
            logWriteLine(scope, `Overriding: ${filePath}...`)

            fs.copySync(path.join(fromDir, filePath), path.join(toDir, filePath), {
                overwrite: true,
                dereference: false,
                recursive: false,
            })

            fileChanges.push(path.join(toDir, filePath))

            logExtendLastLine('Done!')

            continue
        }

        // This happens when:
        // 1. This is a directory and all its files are in ignored files list
        logWriteLine(scope, `Ignored: ${filePath}`)
    }

    // TODO: Verify user cases when upstream changes a folder/file to symlink

    logWriteLine(scope, `Found ${symlinkFiles.length} symlinks!`)

    for (let i = 0; i < symlinkFiles.length; i++) {
        const { filePath, targetLink, reason, state } = symlinkFiles[i]

        logWriteLine(
            scope,
            `Checking symlink target '${filePath}' (${state}/${reason ?? 'No reason'}) with target '${targetLink}'...`
        )

        // we should update the target of symlink
        if (state === 'distinct') {
            const symlinkPath = path.join(toDir, filePath)

            if (reason === 'different-symlink') {
                logExtendLastLine(`Update synklink target of ${symlinkPath} with ${targetLink} on toDir...`)

                // we need 'recursive: true' to handle the case of directory link
                // We just need to copy the symlink file
                fs.rmSync(symlinkPath, { force: true, recursive: true })
                fs.symlinkSync(targetLink, symlinkPath)

                fileChanges.push(symlinkPath)

                logExtendLastLine('Done!')
            }

            continue
        }

        // only on toDir => we don't need to do anything here
        if (state === 'left') {
            logExtendLastLine('Ignored!')

            continue
        }

        // only on fromDir => create that symlink on toDir
        if (state === 'right') {
            const symlinkPath = path.join(toDir, filePath)
            const symlinkStats = fs.statSync(path.join(fromDir, filePath))

            if (symlinkStats.isFile()) {
                logExtendLastLine(`Copy symlink ${filePath}...`)

                // We just need to copy the symlink file
                fs.copySync(path.join(fromDir, filePath), symlinkPath, {
                    overwrite: false,
                    dereference: false,
                    recursive: false,
                })
            } else {
                if (fs.existsSync(symlinkPath)) {
                    // Use case for this:
                    // + Uptream has symlink to a dir
                    // + At this point, dir-compare considers that its sub files/dirs are new files/dirs and already copy them in above steps
                    // + This will make below call fs.copySync failed
                    // => That's why we need to call remove
                    logExtendLastLine(`${filePath} exists, deleting...`)

                    fs.rmSync(symlinkPath, { force: true, recursive: true })
                }

                logExtendLastLine(`Copy symlink ${filePath}...`)

                fs.symlinkSync(targetLink, symlinkPath)
            }

            fileChanges.push(symlinkPath)

            logExtendLastLine(`Done!`)

            continue
        }

        logExtendLastLine(`Ignored!`)
    }

    const status = await git.status()

    logWriteLine(
        scope,
        `Found ${fileChanges.length} diff files during compare - Git status: ${status.files.length} files`
    )

    return fileChanges
}

export const cleanAndDeleteLocalBranch = async (
    git: SimpleGit,
    scope: LogScope,
    defaultBranch: string,
    branch: string
): Promise<void> => {
    logWriteLine(scope, 'Clean...')

    await git.reset(ResetMode.HARD)
    await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)

    logExtendLastLine('Done!')

    logWriteLine(scope, 'Fetch...')

    await git.fetch('origin')

    logExtendLastLine('Done!')

    logWriteLine(scope, `Delete local branch '${branch}'...`)

    try {
        await git.checkout(defaultBranch)
        await git.pull('origin', defaultBranch)
        await git.branch(['-D', branch])
        await git.branch(['-Dr', branch])
    } catch (error) {
        // noop
    }

    logExtendLastLine('Done!')
}

export const checkoutAndPullLastVersion = async (
    git: SimpleGit,
    scope: LogScope,
    branch: string,
    isOpenSource = false
): Promise<void> => {
    logWriteLine(scope, `Checkout and pull last versions '${branch}' branch...`)

    const remoteName = isOpenSource ? OPEN_SOURCE_REMOTE : 'origin'

    await git.reset(ResetMode.HARD)
    await git.checkout(branch)
    await git.reset(['--hard', `${remoteName}/${branch}`])
    await git.pull(remoteName, branch)

    logExtendLastLine('Done!')

    logWriteLine(scope, `Clean...`)

    await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE + CleanOptions.IGNORED_INCLUDED)

    logExtendLastLine('Done!')
}
