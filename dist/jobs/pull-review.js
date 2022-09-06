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
exports.pullReview = void 0;
var git_url_parse_1 = __importDefault(require("git-url-parse"));
var octokit_1 = require("octokit");
var common_1 = require("../common");
var pullReview = function (actionInputs, slicePrNumber, upstreamPrReviewLink) { return __awaiter(void 0, void 0, void 0, function () {
    var sliceRepo, upstreamRepo, isOpenSourceFlow, openSourceUrl, upstreamGitUrlObject, sliceGitUrlObject, openSourceGitUrlObject, upstreamOctokit, sliceOctokit, prReivewLinkRegResult, targetPrNumber, targetPrReviewNumber, targetGitUrlOwner, targetGitUrlRepo, targetLogScope, upstreamReview, targetReviewComments, detailedPullReviewComments, _i, targetReviewComments_1, comment, targetReviewComment, path, body, user, sliceReview;
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                common_1.logger.logInputs('pull-review', { slicePrNumber: slicePrNumber, upstreamPrReviewLink: upstreamPrReviewLink });
                sliceRepo = actionInputs.sliceRepo, upstreamRepo = actionInputs.upstreamRepo, isOpenSourceFlow = actionInputs.isOpenSourceFlow, openSourceUrl = actionInputs.openSourceUrl;
                upstreamGitUrlObject = (0, git_url_parse_1.default)(upstreamRepo.gitHttpUri);
                sliceGitUrlObject = (0, git_url_parse_1.default)(sliceRepo.gitHttpUri);
                openSourceGitUrlObject = isOpenSourceFlow ? (0, git_url_parse_1.default)(openSourceUrl) : null;
                upstreamOctokit = new octokit_1.Octokit({
                    auth: upstreamRepo.userToken,
                });
                sliceOctokit = new octokit_1.Octokit({
                    auth: actionInputs.sliceRepo.userToken,
                });
                if (upstreamGitUrlObject.source !== 'github.com') {
                    throw new Error("Unsuported codehost '" + upstreamGitUrlObject.source + "'");
                }
                prReivewLinkRegResult = /\/pull\/(\d+)#pullrequestreview-(\d+)$/i.exec(upstreamPrReviewLink);
                if (!prReivewLinkRegResult || !prReivewLinkRegResult[1] || !prReivewLinkRegResult[2]) {
                    throw new Error("Invalid pr-preview-link '" + upstreamPrReviewLink + "'");
                }
                targetPrNumber = Number(prReivewLinkRegResult[1]);
                targetPrReviewNumber = Number(prReivewLinkRegResult[2]);
                targetGitUrlOwner = upstreamGitUrlObject.owner;
                targetGitUrlRepo = upstreamGitUrlObject.name;
                targetLogScope = 'Upstream';
                if (isOpenSourceFlow) {
                    targetGitUrlOwner = openSourceGitUrlObject.owner;
                    targetGitUrlRepo = openSourceGitUrlObject.name;
                    targetLogScope = 'OpenSource';
                }
                common_1.logger.logWriteLine(targetLogScope, "Getting PR review...");
                return [4 /*yield*/, upstreamOctokit.rest.pulls.getReview({
                        owner: targetGitUrlOwner,
                        repo: targetGitUrlRepo,
                        pull_number: targetPrNumber,
                        review_id: targetPrReviewNumber,
                    })];
            case 1:
                upstreamReview = (_j.sent()).data;
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine(targetLogScope, "Getting PR review comments...");
                return [4 /*yield*/, upstreamOctokit.rest.pulls.listCommentsForReview({
                        owner: targetGitUrlOwner,
                        repo: targetGitUrlRepo,
                        pull_number: targetPrNumber,
                        review_id: targetPrReviewNumber,
                        // Assume that 100 comments per review is good limit
                        per_page: 100,
                        page: 1,
                    })];
            case 2:
                targetReviewComments = (_j.sent()).data;
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine(targetLogScope, "Getting PR review comments details...");
                detailedPullReviewComments = [];
                _i = 0, targetReviewComments_1 = targetReviewComments;
                _j.label = 3;
            case 3:
                if (!(_i < targetReviewComments_1.length)) return [3 /*break*/, 7];
                comment = targetReviewComments_1[_i];
                return [4 /*yield*/, upstreamOctokit.rest.pulls.getReviewComment({
                        owner: targetGitUrlOwner,
                        repo: targetGitUrlRepo,
                        pull_number: targetPrNumber,
                        review_id: targetPrReviewNumber,
                        comment_id: comment.id,
                    })];
            case 4:
                targetReviewComment = (_j.sent()).data;
                path = comment.path, body = comment.body, user = comment.user;
                detailedPullReviewComments.push({
                    path: path,
                    body: "From **_" + (user === null || user === void 0 ? void 0 : user.login) + "_**:\n" + body,
                    side: (_a = targetReviewComment.side) !== null && _a !== void 0 ? _a : undefined,
                    start_side: (_b = targetReviewComment.start_side) !== null && _b !== void 0 ? _b : undefined,
                    line: (_d = (_c = targetReviewComment.original_line) !== null && _c !== void 0 ? _c : targetReviewComment.line) !== null && _d !== void 0 ? _d : undefined,
                    start_line: (_f = (_e = targetReviewComment.original_start_line) !== null && _e !== void 0 ? _e : targetReviewComment.start_line) !== null && _f !== void 0 ? _f : undefined,
                });
                // Just to make sure we don't reach github api limit
                return [4 /*yield*/, (0, common_1.delay)(500)];
            case 5:
                // Just to make sure we don't reach github api limit
                _j.sent();
                _j.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 3];
            case 7:
                common_1.logger.logExtendLastLine("Done!");
                common_1.logger.logWriteLine('Slice', "Creating PR review...");
                return [4 /*yield*/, sliceOctokit.rest.pulls.createReview({
                        owner: sliceGitUrlObject.owner,
                        repo: sliceGitUrlObject.name,
                        pull_number: slicePrNumber,
                        event: 'COMMENT',
                        body: "Pull request review is synched from " + upstreamPrReviewLink + " by git-slice-tools:\nFrom **_" + ((_g = upstreamReview.user) === null || _g === void 0 ? void 0 : _g.login) + "_**:\n" + ((_h = upstreamReview.body) !== null && _h !== void 0 ? _h : ''),
                        comments: detailedPullReviewComments,
                    })];
            case 8:
                sliceReview = (_j.sent()).data;
                common_1.logger.logExtendLastLine("Done! -> " + sliceReview.html_url);
                return [2 /*return*/];
        }
    });
}); };
exports.pullReview = pullReview;
//# sourceMappingURL=pull-review.js.map