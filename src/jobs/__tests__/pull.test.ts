import { runScript } from '../../tests/runner'
import { prepareTestEnvs, prependTextFile, SAMPLE_BRANCHES } from '../../tests/common'
import simpleGit from 'simple-git'
import path from 'path'
import fs from 'fs-extra'

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
            '["/file-1.md", "/file-2.md", "ignore-sub-dir-2-keep-file.md", "ignore-dir-2-keep-file.md"]'

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

    it('Should delete files when they are added into .gitsliceignore on upstream', async () => {
        const { sliceDir, upstreamDir, key, testRepo, cleanUp } = await prepareTestEnvs('pull')
        const upstreamMainBranch = `upstream-main-${key}`
        const sliceMainBranch = `slice-main-${key}`

        await testRepo.createNewBranchFromBranch(upstreamMainBranch, SAMPLE_BRANCHES.upstreamMain)
        await testRepo.createNewBranchFromBranch(sliceMainBranch, SAMPLE_BRANCHES.correctedSlicedMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = upstreamMainBranch
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = sliceMainBranch

        await runScript('checkout')

        const upstreamGit = simpleGit(upstreamDir, { binary: 'git' })

        // Check file-2.md exists in slice dir
        expect(fs.existsSync(path.resolve(sliceDir, 'file-2.md'))).toBeTruthy()

        // Add `file-2.md` into `.gitsliceignore` in upstream main branch
        await prependTextFile(upstreamDir, '.gitsliceignore', 'file-2.md')
        await upstreamGit.add('.')
        await upstreamGit.commit('chore: add file-2.md into .gitsliceignore')
        await upstreamGit.push('origin', upstreamMainBranch)

        // execute pull
        await runScript('pull')

        expect(fs.existsSync(path.resolve(sliceDir, 'file-2.md'))).toBeFalsy()

        await cleanUp([upstreamMainBranch, sliceMainBranch])
    })

    it('Should pull changes which are maded on files are added in .gitignore from upstream', async () => {
        const { sliceDir, upstreamDir, key, testRepo, cleanUp } = await prepareTestEnvs('pull')
        const upstreamMainBranch = `upstream-main-${key}`
        const sliceMainBranch = `slice-main-${key}`

        await testRepo.createNewBranchFromBranch(upstreamMainBranch, SAMPLE_BRANCHES.upstreamMain)
        await testRepo.createNewBranchFromBranch(sliceMainBranch, SAMPLE_BRANCHES.correctedSlicedMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = upstreamMainBranch
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = sliceMainBranch

        await runScript('checkout')

        const sliceGit = simpleGit(sliceDir, { binary: 'git' })
        const upstreamGit = simpleGit(upstreamDir, { binary: 'git' })

        // Add some changes in a existed gitignored file "gitignore-dir/file-1.md"
        await prependTextFile(upstreamDir, 'gitignore-dir/file-1.md', upstreamMainBranch)
        await upstreamGit.add('.')
        await upstreamGit.commit('chore: edit gitignore-dir/file-1.md')
        await upstreamGit.push('origin', upstreamMainBranch)

        // execute pull
        await runScript('pull')

        await sliceGit.checkout(SAMPLE_BRANCHES.correctedSlicedMain)
        await sliceGit.checkout(sliceMainBranch)

        let diffs = await sliceGit.diffSummary([SAMPLE_BRANCHES.correctedSlicedMain])

        // there should be 1 file diff gitignore-dir/file-1.md
        expect(diffs.files).toHaveLength(1)
        expect(diffs.files.map(file => file.file)).toEqual(['gitignore-dir/file-1.md'])

        // force add a new file into gitignored folder "gitignore-dir"
        fs.writeFileSync(path.resolve(upstreamDir, 'gitignore-dir/file-3.md'), 'file-3.md\n')
        await upstreamGit.raw('add', 'gitignore-dir/file-3.md', '--force')
        await upstreamGit.commit('chore: add gitignore-dir/file-3.md')
        await upstreamGit.push('origin', upstreamMainBranch)

        // execute pull
        await runScript('pull')

        diffs = await sliceGit.diffSummary([SAMPLE_BRANCHES.correctedSlicedMain])

        // there should be 2 files diff now gitignore-dir/file-1.md & gitignore-dir/file-3.md
        expect(diffs.files).toHaveLength(2)
        expect(diffs.files.map(file => file.file)).toEqual(['gitignore-dir/file-1.md', 'gitignore-dir/file-3.md'])

        await cleanUp([upstreamMainBranch, sliceMainBranch])
    })

    it('Should pull symlinks correctly', async () => {
        const { sliceDir, key, testRepo, cleanUp } = await prepareTestEnvs('pull')
        const upstreamMainBranch = `upstream-main-${key}`
        const sliceMainBranch = `slice-main-${key}`

        await testRepo.createNewBranchFromBranch(upstreamMainBranch, SAMPLE_BRANCHES.upstreamMain)
        await testRepo.createNewBranchFromBranch(sliceMainBranch, SAMPLE_BRANCHES.sliceMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = upstreamMainBranch
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = sliceMainBranch

        await runScript('checkout')

        // execute pull
        await runScript('pull')

        // confirm `symlinks/symlink-file.md` is a symlimk
        const symlinkFilePath = path.resolve(sliceDir, 'symlinks/symlink-file.md')
        const symlinkFileStats = fs.lstatSync(symlinkFilePath)

        expect(symlinkFileStats.isSymbolicLink()).toBeTruthy()
        // '..' here to get resolve the symlink directory container
        expect(path.resolve(symlinkFilePath, '..', fs.readlinkSync(symlinkFilePath))).toBe(
            path.resolve(sliceDir, 'symlink-org-file.md')
        )

        // confirm `symlinks/symlink-dir` is a symlimk
        const symlinkDirPath = path.resolve(sliceDir, 'symlinks/symlink-dir')
        const symlinkDirStats = fs.lstatSync(symlinkDirPath)

        expect(symlinkDirStats.isSymbolicLink()).toBeTruthy()
        // '..' here to get resolve the symlink directory container
        expect(path.resolve(symlinkDirPath, '..', fs.readlinkSync(symlinkDirPath))).toBe(
            path.resolve(sliceDir, 'symlink-org-dir')
        )

        await cleanUp([upstreamMainBranch, sliceMainBranch])
    })

    it('Should pull changes on symlinks correctly', async () => {
        const { sliceDir, key, upstreamDir, testRepo, cleanUp } = await prepareTestEnvs('pull')
        const upstreamMainBranch = `upstream-main-${key}`
        const sliceMainBranch = `slice-main-${key}`

        await testRepo.createNewBranchFromBranch(upstreamMainBranch, SAMPLE_BRANCHES.upstreamMain)
        await testRepo.createNewBranchFromBranch(sliceMainBranch, SAMPLE_BRANCHES.correctedSlicedMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = upstreamMainBranch
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = sliceMainBranch

        await runScript('checkout')

        const upstreamGit = simpleGit(upstreamDir, { binary: 'git' })

        // Update target of 'symlinks/symlink-file.md'
        fs.rmSync(path.resolve(upstreamDir, 'symlinks/symlink-file.md'), { force: true })
        fs.symlinkSync('../file-1.md', path.resolve(upstreamDir, 'symlinks/symlink-file.md'))

        // Update target of 'symlinks/symlink-dir'
        fs.rmSync(path.resolve(upstreamDir, 'symlinks/symlink-dir'), { force: true, recursive: true })
        fs.symlinkSync('../dir-1', path.resolve(upstreamDir, 'symlinks/symlink-dir'))

        await upstreamGit.add('.')
        await upstreamGit.commit('chore: update some symlinks')
        await upstreamGit.push('origin', upstreamMainBranch)

        await runScript('pull')

        // confirm `symlinks/symlink-file.md` is a symlimk
        const symlinkFilePath = path.resolve(sliceDir, 'symlinks/symlink-file.md')
        const symlinkFileStats = fs.lstatSync(symlinkFilePath)

        expect(symlinkFileStats.isSymbolicLink()).toBeTruthy()
        // '..' here to get resolve the symlink directory container
        expect(path.resolve(symlinkFilePath, '..', fs.readlinkSync(symlinkFilePath))).toBe(
            path.resolve(sliceDir, 'file-1.md')
        )

        // confirm `symlinks/symlink-dir` is a symlimk
        const symlinkDirPath = path.resolve(sliceDir, 'symlinks/symlink-dir')
        const symlinkDirStats = fs.lstatSync(symlinkDirPath)

        expect(symlinkDirStats.isSymbolicLink()).toBeTruthy()
        // '..' here to get resolve the symlink directory container
        expect(path.resolve(symlinkDirPath, '..', fs.readlinkSync(symlinkDirPath))).toBe(
            path.resolve(sliceDir, 'dir-1')
        )

        await cleanUp([upstreamMainBranch, sliceMainBranch])
    })

    it.todo('Should pull lfs and changes on lfs files correctly')
})

describe('opensource flow - pull', () => {
    // TODO: Add tests for opensource flow
})
