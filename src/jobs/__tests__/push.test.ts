import { runScript } from '../../tests/runner'
import { prepareTestEnvs, prependTextFile, SAMPLE_BRANCHES } from '../../common/tests'
import simpleGit from 'simple-git'
import fs from 'fs-extra'
import path from 'path'

describe('default flow - push', () => {
    it('Should not push changes on ignored files', async () => {
        const { sliceDir, upstreamDir, key, testRepo, cleanUp } = await prepareTestEnvs('push')
        const sliceBranch = `slice-main-${key}`
        const pushedBranch = `pushed-${sliceBranch}`

        await testRepo.createNewBranchFromBranch(sliceBranch, SAMPLE_BRANCHES.correctedSlicedMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.upstreamMain
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.correctedSlicedMain
        process.env.GIT_SLICE_SLICE_IGNORES = '["file-1.md"]'

        await runScript('checkout')

        const sliceGit = simpleGit(sliceDir, { binary: 'git' })
        const upstreamGit = simpleGit(upstreamDir, { binary: 'git' })

        await sliceGit.checkout(sliceBranch)

        // Make some changes on a ignored file "file-1.md"
        await prependTextFile(sliceDir, 'file-1.md', sliceBranch)

        // stage & push changes
        await sliceGit.add('.')
        await sliceGit.commit('chore: edit file-1.md')
        await sliceGit.push('origin', sliceBranch)

        // execute push
        await runScript('push', '--branch', sliceBranch, '--message', 'chore: edit file-1.md', '--force-push', 'true')

        // we don't sync changes on ignored files => no changed files => no new branch is pushed
        expect(await testRepo.getBranchId(pushedBranch)).toBeUndefined()

        // Make some changes on normal file "file-2.md"
        await prependTextFile(sliceDir, 'file-2.md', sliceBranch)

        // stage & push changes again
        await sliceGit.add('.')
        await sliceGit.commit('chore: edit file-2.md')
        await sliceGit.push('origin', sliceBranch)

        // execute push again
        await runScript('push', '--branch', sliceBranch, '--message', 'chore: edit file-2.md', '--force-push', 'true')

        // New pushed branch should exist
        expect(await testRepo.getBranchId(pushedBranch)).not.toBeUndefined()

        await upstreamGit.fetch('origin')
        await upstreamGit.checkout(pushedBranch)

        const diffs = await upstreamGit.diffSummary([SAMPLE_BRANCHES.upstreamMain])

        // there should be only one file diff file-2.md at this point
        expect(diffs.files).toHaveLength(1)
        expect(diffs.files.map(file => file.file)).toEqual(['file-2.md'])

        await cleanUp([pushedBranch, sliceBranch])
    })

    it('Should throw error if commit message fails the GIT_SLICE_PUSH_COMMIT_MSG_REGEX config', async () => {
        const { key, testRepo, cleanUp } = await prepareTestEnvs('push')
        const sliceBranch = `slice-main-${key}`
        const pushedBranch = `pushed-${sliceBranch}`

        await testRepo.createNewBranchFromBranch(sliceBranch, SAMPLE_BRANCHES.correctedSlicedMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.upstreamMain
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.correctedSlicedMain
        process.env.GIT_SLICE_PUSH_COMMIT_MSG_REGEX = '(feat|fix):\\s.*'

        await runScript('checkout')

        // execute push with invalid commit message
        await expect(
            runScript('push', '--branch', sliceBranch, '--message', 'This is a invalid commit message')
        ).rejects.toThrow('Commit message failed PUSH_COMMIT_MSG_REGEX')

        await expect(
            runScript('push', '--branch', sliceBranch, '--message', 'fix:sematic but still invalid')
        ).rejects.toThrow('Commit message failed PUSH_COMMIT_MSG_REGEX')

        // execute push with valid commit message
        await runScript('push', '--branch', sliceBranch, '--message', 'fix: this is a valid commit message')

        await cleanUp([pushedBranch, sliceBranch])
    })

    it('Should throw error if there is no `git-slice:*` commit in slice main branch', async () => {
        const { key, testRepo, cleanUp } = await prepareTestEnvs('push')
        const sliceBranch = `slice-main-${key}`
        const pushedBranch = `pushed-${sliceBranch}`

        // There should be no `git-slice:*` in SAMPLE_BRANCHES.upstreamMain
        await testRepo.createNewBranchFromBranch(sliceBranch, SAMPLE_BRANCHES.upstreamMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.upstreamMain
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = sliceBranch

        await runScript('checkout')

        // execute push with invalid commit message
        await expect(runScript('push', '--branch', sliceBranch, '--message', 'commit message')).rejects.toThrow(
            'Not found git-slice:*** commit in last 20 commits'
        )

        await cleanUp([pushedBranch, sliceBranch])
    })

    it('Should throw error if the pushing branch does not exist', async () => {
        const { key, cleanUp } = await prepareTestEnvs('push')
        const sliceBranch = `slice-main-${key}`

        // we don't call `testRepo.createNewBranchFromBranch` for this `sliceBranch`

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.upstreamMain
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.correctedSlicedMain

        await runScript('checkout')

        await expect(runScript('push', '--branch', sliceBranch, '--message', 'commit messages')).rejects.toThrow()

        await cleanUp([sliceBranch])
    })

    it('Should handle force-push flag correctly when pushing branch exists', async () => {
        const { key, sliceDir, upstreamDir, testRepo, cleanUp } = await prepareTestEnvs('push')
        const sliceBranch = `slice-main-${key}`
        const pushedBranch = `pushed-${sliceBranch}`

        await testRepo.createNewBranchFromBranch(sliceBranch, SAMPLE_BRANCHES.correctedSlicedMain)
        await testRepo.createNewBranchFromBranch(pushedBranch, SAMPLE_BRANCHES.upstreamMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.upstreamMain
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = SAMPLE_BRANCHES.correctedSlicedMain

        await runScript('checkout')

        const sliceGit = simpleGit(sliceDir, { binary: 'git' })
        const upstreamGit = simpleGit(upstreamDir, { binary: 'git' })

        // push some changes to pushedBranch
        await upstreamGit.checkout(pushedBranch)
        // we make changes on ignore-file.md to prevent push job override it
        await prependTextFile(upstreamDir, 'ignore-file.md', pushedBranch)
        await upstreamGit.add('.')
        await upstreamGit.commit('chore: edit ignore-file.md')
        await upstreamGit.push('origin', pushedBranch)

        // push some changes to sliceBranch
        await sliceGit.checkout(sliceBranch)
        await prependTextFile(sliceDir, 'file-3.md', sliceBranch)
        await sliceGit.add('.')
        await sliceGit.commit('chore: edit file-3.md')
        await sliceGit.push('origin', sliceBranch)

        // execute push
        await runScript('push', '--branch', sliceBranch, '--message', 'chore: edit file-3.md')

        await upstreamGit.fetch('origin')
        await upstreamGit.checkout(pushedBranch)

        let diffs = await upstreamGit.diffSummary([SAMPLE_BRANCHES.upstreamMain])

        // there should be 2 files diff ignore-file.md file-3.md at this point
        expect(diffs.files).toHaveLength(2)
        expect(diffs.files.map(file => file.file)).toEqual(['file-3.md', 'ignore-file.md'])

        // execute push with --force-push flag
        await runScript('push', '--branch', sliceBranch, '--message', 'chore: edit file-3.md', '--force-push', 'true')

        await upstreamGit.fetch('origin')
        await upstreamGit.checkout(pushedBranch)

        // there should be only file-3.md file diff now since 'ignore-file.md' is gone due to force-push
        diffs = await upstreamGit.diffSummary([SAMPLE_BRANCHES.upstreamMain])
        expect(diffs.files).toHaveLength(1)
        expect(diffs.files.map(file => file.file)).toEqual(['file-3.md'])

        await cleanUp([pushedBranch, sliceBranch])
    })

    it('Should pull main branch into pushing branch when pushing changes', async () => {
        const { key, sliceDir, upstreamDir, testRepo, cleanUp } = await prepareTestEnvs('push')
        const upstreamMainBranch = `upstream-main-${key}`
        const sliceMainBranch = `slice-main-${key}`
        const sliceBranch = `slice-branch-${key}`
        const pushedBranch = `pushed-${sliceBranch}`

        await testRepo.createNewBranchFromBranch(upstreamMainBranch, SAMPLE_BRANCHES.upstreamMain)
        await testRepo.createNewBranchFromBranch(sliceMainBranch, SAMPLE_BRANCHES.correctedSlicedMain)
        await testRepo.createNewBranchFromBranch(sliceBranch, SAMPLE_BRANCHES.correctedSlicedMain)

        process.env.GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH = upstreamMainBranch
        process.env.GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH = sliceMainBranch

        await runScript('checkout')

        const sliceGit = simpleGit(sliceDir, { binary: 'git' })
        const upstreamGit = simpleGit(upstreamDir, { binary: 'git' })

        // make some changes on sliceBranch and push via git-slice-tools
        await sliceGit.checkout(sliceBranch)
        await prependTextFile(sliceDir, 'file-1.md', sliceBranch)
        await sliceGit.add('.')
        await sliceGit.commit('chore: edit file-1.md')
        await sliceGit.push('origin', sliceBranch)
        await runScript('push', '--branch', sliceBranch, '--message', 'chore: edit file-1.md from git-slice-tools')

        // make some changes on upstreamMainBranch and push via git
        await upstreamGit.checkout(upstreamMainBranch)
        const upstreamedFile1Content = await prependTextFile(upstreamDir, 'file-1.md', upstreamMainBranch)
        await upstreamGit.add('.')
        await upstreamGit.commit('chore: edit file-1.md from git')
        await upstreamGit.push('origin', upstreamMainBranch)

        // execute pull job
        await runScript('pull')

        // make extra changes in sliceBranch
        await sliceGit.checkout(sliceBranch)
        await prependTextFile(sliceDir, 'file-2.md', sliceBranch)
        await sliceGit.add('.')
        await sliceGit.commit('chore: edit file-2.md')
        await sliceGit.push('origin', sliceBranch)

        // At this point, it should cause CONFLICT error because of file-1.md changes
        await expect(
            runScript('push', '--branch', sliceBranch, '--message', 'chore: edit file-2.md from git-slice-tools')
        ).rejects.toThrow('CONFLICT')

        // Resolve conflicts
        await sliceGit.raw('merge', '--abort')
        await fs.writeFile(path.resolve(sliceDir, 'file-1.md'), upstreamedFile1Content, { flag: 'w' })
        await sliceGit.add('.')
        await sliceGit.commit('fix: conflict file-1.md')
        await sliceGit.push('origin', sliceBranch)

        await runScript(
            'push',
            '--branch',
            sliceBranch,
            '--message',
            'chore: revert file-1.md and edit file-2.md from git-slice-tools'
        )

        await upstreamGit.fetch('origin')
        await upstreamGit.checkout(pushedBranch)

        // there should be only file-2.md file diff now
        const diffs = await upstreamGit.diffSummary([upstreamMainBranch])
        expect(diffs.files).toHaveLength(1)
        expect(diffs.files.map(file => file.file)).toEqual(['file-2.md'])

        await cleanUp([upstreamMainBranch, sliceMainBranch, pushedBranch, sliceBranch])
    })
})

describe('opensource flow - push', () => {
    // TODO: Add tests for opensource flow
})
