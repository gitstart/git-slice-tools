"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPEN_SOURCE_COMMENT_PR_REQUESTED_CHANGES = exports.OPEN_SOURCE_COMMENT_PR_APPROVED = exports.OPEN_SOURCE_COMMENT_ISSUE_REJECTED = exports.OPEN_SOURCE_COMMENT_ISSUE_APPROVED = exports.OPEN_SOURCE_COMMENT_PR_MERGED = exports.OPEN_SOURCE_COMMENT_PR_DISCONTINUED = exports.OPEN_SOURCE_COMMENT_ISSUE_DISCONTINUED = exports.OPEN_SOURCE_COMMENT_REQUEST_PR_REVIEW = exports.OPEN_SOURCE_COMMENT_REQUEST_ISSUE_REVIEW = exports.OPEN_SOURCE_PROJECT_FIELD_TYPES = exports.OPEN_SOURCE_STATUS_OPTIONS = exports.OPEN_SOURCE_FIELDS = exports.OPEN_SOURCE_REMOTE = void 0;
exports.OPEN_SOURCE_REMOTE = 'open-source';
exports.OPEN_SOURCE_FIELDS = {
    Status: 'Status',
    IssueReviewer: 'Issue reviewer',
    PRReviewer: 'PR reviewer',
    InstanceName: 'Instance name',
    AddedBy: 'Added by',
    CreditEstimate: 'Credit estimate',
};
exports.OPEN_SOURCE_STATUS_OPTIONS = {
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
};
exports.OPEN_SOURCE_PROJECT_FIELD_TYPES = {
    SingleSelect: 'singleSelectOptionId',
    Text: 'text',
    Number: 'number',
};
exports.OPEN_SOURCE_COMMENT_REQUEST_ISSUE_REVIEW = ":rocket: Heads up @{reviewing_committee_team}, this open source issue is ready for review";
exports.OPEN_SOURCE_COMMENT_REQUEST_PR_REVIEW = ":rocket: Heads up @{reviewing_committee_team}, this PR is ready for final review";
exports.OPEN_SOURCE_COMMENT_ISSUE_DISCONTINUED = ':disappointed: This issue is discontinued';
exports.OPEN_SOURCE_COMMENT_PR_DISCONTINUED = ':disappointed: This PR is discontinued';
exports.OPEN_SOURCE_COMMENT_PR_MERGED = ':tada: This PR is merged by client';
exports.OPEN_SOURCE_COMMENT_ISSUE_APPROVED = ":rocket: Heads up @{issueAddedBy}, @{reviewer} approved this issue.\n- [ ] Don't forget to set credits estimate by using `/open-source estimate <credits>` command.";
exports.OPEN_SOURCE_COMMENT_ISSUE_REJECTED = ":disappointed: Sorry @{issueAddedBy}, @{reviewer} rejected this issue.";
exports.OPEN_SOURCE_COMMENT_PR_APPROVED = ":tada: @{reviewer} approved this PR. Let's push this PR upstream";
exports.OPEN_SOURCE_COMMENT_PR_REQUESTED_CHANGES = ":rocket: Heads up devs, @{reviewer} requested changes in this PR.";
//# sourceMappingURL=constants.js.map