import parser from '..'

export const runScript = (...args: string[]): Promise<unknown> => {
    return parser(args)
        .fail((msg, error) => {
            if (error) {
                throw error
            }

            console.log(msg)
            process.exit(1)
        })
        .parseAsync()
}
