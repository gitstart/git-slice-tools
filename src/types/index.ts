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
    openSourceInstanceName: string
    openSourceManagerProjectView: string
    openSourceTeamReviewingCommittee: string
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

export interface ProjectManagerView {
    org: string
    projectNumber: number
    viewNumber: number
}

export interface IssueOSSData {
    issueId: string
    itemId: string
}

export interface ProjectV2Field {
    id: string
    name: string
    options?: { id: string; name: string }[]
}

export interface EventIssue {
    __typename: 'Issue'
    id: string
    itemNumber: number
}

export interface EventPullRequest {
    __typename: 'PullRequest'
    id: string
    itemNumber: number
}

export type EventIssueOrPullRequest = EventIssue | EventPullRequest

export interface IssueTimelineBaseEvent {
    source: EventIssueOrPullRequest
    subject: EventIssueOrPullRequest
}

export interface IssueTimelineConnectedEvent extends IssueTimelineBaseEvent {
    __typename: 'ConnectedEvent'
}

export interface IssueTimelineDisconnectedEvent extends IssueTimelineBaseEvent {
    __typename: 'DisconnectedEvent'
}

export type IssueTimelineEvent = IssueTimelineConnectedEvent | IssueTimelineDisconnectedEvent
