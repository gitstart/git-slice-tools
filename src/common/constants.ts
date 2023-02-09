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

export const OPEN_SOURCE_COMMENT_REQUEST_ISSUE_REVIEW = `:rocket: Heads up @{reviewing_committee_team}, this open source issue is ready for review`
export const OPEN_SOURCE_COMMENT_REQUEST_PR_REVIEW = `:rocket: Heads up @{reviewing_committee_team}, this PR is ready for final review`
export const OPEN_SOURCE_COMMENT_ISSUE_DISCONTINUED = ':disappointed: This issue is discontinued'
export const OPEN_SOURCE_COMMENT_PR_DISCONTINUED = ':disappointed: This PR is discontinued'
export const OPEN_SOURCE_COMMENT_PR_MERGED = ':tada: This PR is merged by client'
export const OPEN_SOURCE_COMMENT_ISSUE_APPROVED = `:rocket: Heads up @{issueAddedBy}, @{reviewer} approved this issue.\n- [ ] Don't forget to set credits estimate by using \`/open-source estimate <credits>\` command.`
export const OPEN_SOURCE_COMMENT_ISSUE_REJECTED = `:disappointed: Sorry @{issueAddedBy}, @{reviewer} rejected this issue.`
export const OPEN_SOURCE_COMMENT_PR_APPROVED = `:tada: @{reviewer} approved this PR. Let's push this PR upstream, but be careful at the 5 PR per repo limit :slightly_smiling_face:`
export const OPEN_SOURCE_COMMENT_PR_REQUESTED_CHANGES = `:rocket: Heads up devs, @{reviewer} requested changes in this PR.`

export const AUTO_CO_AUTHORS_COMMITS_OPTIONS = {
    GitLogs: 'git-logs',
    None: 'none',
    PrAssignees: 'pr-assignees',
} as const
