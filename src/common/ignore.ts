import fs from 'fs-extra'
import path from 'path'
import { LogScope } from '../types'
import { logExtendLastLine, logWriteLine } from './logger'
import simpleGit from 'simple-git'

export const getGitSliceIgoreConfig = (dir: string): string[] => {
    const filePath = path.resolve(dir, '.gitsliceignore')
    const gitSliceIgnoreFileExists = fs.existsSync(filePath)

    if (!gitSliceIgnoreFileExists) {
        return []
    }

    return (
        fs
            .readFileSync(filePath, 'utf8')
            .trim()
            .split(/\r?\n/g)
            .map(x => x.trim())
            // Remove empty line and comments
            .filter(x => x && !x.startsWith('#'))
    )
}

// For now we couldn't find a good npm package to handle ignore patterns like .gitignore
// So we use git command `ls-files --ignored` for now
export const getFilesMatchPatterns = async (patterns: string[], rootDir: string) => {
    const git = simpleGit(rootDir, { binary: 'git' })
    const raw = await git.raw(['ls-files', '--ignored', '--cached', ...patterns.flatMap(pattern => ['-x', pattern])])

    return (raw ?? '')
        .trim()
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean)
}

export const deleteGitSliceIgnoreFiles = async (
    sliceIgnores: string[],
    rootDir: string,
    scope: LogScope
): Promise<void> => {
    logWriteLine(scope, `Getting git-slices ingoring files/directores...`)

    const paths = await getFilesMatchPatterns(sliceIgnores, rootDir)

    logExtendLastLine(`Found ${paths.length}`)

    if (!paths.length) {
        return
    }

    for (let i = 0; i < paths.length; i++) {
        const pathMatch = paths[i]
        const resolvedPath = path.join(rootDir, pathMatch)

        logWriteLine(scope, `Deleting: ${pathMatch}...`)

        fs.rmSync(resolvedPath, { force: true, recursive: true })

        logExtendLastLine('Done!')
    }
}
