import process from 'process'
import path from 'path'
import { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    collectCoverage: !!process.env.CI,
    collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
    coverageDirectory: '<rootDir>/coverage',
    coveragePathIgnorePatterns: [/\/node_modules\//.source, /\.d\.ts$/.source, 'tests'],
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        'terminal-kit': path.join(__dirname, 'src/tests/terminalKitMock.ts'),
    },
    coverageReporters: ['json', 'lcov', 'text-summary'],
    setupFiles: [path.join(__dirname, 'src/tests/setupFiles.ts')],
    setupFilesAfterEnv: [path.join(__dirname, 'src/tests/setupFilesAfterEnv.ts')],
    testTimeout: 30000,
    globalSetup: path.join(__dirname, 'src/tests/jestGlobalSetup.ts'),
}

export default config
