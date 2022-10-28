import { runScript } from '../../tests/runner'
import { prepareTestEnvs, SAMPLE_BRANCHES } from '../../common/tests'
import simpleGit from 'simple-git'

describe('default flow - pull', () => {
    it('Should have the same source as "sliced-main" branch after pull job', async () => {
        const { sliceDir, key, testRepo, cleanUp } = await prepareTestEnvs('pull')
        const targetSliceBranch = `slice-main-${key}`
        const targetUpstreamBranch = `upstream-main-${key}`

        await testRepo.createNewBranchFromBranch(targetUpstreamBranch, SAMPLE_BRANCHES.upstreamMain)
        await testRepo.createNewBranchFromBranch(targetSliceBranch, SAMPLE_BRANCHES.sliceMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = targetUpstreamBranch
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = targetSliceBranch

        await runScript('checkout')

        const sliceGit = simpleGit(sliceDir, { binary: 'git' })

        // we need to checkout `sliced-main` once for diff calling below
        await sliceGit.checkout(SAMPLE_BRANCHES.correctedSlicedMain)
        await sliceGit.checkout(targetSliceBranch)

        let diffs = await sliceGit.diffSummary([SAMPLE_BRANCHES.correctedSlicedMain])

        // there should be some diffs between this branch and `sliced-branch` before pull job
        expect(diffs.files).not.toHaveLength(0)

        await runScript('pull')

        diffs = await sliceGit.diffSummary([SAMPLE_BRANCHES.correctedSlicedMain])

        // there should be no diffs between this branch and `sliced-branch` after pull job
        expect(diffs.files).toHaveLength(0)

        await cleanUp([targetUpstreamBranch, targetSliceBranch])
    })

    it('Should respect GIT_SLICE_SLICE_IGNORES config', async () => {
        const { sliceDir, key, testRepo, cleanUp } = await prepareTestEnvs('pull')
        const targetSliceBranch = `slice-main-${key}`
        const targetUpstreamBranch = `upstream-main-${key}`

        await testRepo.createNewBranchFromBranch(targetUpstreamBranch, SAMPLE_BRANCHES.upstreamMain)
        await testRepo.createNewBranchFromBranch(targetSliceBranch, SAMPLE_BRANCHES.sliceMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = targetUpstreamBranch
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = targetSliceBranch
        process.env.GIT_SLICE_SLICE_IGNORES =
            '["file-1.md", "file-2.md", "ignore-sub-dir-2-keep-file.md", "ignore-dir-2-keep-file.md"]'

        await runScript('checkout')

        const sliceGit = simpleGit(sliceDir, { binary: 'git' })

        // we need to checkout `sliced-main` once for diff calling below
        await sliceGit.checkout(SAMPLE_BRANCHES.correctedSlicedMain)
        await sliceGit.checkout(targetSliceBranch)

        await runScript('pull')

        const diffs = await sliceGit.diffSummary([SAMPLE_BRANCHES.correctedSlicedMain])

        // there should be some diffs (caused by process.env.GIT_SLICE_SLICE_IGNORES updates)
        // between this branch and `sliced-branch` after pull job
        expect(diffs.files).toHaveLength(4)

        expect(diffs.files.map(file => file.file)).toEqual([
            'dir-2/ignore-sub-dir-2/ignore-sub-dir-2-keep-file.md',
            'file-1.md',
            'file-2.md',
            'ignore-dir-2/ignore-dir-2-keep-file.md',
        ])

        await cleanUp([targetUpstreamBranch, targetSliceBranch])
    })
})

describe('opensource flow - pull', () => {
    // TODO: Add tests for opensource flow
})
