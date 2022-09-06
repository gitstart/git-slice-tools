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
exports.addIssue = void 0;
var octokit_1 = require("octokit");
var common_1 = require("../../common");
var addIssue = function (actionInputs, repoName, issueNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var sliceOctokit, projectManangerView, projectId, _a, issueId, issueAddedBy, issueOSSData, itemId, allFields, statusField, instanceNameField, addedByField, statusPendingOption;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                common_1.logger.logInputs('open-source add-issue', { repoName: repoName, issueNumber: issueNumber });
                sliceOctokit = new octokit_1.Octokit({
                    auth: actionInputs.sliceRepo.userToken,
                });
                projectManangerView = (0, common_1.getProjectManagerViewInfo)(actionInputs.openSourceManagerProjectView);
                repoName = repoName.replace(new RegExp("^" + projectManangerView.org + "/", 'i'), '');
                return [4 /*yield*/, (0, common_1.getProjectV2)(sliceOctokit, projectManangerView.org, projectManangerView.projectNumber)];
            case 1:
                projectId = (_c.sent()).projectId;
                return [4 /*yield*/, (0, common_1.getIssue)(sliceOctokit, projectManangerView.org, repoName, issueNumber)];
            case 2:
                _a = _c.sent(), issueId = _a.issueId, issueAddedBy = _a.issueAddedBy;
                return [4 /*yield*/, (0, common_1.getIssueOSSData)(sliceOctokit, issueId)];
            case 3:
                issueOSSData = _c.sent();
                if (issueOSSData) {
                    // Issue is already added into OSS project table
                    return [2 /*return*/];
                }
                common_1.logger.logWriteLine('OpenSource', "Adding issue into project...");
                return [4 /*yield*/, sliceOctokit.graphql("\n        mutation($projectId: ID!, $issueId: ID!) {\n          addProjectV2ItemById(input: {projectId: $projectId, contentId: $issueId}) {\n            item {\n              id\n            }\n          }\n        }\n        ", {
                        projectId: projectId,
                        issueId: issueId,
                    })];
            case 4:
                itemId = (_c.sent()).addProjectV2ItemById.item.id;
                common_1.logger.logExtendLastLine("Item id: " + itemId);
                return [4 /*yield*/, (0, common_1.getProjectFields)(sliceOctokit, projectId)];
            case 5:
                allFields = _c.sent();
                statusField = allFields.find(function (x) { return x.name === common_1.OPEN_SOURCE_FIELDS.Status; });
                instanceNameField = allFields.find(function (x) { return x.name === common_1.OPEN_SOURCE_FIELDS.InstanceName; });
                addedByField = allFields.find(function (x) { return x.name === common_1.OPEN_SOURCE_FIELDS.AddedBy; });
                statusPendingOption = (_b = statusField.options) === null || _b === void 0 ? void 0 : _b.find(function (x) { return x.name === common_1.OPEN_SOURCE_STATUS_OPTIONS.PendingIssue; });
                common_1.logger.logWriteLine('OpenSource', "Updating 'Status=\"Pending review\"'...");
                return [4 /*yield*/, (0, common_1.updateIssueFieldValue)(sliceOctokit, projectId, itemId, statusField.id, 'SingleSelect', statusPendingOption === null || statusPendingOption === void 0 ? void 0 : statusPendingOption.id)];
            case 6:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine('OpenSource', "Updating 'Instance name=<openSourceInstanceName config>'...");
                return [4 /*yield*/, (0, common_1.updateIssueFieldValue)(sliceOctokit, projectId, itemId, instanceNameField.id, 'Text', actionInputs.openSourceInstanceName)];
            case 7:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine('OpenSource', "Updating 'Added by=<issue creator>'...");
                return [4 /*yield*/, (0, common_1.updateIssueFieldValue)(sliceOctokit, projectId, itemId, addedByField.id, 'Text', issueAddedBy)];
            case 8:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine('OpenSource', "Saving oss project data comment...");
                return [4 /*yield*/, (0, common_1.addComment)(sliceOctokit, issueId, "OSS data:\n        - itemId: " + itemId + "\n        - issueId: " + issueId + "\n        \n\n_Do not edit or delete this comment_\n        ")];
            case 9:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine('OpenSource', "Tagging reviewing comittee...");
                return [4 /*yield*/, (0, common_1.addComment)(sliceOctokit, issueId, common_1.OPEN_SOURCE_COMMENT_REQUEST_ISSUE_REVIEW.replace('{reviewing_committee_team}', projectManangerView.org + "/" + actionInputs.openSourceTeamReviewingCommittee))];
            case 10:
                _c.sent();
                common_1.logger.logExtendLastLine("Done!");
                return [2 /*return*/];
        }
    });
}); };
exports.addIssue = addIssue;
//# sourceMappingURL=add-issue.js.map