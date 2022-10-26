import parser from '..'

export const runScript = (...args: string[]): Promise<unknown> => {
    return parser(args).parseAsync()
}
