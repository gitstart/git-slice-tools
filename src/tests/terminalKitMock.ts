type StdOut = (content: string) => void
type Terminal = StdOut & { up: () => Terminal; clear: () => Terminal; str: () => string }

let currentContent = ''

export const terminal: Terminal = (content: string) => {
    process.stdout.write(`${content}`)
    currentContent += content
}

terminal.up = () => {
    const lastNewLinePos = currentContent.lastIndexOf('\n')
    const nextLastNewLinePos = currentContent.lastIndexOf('\n', lastNewLinePos - 1)

    currentContent = currentContent.substring(0, nextLastNewLinePos + 1)
    return terminal
}

terminal.clear = () => {
    currentContent = ''
    return terminal
}

terminal.str = () => {
    return currentContent
}
