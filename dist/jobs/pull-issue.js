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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullIssue = void 0;
var git_url_parse_1 = __importDefault(require("git-url-parse"));
var octokit_1 = require("octokit");
var common_1 = require("../common");
var pullIssue = function (actionInputs, fromIssue, toIssueNumber, actor) { return __awaiter(void 0, void 0, void 0, function () {
    var sliceRepo, upstreamRepo, sliceGitUrlObject, upstreamOctokit, sliceOctokit, upstreamLogScope, upstreamGitUrlObject, fromIssueNumber, isUpstreamIssueNumber, regexResult, upstreamIssue, title, body, html_url, pulledIssueBody, sliceIssue;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                common_1.logger.logInputs('pull-issue', { fromIssue: fromIssue, toIssueNumber: toIssueNumber });
                sliceRepo = actionInputs.sliceRepo, upstreamRepo = actionInputs.upstreamRepo;
                sliceGitUrlObject = (0, git_url_parse_1.default)(sliceRepo.gitHttpUri);
                upstreamOctokit = new octokit_1.Octokit({
                    auth: upstreamRepo.userToken,
                });
                sliceOctokit = new octokit_1.Octokit({
                    auth: actionInputs.sliceRepo.userToken,
                });
                upstreamLogScope = 'Other';
                fromIssueNumber = parseInt(fromIssue, 10);
                isUpstreamIssueNumber = !isNaN(fromIssueNumber);
                if (isUpstreamIssueNumber) {
                    // fromIssue is an issue number from upstream
                    upstreamLogScope = actionInputs.isOpenSourceFlow ? 'OpenSource' : 'Upstream';
                    upstreamGitUrlObject = actionInputs.isOpenSourceFlow
                        ? (0, git_url_parse_1.default)(actionInputs.openSourceUrl)
                        : (0, git_url_parse_1.default)(upstreamRepo.gitHttpUri);
                }
                else {
                    // fromIssue is an issue link
                    upstreamLogScope = 'Other';
                    regexResult = /(https:\/\/github\.com\/)?([^/]+\/[^/]+)\/issues\/(\d+)/gi.exec(fromIssue);
                    if (!regexResult || !regexResult[2] || isNaN(parseInt(regexResult[3], 10))) {
                        throw new Error("Unsuported fromIssue arg '" + fromIssue + "'");
                    }
                    fromIssueNumber = parseInt(regexResult[3], 10);
                    upstreamGitUrlObject = (0, git_url_parse_1.default)("" + ((_a = regexResult[1]) !== null && _a !== void 0 ? _a : 'https://github.com/') + regexResult[2] + ".git");
                }
                if (upstreamGitUrlObject.source !== 'github.com') {
                    throw new Error("Unsuported codehost '" + upstreamGitUrlObject.source + "'");
                }
                common_1.logger.logWriteLine(upstreamLogScope, "Getting issue...");
                return [4 /*yield*/, upstreamOctokit.rest.issues.get({
                        owner: upstreamGitUrlObject.owner,
                        repo: upstreamGitUrlObject.name,
                        issue_number: fromIssueNumber,
                    })];
            case 1:
                upstreamIssue = (_b.sent()).data;
                common_1.logger.logExtendLastLine("Done!");
                title = upstreamIssue.title, body = upstreamIssue.body, html_url = upstreamIssue.html_url;
                pulledIssueBody = "<!-- @" + (actor || actionInputs.sliceRepo.username) + " -->\nPulled from " + html_url + " by git-slice-tools:\n" + body;
                if (!(toIssueNumber > 0)) return [3 /*break*/, 3];
                common_1.logger.logWriteLine('Slice', "Updating issue #" + toIssueNumber + "...");
                return [4 /*yield*/, sliceOctokit.rest.issues.update({
                        owner: sliceGitUrlObject.owner,
                        repo: sliceGitUrlObject.name,
                        issue_number: toIssueNumber,
                        title: title,
                        body: pulledIssueBody,
                    })];
            case 2:
                _b.sent();
                common_1.logger.logExtendLastLine("Done!");
                return [2 /*return*/];
            case 3:
                common_1.logger.logWriteLine('Slice', "Creating new issue...");
                return [4 /*yield*/, sliceOctokit.rest.issues.create({
                        owner: sliceGitUrlObject.owner,
                        repo: sliceGitUrlObject.name,
                        title: title,
                        body: pulledIssueBody,
                    })];
            case 4:
                sliceIssue = (_b.sent()).data;
                common_1.logger.logExtendLastLine("Done! -> " + sliceIssue.html_url);
                return [2 /*return*/];
        }
    });
}); };
exports.pullIssue = pullIssue;
//# sourceMappingURL=pull-issue.js.map