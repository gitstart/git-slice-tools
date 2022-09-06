export const OPEN_SOURCE_REMOTE = 'open-source'

export const OPEN_SOURCE_FIELDS = {
    Status: 'Status',
    IssueReviewer: 'Issue reviewer',
    PRReviewer: 'PR reviewer',
    InstanceName: 'Instance name',
    AddedBy: 'Added by',
    CreditEstimate: 'Credit estimate',
} as const

export const OPEN_SOURCE_STATUS_OPTIONS = {
    PendingIssue: 'Pending issue',
    IssueApproved: 'Issue approved',
    IssueRejected: 'Issue rejected',
    InProgress: 'In progress',
    ReadyForLastReview: 'Ready for last review',
    ReadyToPushUpstream: 'Ready to push upstream',
    ChangesRequested: 'Changes requested',
    ClientReview: 'Client review',
    PRClosed: 'PR closed',
    PRMerged: 'PR merged',
} as const

export const OPEN_SOURCE_PROJECT_FIELD_TYPES = {
    SingleSelect: 'singleSelectOptionId',
    Text: 'text',
    Number: 'number',
} as const
