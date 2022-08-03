export type LogScope = 'Upstream' | 'Slice' | 'OpenSource'

export interface ActionInputs {
    sliceIgnores: string[]
    pushBranchNameTemplate: string
    pushCommitMsgRegex: RegExp
    forceInit: boolean
    sliceRepo: Repo
    upstreamRepo: Repo
    prLabels: string[]
    prDraft: boolean
    isOpenSourceFlow: boolean
    openSourceUrl: string
}

export interface Repo {
    name: LogScope
    dir: string
    defaultBranch: string
    username: string
    userEmail: string
    gitHttpUri: string
    userToken: string
}

export interface ErrorLike {
    message: string
    name?: string
}
