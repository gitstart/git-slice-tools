type StdOut = (content: string) => void

let currentContent = ''

export const terminal: StdOut & { up: () => typeof terminal; clear: () => typeof terminal; str: () => string } = (
    content: string
) => {
    currentContent += content
}

terminal.up = () => {
    // should be remote a line here
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
