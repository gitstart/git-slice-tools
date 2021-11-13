export interface ActionInputs {
    sliceIgnores: string[]
    pushBranchNameTemplate: string
    pushCommitMsgRegex: RegExp
    forceInit: boolean
    sliceRepo: Repo
    upstreamRepo: Repo
}

export interface Repo {
    name: string
    dir: string
    defaultBranch: string
    username: string
    userEmail: string
    gitHttpUri: string
    userToken: string
}
