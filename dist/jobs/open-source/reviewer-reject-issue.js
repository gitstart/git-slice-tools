"use strict";
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
exports.reviewerRejectIssue = void 0;
var octokit_1 = require("octokit");
var common_1 = require("../../common");
var reviewerRejectIssue = function (actionInputs, reviewer, repoName, issueNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var sliceOctokit, projectManangerView, hasRightPermission, projectId, _a, issueId, issueAddedBy, issueOSSData, itemId, projectAllFields, currentStatus, statusField, issueReviewerField, statusIssueRejectedOption, relatedPRs, _i, relatedPRs_1, relatedPR;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                common_1.logger.logInputs('open-source reviewer-reject-issue', { reviewer: reviewer, repoName: repoName, issueNumber: issueNumber });
                sliceOctokit = new octokit_1.Octokit({
                    auth: actionInputs.sliceRepo.userToken,
                });
                projectManangerView = (0, common_1.getProjectManagerViewInfo)(actionInputs.openSourceManagerProjectView);
                repoName = repoName.replace(new RegExp("^" + projectManangerView.org + "/", 'i'), '');
                return [4 /*yield*/, (0, common_1.isMemberOfTeam)(sliceOctokit, projectManangerView.org, actionInputs.openSourceTeamReviewingCommittee, reviewer)];
            case 1:
                hasRightPermission = _c.sent();
                return [4 /*yield*/, (0, common_1.getProjectV2)(sliceOctokit, projectManangerView.org, projectManangerView.projectNumber)];
            case 2:
                projectId = (_c.sent()).projectId;
                return [4 /*yield*/, (0, common_1.getIssue)(sliceOctokit, projectManangerView.org, repoName, issueNumber)];
            case 3:
                _a = _c.sent(), issueId = _a.issueId, issueAddedBy = _a.issueAddedBy;
                return [4 /*yield*/, (0, common_1.getIssueOSSData)(sliceOctokit, issueId)];
            case 4:
                issueOSSData = _c.sent();
                if (!!hasRightPermission) return [3 /*break*/, 6];
                return [4 /*yield*/, common_1.error.throwWithGithubComment(sliceOctokit, issueId, "@" + reviewer + " has to be a member of team @" + projectManangerView.org + "/" + actionInputs.openSourceTeamReviewingCommittee)];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6:
                if (!!issueOSSData) return [3 /*break*/, 8];
                return [4 /*yield*/, common_1.error.throwWithGithubComment(sliceOctokit, issueId, "Couldn't find OSS data comment of this issue")];
            case 7:
                _c.sent();
                _c.label = 8;
            case 8:
                itemId = issueOSSData.itemId;
                return [4 /*yield*/, (0, common_1.getProjectFields)(sliceOctokit, projectId)];
            case 9:
                projectAllFields = _c.sent();
                return [4 /*yield*/, (0, common_1.getCurrentIssueStatusOfProjectItem)(sliceOctokit, itemId)];
            case 10:
                currentStatus = _c.sent();
                statusField = projectAllFields.find(function (x) { return x.name === common_1.OPEN_SOURCE_FIELDS.Status; });
                issueReviewerField = projectAllFields.find(function (x) { return x.name === common_1.OPEN_SOURCE_FIELDS.IssueReviewer; });
                statusIssueRejectedOption = (_b = statusField.options) === null || _b === void 0 ? void 0 : _b.find(function (x) { return x.name === common_1.OPEN_SOURCE_STATUS_OPTIONS.IssueRejected; });
                if (!(currentStatus !== common_1.OPEN_SOURCE_STATUS_OPTIONS.PendingIssue)) return [3 /*break*/, 12];
                return [4 /*yield*/, common_1.error.throwWithGithubComment(sliceOctokit, issueId, "Issue status has to be `" + common_1.OPEN_SOURCE_STATUS_OPTIONS.PendingIssue + "` to execute this job")];
            case 11:
                _c.sent();
                _c.label = 12;
            case 12:
                common_1.logger.logWriteLine('OpenSource', "Updating 'Status=<Issue rejected>'...");
                return [4 /*yield*/, (0, common_1.updateIssueFieldValue)(sliceOctokit, projectId, itemId, statusField.id, 'SingleSelect', statusIssueRejectedOption === null || statusIssueRejectedOption === void 0 ? void 0 : statusIssueRejectedOption.id)];
            case 13:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine('OpenSource', "Updating 'Issue reviewer=<reviewer>'...");
                return [4 /*yield*/, (0, common_1.updateIssueFieldValue)(sliceOctokit, projectId, itemId, issueReviewerField.id, 'Text', reviewer)];
            case 14:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine('OpenSource', "Leaving comment to infom devs...");
                return [4 /*yield*/, (0, common_1.addComment)(sliceOctokit, issueId, common_1.OPEN_SOURCE_COMMENT_ISSUE_REJECTED.replace('{issueAddedBy}', issueAddedBy).replace('{reviewer}', reviewer))];
            case 15:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                return [4 /*yield*/, (0, common_1.closeIssue)(sliceOctokit, issueId)];
            case 16:
                _c.sent();
                common_1.logger.logWriteLine('OpenSource', "Finding related PRs...");
                return [4 /*yield*/, (0, common_1.getIssueRelatedPRs)(sliceOctokit, issueId)];
            case 17:
                relatedPRs = _c.sent();
                common_1.logger.logExtendLastLine("Found " + relatedPRs.length + " PRs: " + relatedPRs.map(function (x) { return "#" + x.prNumber; }).join(', '));
                _i = 0, relatedPRs_1 = relatedPRs;
                _c.label = 18;
            case 18:
                if (!(_i < relatedPRs_1.length)) return [3 /*break*/, 21];
                relatedPR = relatedPRs_1[_i];
                return [4 /*yield*/, (0, common_1.closePR)(sliceOctokit, relatedPR.prId, relatedPR.prNumber)];
            case 19:
                _c.sent();
                _c.label = 20;
            case 20:
                _i++;
                return [3 /*break*/, 18];
            case 21: return [2 /*return*/];
        }
    });
}); };
exports.reviewerRejectIssue = reviewerRejectIssue;
//# sourceMappingURL=reviewer-reject-issue.js.map