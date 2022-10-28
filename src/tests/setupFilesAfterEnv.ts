import { terminal } from 'terminal-kit'

const ORG_ENV_VARS = process.env

beforeEach(() => {
    process.env = { ...ORG_ENV_VARS }
})

afterEach(() => {
    terminal.clear()
})
