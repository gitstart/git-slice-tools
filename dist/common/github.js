"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.closeIssue = exports.closePR = exports.getCurrentIssueStatusOfProjectItem = exports.isMemberOfTeam = exports.isMaintainerOfRepo = exports.updateIssueFieldValue = exports.getProjectFields = exports.getIssueOSSData = exports.getIssueRelatedPRs = exports.getIssue = exports.getPullRequest = exports.getProjectV2 = exports.getProjectManagerViewInfo = void 0;
var constants_1 = require("./constants");
var logger_1 = require("./logger");
var getProjectManagerViewInfo = function (link) {
    var regexResult = /https:\/\/github\.com\/orgs\/([^/.*]+)\/projects\/(\d+)\/views\/(\d+)/gi.exec(link);
    if (regexResult == null) {
        throw new Error("Invalid project view link: " + link);
    }
    var owner = regexResult[1], projectId = regexResult[2], viewId = regexResult[3];
    return {
        org: owner,
        projectNumber: +projectId,
        viewNumber: +viewId,
    };
};
exports.getProjectManagerViewInfo = getProjectManagerViewInfo;
var getProjectV2 = function (octokit, organization, projectNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var projectId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Getting project...");
                return [4 /*yield*/, octokit.graphql("\n        query($organization: String!, $projectNumber: Int!) {\n          organization(login: $organization) {\n            projectV2(number: $projectNumber) {\n              id\n            }\n          }\n        }\n        ", {
                        organization: organization,
                        projectNumber: projectNumber,
                    })];
            case 1:
                projectId = (_a.sent()).organization.projectV2.id;
                (0, logger_1.logExtendLastLine)("Project Id: " + projectId);
                return [2 /*return*/, { projectId: projectId }];
        }
    });
}); };
exports.getProjectV2 = getProjectV2;
var getPullRequest = function (octokit, organization, repoName, prNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, prId, linkedIssues;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Getting pull request...");
                return [4 /*yield*/, octokit.graphql("\n        query($repoName: String!, $organization: String!, $prNumber: Int!) {\n          repository(name: $repoName, owner: $organization) {\n            pullRequest(number: $prNumber) {\n              prId: id\n              closingIssuesReferences(first: 20) {\n                nodes {\n                  issueId: id\n                  issueNumber: number\n                }\n              }\n            }\n          }\n        }\n        ", {
                        organization: organization,
                        repoName: repoName,
                        prNumber: prNumber,
                    })];
            case 1:
                _a = (_b.sent()).repository.pullRequest, prId = _a.prId, linkedIssues = _a.closingIssuesReferences.nodes;
                (0, logger_1.logExtendLastLine)("PR Id: " + prId);
                return [2 /*return*/, { prId: prId, linkedIssues: linkedIssues }];
        }
    });
}); };
exports.getPullRequest = getPullRequest;
var getIssue = function (octokit, organization, repoName, issueNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var issueAddedBy, _a, issueId, issueBody, issueCreator, creatorExecResult;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Getting issue...");
                issueAddedBy = '';
                return [4 /*yield*/, octokit.graphql("\n        query($repoName: String!, $organization: String!, $issueNumber: Int!) {\n          repository(name: $repoName, owner: $organization) {\n            issue(number: $issueNumber) {\n              id\n              body\n              author {\n                login\n              }\n            }\n          }\n        }\n        ", {
                        organization: organization,
                        repoName: repoName,
                        issueNumber: issueNumber,
                    })];
            case 1:
                _a = (_b.sent()).repository.issue, issueId = _a.id, issueBody = _a.body, issueCreator = _a.author.login;
                creatorExecResult = /^<!-- @(.*) -->/g.exec(issueBody);
                if (creatorExecResult && creatorExecResult[1]) {
                    issueAddedBy = creatorExecResult[1];
                }
                else {
                    issueAddedBy = issueCreator;
                }
                (0, logger_1.logExtendLastLine)("Issue Id: " + issueId);
                return [2 /*return*/, { issueId: issueId, issueAddedBy: issueAddedBy }];
        }
    });
}); };
exports.getIssue = getIssue;
var getIssueRelatedPRs = function (octokit, issueId) { return __awaiter(void 0, void 0, void 0, function () {
    var issueReferencedSubjectFragment, issueEventFragment, issueTimelineEvents, connectedPRs, _i, issueTimelineEvents_1, issueTimelineEvent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                issueReferencedSubjectFragment = "\n      __typename\n      ... on Issue {\n        title\n        id\n        itemNumber: number\n      }\n      ... on PullRequest {\n        title\n        id\n        itemNumber: number\n      }\n    ";
                issueEventFragment = "\n      source {\n        " + issueReferencedSubjectFragment + "\n      }\n      subject {\n        " + issueReferencedSubjectFragment + "\n      }\n    ";
                return [4 /*yield*/, octokit.graphql("\n        query($issueId: ID!, $timelineItemTypes: [IssueTimelineItemsItemType!]!) {\n          node(id: $issueId) {\n            ... on Issue {\n              timelineItems(first: 20, itemTypes: $timelineItemTypes) {\n                nodes {\n                  __typename\n                  ... on ConnectedEvent {\n                    " + issueEventFragment + "\n                  }\n                  ... on DisconnectedEvent {\n                    " + issueEventFragment + "\n                  }\n                }\n              }\n            }\n          }\n        }\n        ", {
                        issueId: issueId,
                        timelineItemTypes: ['CONNECTED_EVENT', 'DISCONNECTED_EVENT'],
                    })];
            case 1:
                issueTimelineEvents = (_a.sent()).node.timelineItems.nodes;
                connectedPRs = {};
                for (_i = 0, issueTimelineEvents_1 = issueTimelineEvents; _i < issueTimelineEvents_1.length; _i++) {
                    issueTimelineEvent = issueTimelineEvents_1[_i];
                    if (issueTimelineEvent.__typename === 'ConnectedEvent' &&
                        issueTimelineEvent.subject.__typename === 'PullRequest') {
                        connectedPRs[issueTimelineEvent.subject.id] = {
                            prId: issueTimelineEvent.subject.id,
                            prNumber: issueTimelineEvent.subject.itemNumber,
                        };
                        continue;
                    }
                    if (issueTimelineEvent.__typename === 'DisconnectedEvent' &&
                        issueTimelineEvent.subject.__typename === 'PullRequest') {
                        delete connectedPRs[issueTimelineEvent.subject.id];
                        continue;
                    }
                }
                return [2 /*return*/, Object.values(connectedPRs)];
        }
    });
}); };
exports.getIssueRelatedPRs = getIssueRelatedPRs;
var getIssueOSSData = function (octokit, issueId) { return __awaiter(void 0, void 0, void 0, function () {
    var issueComments, ossDataComment, fields_1, lines, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Checking for OSS data comment...");
                return [4 /*yield*/, octokit.graphql("\n        query($issueId: ID!) {\n          node(id: $issueId) {\n            ... on Issue {\n              comments(first: 10) {\n                nodes {\n                  ... on IssueComment {\n                    body\n                  }\n                }\n              }\n            }\n          }\n        }\n        ", {
                        issueId: issueId,
                    })];
            case 1:
                issueComments = (_a.sent()).node.comments.nodes;
                ossDataComment = issueComments.find(function (x) { return x.body.startsWith('OSS data:'); });
                if (ossDataComment) {
                    (0, logger_1.logExtendLastLine)("Found OSS data comment. ");
                    (0, logger_1.logWriteLine)('OpenSource', "Issue has already existed in OSS table");
                    fields_1 = ['itemId', 'issueId'];
                    lines = ossDataComment.body.split(/\r?\n/g);
                    data = lines
                        .map(function (line) { return new RegExp("- (" + fields_1.join('|') + "): (.*)$", 'g').exec(line.trim()); })
                        .filter(Boolean)
                        .map(function (x) { return ({ key: x[1], value: x[2] }); })
                        .reduce(function (prev, current) {
                        var _a;
                        return __assign(__assign({}, prev), (_a = {}, _a[current.key] = current.value, _a));
                    }, {});
                    return [2 /*return*/, data];
                }
                else {
                    (0, logger_1.logExtendLastLine)("OSS data comment not found");
                }
                return [2 /*return*/, null];
        }
    });
}); };
exports.getIssueOSSData = getIssueOSSData;
var getProjectFields = function (octokit, projectId) { return __awaiter(void 0, void 0, void 0, function () {
    var projectAllFields;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Loading all project fields...");
                return [4 /*yield*/, octokit.graphql("\n        query($projectId: ID!) {\n          node(id: $projectId) {\n            ... on ProjectV2 {\n              fields(first: 20) {\n                nodes {\n                  ... on ProjectV2Field {\n                    id\n                    name\n                  }\n                  ... on ProjectV2SingleSelectField {\n                    id\n                    name\n                    options {\n                      id\n                      name\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n        ", {
                        projectId: projectId,
                    })];
            case 1:
                projectAllFields = (_a.sent()).node.fields.nodes;
                (0, logger_1.logExtendLastLine)("Done!");
                return [2 /*return*/, projectAllFields];
        }
    });
}); };
exports.getProjectFields = getProjectFields;
var updateIssueFieldValue = function (octokit, projectId, itemId, fieldId, type, value) { return __awaiter(void 0, void 0, void 0, function () {
    var fieldValue, inputValueProp, fieldValueTypeAnnotation;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fieldValue = type === 'Number' ? +value : value;
                inputValueProp = constants_1.OPEN_SOURCE_PROJECT_FIELD_TYPES[type];
                fieldValueTypeAnnotation = type === 'Number' ? 'Float!' : 'String!';
                return [4 /*yield*/, octokit.graphql("\n        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $fieldValue: " + fieldValueTypeAnnotation + ") {\n          updateProjectV2ItemFieldValue(\n            input: {\n              projectId: $projectId,\n              itemId: $itemId,\n              fieldId: $fieldId,\n              value: { \n                " + inputValueProp + ": $fieldValue\n              }\n            }\n          ) {\n            projectV2Item {\n              id\n            }\n          }\n        }\n        ", {
                        projectId: projectId,
                        itemId: itemId,
                        fieldId: fieldId,
                        fieldValue: fieldValue,
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.updateIssueFieldValue = updateIssueFieldValue;
var isMaintainerOfRepo = function (octokit, organization, repoName, member) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, collabEdges, collabNodes, collabNodeIdx;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Checking maintainer...");
                return [4 /*yield*/, octokit.graphql("\n        query($repoName: String!, $owner: String!, $member: String!) {\n          repository(name: $repoName, owner: $owner) {\n            collaborators(first: 20, query: $member) {\n              edges {\n                permission\n              }\n              nodes {\n                id\n                login\n                name\n              }\n            }\n          }\n        }\n        ", {
                        owner: organization,
                        repoName: repoName,
                        member: member,
                    })];
            case 1:
                _a = (_c.sent()).repository.collaborators, collabEdges = _a.edges, collabNodes = _a.nodes;
                if (collabEdges.length === 0 || collabNodes.length === 0) {
                    (0, logger_1.logExtendLastLine)("'" + member + "' doesn't belong to '" + repoName + "' repository");
                    return [2 /*return*/, false];
                }
                collabNodeIdx = collabNodes.findIndex(function (x) { return x.login === member; });
                if (collabNodeIdx < 0 || !['ADMIN', 'MAINTAIN'].includes((_b = collabEdges[collabNodeIdx]) === null || _b === void 0 ? void 0 : _b.permission)) {
                    (0, logger_1.logExtendLastLine)("'" + member + "' isn't a maintainer of '" + repoName + "' repo");
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
        }
    });
}); };
exports.isMaintainerOfRepo = isMaintainerOfRepo;
var isMemberOfTeam = function (octokit, organization, team, member) { return __awaiter(void 0, void 0, void 0, function () {
    var response, isInMember;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Checking member in team...");
                return [4 /*yield*/, octokit.graphql("\n        query($organization: String!, $team: String!, $member: String!) {\n          organization(login: $organization) {\n            team(slug: $team) {\n              name\n              slug\n              members(first: 10, query: $member) {\n                nodes {\n                  id\n                  login\n                  name\n                }\n              }\n            }\n          }\n        }\n        ", {
                        organization: organization,
                        team: team,
                        member: member,
                    })];
            case 1:
                response = _c.sent();
                isInMember = Boolean((_b = (_a = response.organization.team) === null || _a === void 0 ? void 0 : _a.members.nodes) === null || _b === void 0 ? void 0 : _b.some(function (x) { return x.login === member; }));
                (0, logger_1.logExtendLastLine)(isInMember ? "In team" : "Not in team");
                return [2 /*return*/, isInMember];
        }
    });
}); };
exports.isMemberOfTeam = isMemberOfTeam;
var getCurrentIssueStatusOfProjectItem = function (octokit, itemId) { return __awaiter(void 0, void 0, void 0, function () {
    var currentStatus;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Checking current status of issue on OSS project table...");
                return [4 /*yield*/, octokit.graphql("\n        query($itemId: ID!, $fieldName: String!) {\n          node(id: $itemId) {\n            ... on ProjectV2Item {\n              fieldValueByName(name: $fieldName) {\n                ... on ProjectV2ItemFieldSingleSelectValue {\n                  name\n                }\n              }\n            }\n          }\n        }\n        ", {
                        itemId: itemId,
                        fieldName: constants_1.OPEN_SOURCE_FIELDS.Status,
                    })];
            case 1:
                currentStatus = (_a.sent()).node.fieldValueByName.name;
                (0, logger_1.logExtendLastLine)("Current status: " + currentStatus);
                return [2 /*return*/, currentStatus];
        }
    });
}); };
exports.getCurrentIssueStatusOfProjectItem = getCurrentIssueStatusOfProjectItem;
var closePR = function (octokit, pullRequestId, prNumber) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, logger_1.logWriteLine)('OpenSource', "Closing PR #" + prNumber + "...");
                return [4 /*yield*/, octokit.graphql("\n            mutation($pullRequestId: ID!) {\n              closePullRequest(\n                input: {\n                  pullRequestId: $pullRequestId\n                }\n              ) {\n                clientMutationId\n              }\n            }\n            ", {
                        pullRequestId: pullRequestId,
                    })];
            case 1:
                _a.sent();
                (0, logger_1.logExtendLastLine)("Done");
                return [2 /*return*/];
        }
    });
}); };
exports.closePR = closePR;
var closeIssue = function (octokit, issueId, completed) {
    if (completed === void 0) { completed = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, logger_1.logWriteLine)('OpenSource', "Closing issue...");
                    return [4 /*yield*/, octokit.graphql("\n        mutation($issueId: ID!, $stateReason: IssueClosedStateReason!) {\n          closeIssue(\n            input: {\n              issueId: $issueId,\n              stateReason: $stateReason\n            }\n          ) {\n            clientMutationId\n          }\n        }\n        ", {
                            issueId: issueId,
                            stateReason: completed ? 'COMPLETED' : 'NOT_PLANNED',
                        })];
                case 1:
                    _a.sent();
                    (0, logger_1.logExtendLastLine)("Done!");
                    return [2 /*return*/];
            }
        });
    });
};
exports.closeIssue = closeIssue;
var addComment = function (octokit, subjectId, body) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, octokit.graphql("\n        mutation($body: String!, $subjectId: ID!) {\n          addComment(\n            input: {\n              subjectId: $subjectId,\n              body: $body\n            }\n          ) {\n            clientMutationId\n          }\n        }\n        ", {
                    subjectId: subjectId,
                    body: body,
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.addComment = addComment;
//# sourceMappingURL=github.js.map