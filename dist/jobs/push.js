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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.push = void 0;
var simple_git_1 = require("simple-git");
var common_1 = require("../common");
/**
 *
 * @param sliceGit
 * @param upstreamGit
 * @param actionInputs
 * @param sliceBranch
 * @param commitMsg
 * @param forcePush
 * @param coAuthors array of pairs of "<username>;<email>" of each authors
 * @returns
 */
var push = function (sliceGit, upstreamGit, actionInputs, sliceBranch, commitMsg, forcePush, coAuthors) {
    if (coAuthors === void 0) { coAuthors = []; }
    return __awaiter(void 0, void 0, void 0, function () {
        var upstreamGitSliceIgnore, resolvedGitSliceIgnoreFiles, upstreamBranch, logs, lastGitSlicePullLog, currentSyncUpstreamCommitId, error_1, coAuthorsDetails, _a, upstreamBranchExists, error_2, diffFiles_1, diffFiles;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    common_1.logger.logInputs('push', { sliceBranch: sliceBranch, commitMsg: commitMsg, forcePush: forcePush, coAuthors: coAuthors });
                    if (!actionInputs.pushCommitMsgRegex.test(commitMsg)) {
                        throw new Error('Commit message failed PUSH_COMMIT_MSG_REGEX');
                    }
                    // we need to checkout the upstream main branch to get the last '.gitsliceignore'
                    return [4 /*yield*/, upstreamGit.reset(simple_git_1.ResetMode.HARD)];
                case 1:
                    // we need to checkout the upstream main branch to get the last '.gitsliceignore'
                    _b.sent();
                    return [4 /*yield*/, upstreamGit.checkout(actionInputs.upstreamRepo.defaultBranch)];
                case 2:
                    _b.sent();
                    upstreamGitSliceIgnore = (0, common_1.getGitSliceIgoreConfig)(actionInputs.upstreamRepo.dir);
                    resolvedGitSliceIgnoreFiles = __spreadArray(__spreadArray(__spreadArray([], upstreamGitSliceIgnore, true), actionInputs.sliceIgnores, true), ['.gitsliceignore'], false);
                    upstreamBranch = actionInputs.pushBranchNameTemplate.replace('<branch_name>', sliceBranch);
                    return [4 /*yield*/, (0, common_1.cleanAndDeleteLocalBranch)(sliceGit, 'Slice', actionInputs.sliceRepo.defaultBranch, sliceBranch)
                        // Find the oid from last gitslice:*** commit
                    ];
                case 3:
                    _b.sent();
                    // Find the oid from last gitslice:*** commit
                    common_1.logger.logWriteLine('Slice', "Finding the last git-slice:*** commit...");
                    return [4 /*yield*/, sliceGit.log({ maxCount: 20 })];
                case 4:
                    logs = _b.sent();
                    lastGitSlicePullLog = logs.all.find(function (x) { return /^git-slice:.*$/.test(x.message.trim()); });
                    if (!lastGitSlicePullLog) {
                        common_1.logger.logExtendLastLine('Not found!');
                        throw new Error('Not found git-slice:*** commit in last 20 commits');
                    }
                    currentSyncUpstreamCommitId = lastGitSlicePullLog.message.trim().split(':')[1];
                    common_1.logger.logExtendLastLine(currentSyncUpstreamCommitId + "\n");
                    common_1.logger.logWriteLine('Slice', "Checkout branch '" + sliceBranch + "'...");
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 8, , 9]);
                    return [4 /*yield*/, sliceGit.checkout(sliceBranch)];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, sliceGit.pull('origin', sliceBranch)];
                case 7:
                    _b.sent();
                    common_1.logger.logExtendLastLine('Done!');
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _b.sent();
                    // noop
                    common_1.logger.logExtendLastLine('Not found!');
                    throw error_1;
                case 9: return [4 /*yield*/, (0, common_1.pullRemoteBranchIntoCurrentBranch)('Slice', sliceGit, actionInputs.sliceRepo.defaultBranch, sliceBranch)];
                case 10:
                    _b.sent();
                    return [4 /*yield*/, (0, common_1.cleanAndDeleteLocalBranch)(upstreamGit, 'Upstream', actionInputs.upstreamRepo.defaultBranch, upstreamBranch)];
                case 11:
                    _b.sent();
                    coAuthorsDetails = common_1.coAuthorHelpers.getCoAuthorsFromCliArgs(coAuthors);
                    if (!(coAuthorsDetails.length === 0 &&
                        actionInputs.isOpenSourceFlow &&
                        // checking `autoCoAuthorsCommits` configuration
                        actionInputs.autoCoAuthorsCommits !== common_1.AUTO_CO_AUTHORS_COMMITS_OPTIONS.None)) return [3 /*break*/, 16];
                    if (!(actionInputs.autoCoAuthorsCommits === common_1.AUTO_CO_AUTHORS_COMMITS_OPTIONS.GitLogs)) return [3 /*break*/, 13];
                    return [4 /*yield*/, common_1.coAuthorHelpers.getCoAuthorsFromGitLogs(sliceGit, actionInputs.sliceRepo, sliceBranch)];
                case 12:
                    _a = _b.sent();
                    return [3 /*break*/, 15];
                case 13: return [4 /*yield*/, common_1.coAuthorHelpers.getCoAuthorsFromPR(actionInputs.sliceRepo, sliceBranch)];
                case 14:
                    _a = _b.sent();
                    _b.label = 15;
                case 15:
                    coAuthorsDetails = _a;
                    _b.label = 16;
                case 16:
                    if (coAuthorsDetails.length !== 0) {
                        common_1.logger.logWriteLine('Upstream', "Commit would include co-authors '" + coAuthorsDetails
                            .map(function (x) { return x.authorUserName + "," + x.authorEmail; })
                            .join(';') + "'");
                    }
                    upstreamBranchExists = false;
                    _b.label = 17;
                case 17:
                    _b.trys.push([17, 19, , 20]);
                    common_1.logger.logWriteLine('Upstream', "Check remote branch '" + upstreamBranch + "'...");
                    return [4 /*yield*/, upstreamGit.show("remotes/origin/" + upstreamBranch)];
                case 18:
                    _b.sent();
                    upstreamBranchExists = true;
                    common_1.logger.logExtendLastLine('Existed!\n');
                    return [3 /*break*/, 20];
                case 19:
                    error_2 = _b.sent();
                    common_1.logger.logExtendLastLine('Not found!\n');
                    return [3 /*break*/, 20];
                case 20:
                    if (!(!upstreamBranchExists || forcePush)) return [3 /*break*/, 24];
                    common_1.logger.logWriteLine('Upstream', "Checkout new branch '" + upstreamBranch + "'...");
                    return [4 /*yield*/, upstreamGit.checkoutLocalBranch(upstreamBranch)];
                case 21:
                    _b.sent();
                    common_1.logger.logExtendLastLine('Done!\n');
                    return [4 /*yield*/, (0, common_1.copyFiles)(upstreamGit, actionInputs.sliceRepo.dir, actionInputs.upstreamRepo.dir, resolvedGitSliceIgnoreFiles, 'Upstream')];
                case 22:
                    diffFiles_1 = _b.sent();
                    if (!diffFiles_1.length) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, common_1.createCommitAndPushCurrentChanges)(upstreamGit, commitMsg, upstreamBranch, 'Upstream', upstreamBranchExists && forcePush, coAuthorsDetails)];
                case 23:
                    _b.sent();
                    return [2 /*return*/];
                case 24:
                    common_1.logger.logWriteLine('Upstream', "Checkout branch '" + upstreamBranch + "'...");
                    return [4 /*yield*/, upstreamGit.checkout(upstreamBranch)];
                case 25:
                    _b.sent();
                    return [4 /*yield*/, upstreamGit.pull('origin', upstreamBranch)];
                case 26:
                    _b.sent();
                    return [4 /*yield*/, (0, common_1.pullRemoteBranchIntoCurrentBranch)('Upstream', upstreamGit, 
                        // we merge the revision which current slice's default branch is synced at
                        // instead of upstream's default branch which can be missed matching while running in parallel
                        currentSyncUpstreamCommitId, upstreamBranch, 
                        // We ignore merging error on upstream to allow pushing updates when there are conflicts on upstream repo.
                        // In this case, commit below will contain both updates + merge base commit
                        true)];
                case 27:
                    _b.sent();
                    common_1.logger.logExtendLastLine('Done!\n');
                    return [4 /*yield*/, (0, common_1.copyFiles)(upstreamGit, actionInputs.sliceRepo.dir, actionInputs.upstreamRepo.dir, resolvedGitSliceIgnoreFiles, 'Upstream')];
                case 28:
                    diffFiles = _b.sent();
                    if (!diffFiles.length) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, common_1.createCommitAndPushCurrentChanges)(upstreamGit, commitMsg, upstreamBranch, 'Upstream', false, coAuthorsDetails)];
                case 29:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
};
exports.push = push;
//# sourceMappingURL=push.js.map