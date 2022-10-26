import { runScript } from '../../tests/runner'
import { prepareTestEnvs } from '../../common/tests'
import simpleGit from 'simple-git'

describe('default flow - checkout', () => {
    it('Default flow - Should setup slice & upstream repo correctly', async () => {
        const { sliceDir, upstreamDir, cleanUp } = await prepareTestEnvs('checkout')
        await runScript('checkout')

        const sliceGit = simpleGit(sliceDir, { binary: 'git' })
        const upstreamGit = simpleGit(upstreamDir, { binary: 'git' })

        const sliceRemotes = (await sliceGit.getRemotes(true)).reduce((prev, current) => {
            return {
                ...prev,
                [current.name]: current.refs.fetch,
            }
        }, {})
        const upstreamRemotes = (await upstreamGit.getRemotes(true)).reduce((prev, current) => {
            return {
                ...prev,
                [current.name]: current.refs.fetch,
            }
        }, {})

        expect(sliceRemotes).toHaveProperty(
            'origin',
            `https://${process.env.GIT_SLICE_SLICE_REPO_USERNAME}:${
                process.env.GIT_SLICE_SLICE_REPO_PASSWORD
            }@${process.env.GIT_SLICE_SLICE_REPO_URL.replace('https://', '')}`
        )
        expect(upstreamRemotes).toHaveProperty(
            'origin',
            `https://${process.env.GIT_SLICE_UPSTREAM_REPO_USERNAME}:${
                process.env.GIT_SLICE_UPSTREAM_REPO_PASSWORD
            }@${process.env.GIT_SLICE_UPSTREAM_REPO_URL.replace('https://', '')}`
        )

        const sliceStatus = await sliceGit.status()
        const upstreamStatus = await upstreamGit.status()

        expect(sliceStatus.current).toBe(process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH)
        expect(sliceStatus.files).toHaveLength(0)

        expect(upstreamStatus.current).toBe(process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH)
        expect(upstreamStatus.files).toHaveLength(0)

        await cleanUp([])
    })
})

describe('opensource flow - checkout', () => {
    // TODO: Add tests for opensource flow
})
