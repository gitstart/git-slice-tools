"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPEN_SOURCE_PROJECT_FIELD_TYPES = exports.OPEN_SOURCE_STATUS_OPTIONS = exports.OPEN_SOURCE_FIELDS = exports.OPEN_SOURCE_REMOTE = void 0;
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
//# sourceMappingURL=constants.js.map