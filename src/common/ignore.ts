import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import { LogScope } from '../types'
import { logExtendLastLine, logWriteLine } from './logger'

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

export const deleteGitSliceIgnoreFiles = async (
    sliceIgnores: string[],
    rootDir: string,
    scope: LogScope
): Promise<void> => {
    logWriteLine(scope, `Getting git-slices ingoring files/directores...`)

    const paths = await globby(sliceIgnores, { cwd: rootDir })

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
