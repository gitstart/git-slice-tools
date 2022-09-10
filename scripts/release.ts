import * as semver from 'semver'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { version } from '../package.json'
import globby from 'globby'

const relaseType = String(process.env.RELEASE_TYPE).toLowerCase()
const rootDir = path.resolve(__dirname, '../')

if (!['major', 'minor', 'patch', 'branch'].includes(relaseType)) {
    throw new Error('Invalid RELEASE_TYPE')
}

const buffer = execSync('curl -s https://raw.githubusercontent.com/GitStartHQ/git-slice-tools/main/package.json')
const mainVersion = String(JSON.parse(buffer.toString('utf8')).version)
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

let nextVersion = mainVersion

if (relaseType === 'branch') {
    nextVersion = `${mainVersion}-${currentBranch}`
} else {
    const semverReleaseType = relaseType as semver.ReleaseType

    nextVersion = semver.inc(mainVersion, semverReleaseType) ?? ''
}

console.log(`Releasing version ${nextVersion}`)
const githubRev = relaseType === 'branch' ? currentBranch : `v${nextVersion}`

console.log(`Updating package.json...`)
const packageJsonFilePath = path.resolve(rootDir, 'package.json')
const originalPackageJson = fs.readFileSync(packageJsonFilePath).toString()
const nextPackageJson = originalPackageJson.replace(`"version": "${version}"`, `"version": "${nextVersion}"`)

fs.writeFileSync(packageJsonFilePath, nextPackageJson)

const files = ['git-slice-open-source.yml', 'git-slice.yml', 'docs/open-source-issues-workflow.md', 'README.md']

// Get yml files in /actions
const actionFiles = globby.sync('actions/**/*.yml', { cwd: rootDir })

files.push(...actionFiles)

for (const file of files) {
    console.log(`Updating ${file}...`)

    const filePath = path.resolve(rootDir, file)
    const orgFileContent = fs.readFileSync(filePath).toString()
    const nextFileContent = orgFileContent.replace(/(GitStartHQ\/git-slice-tools\/?.*[@#])(.*)$/gm, `$1${githubRev}`)

    fs.writeFileSync(filePath, nextFileContent)
}

console.log(`Building...`)
execSync('yarn build', { cwd: rootDir })

console.log(`Done!`)
