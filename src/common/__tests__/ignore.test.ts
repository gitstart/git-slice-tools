import { runScript } from '../../tests/runner'
import { prepareTestEnvs } from '../../common/tests'
import { getFilesMatchPatterns } from '../ignore'

describe('ignore/getFilesMatchPatterns', () => {
    it('Should return matched files correctly', async () => {
        const { cleanUp, upstreamDir } = await prepareTestEnvs('ignore-getFilesMatchPatterns')
        await runScript('checkout')

        const patterns = [
            'ignore-dir-1',
            'ignore-sub-dir-1',
            'ignore-dir-2/**',
            '!ignore-dir-2/ignore-dir-2-keep-file.md',
            '**/ignore-sub-dir-2/**',
            '!**/ignore-sub-dir-2/ignore-sub-dir-2-keep-file.md',
            'ignore-file.md',
            '.gitsliceignore',
        ]

        const matched = await getFilesMatchPatterns(patterns, upstreamDir)

        expect(matched).toEqual([
            '.gitsliceignore',
            'dir-1/ignore-sub-dir-1/file-1.md',
            'dir-1/ignore-sub-dir-1/file-2.md',
            'dir-2/ignore-sub-dir-2/file-1.md',
            'dir-2/ignore-sub-dir-2/file-2.md',
            'ignore-dir-1/file-1.md',
            'ignore-dir-1/file-2.md',
            'ignore-dir-2/file-1.md',
            'ignore-dir-2/file-2.md',
            'ignore-file.md',
        ])

        await cleanUp([])
    })
})
