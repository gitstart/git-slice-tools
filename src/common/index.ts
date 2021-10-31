import { Glob } from 'glob'
import path from 'path'
import fs from 'fs'
import { terminal } from 'terminal-kit'

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
