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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoAuthorsFromPR = exports.getCoAuthorsFromGitLogs = exports.getCoAuthorsFromCliArgs = void 0;
var common_1 = require("../common");
var git_url_parse_1 = __importDefault(require("git-url-parse"));
var octokit_1 = require("octokit");
var getCoAuthorsFromCliArgs = function (coAuthorCliArgs) {
    if (!coAuthorCliArgs || coAuthorCliArgs.length === 0) {
        return [];
    }
    return coAuthorCliArgs
        .map(function (authorStr) {
        var _a = authorStr.split(',').map(function (x) { return x.trim(); }), authorUserName = _a[0], authorEmail = _a[1];
        return { authorUserName: authorUserName, authorEmail: authorEmail };
    })
        .reduce(function (prev, coAuthor) {
        var userName = coAuthor.authorUserName.toLowerCase();
        if (['gitstart', 'gitstart-bot'].includes(userName) ||
            prev.some(function (x) { return x.authorUserName.toLocaleLowerCase() == userName.toLocaleLowerCase(); })) {
            return prev;
        }
        return __spreadArray(__spreadArray([], prev, true), [coAuthor], false);
    }, []);
};
exports.getCoAuthorsFromCliArgs = getCoAuthorsFromCliArgs;
var getCoAuthorsFromGitLogs = function (sliceGit, sliceRepo, sliceBranch) { return __awaiter(void 0, void 0, void 0, function () {
    var all, mergeMessageRegex;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                common_1.logger.logWriteLine('Slice', "Finding co-authors with 'GIT_SLICE_OPEN_SOURCE_AUTO_CO_AUTHORS_COMMITS: " + common_1.AUTO_CO_AUTHORS_COMMITS_OPTIONS.GitLogs + "'");
                return [4 /*yield*/, sliceGit.log({ from: sliceRepo.defaultBranch, to: sliceBranch })];
            case 1:
                all = (_a.sent()).all;
                mergeMessageRegex = /^merge branch .* into .*$/gi;
                return [2 /*return*/, all
                        .filter(function (commit) { return !mergeMessageRegex.test(commit.message.trim()); })
                        .reduce(function (prev, next) {
                        if (prev.some(function (x) { return x.authorUserName === next.author_name || x.authorEmail === next.author_email; })) {
                            return prev;
                        }
                        return __spreadArray(__spreadArray([], prev, true), [{ authorUserName: next.author_name, authorEmail: next.author_email }], false);
                    }, [])];
        }
    });
}); };
exports.getCoAuthorsFromGitLogs = getCoAuthorsFromGitLogs;
var getCoAuthorsFromPR = function (sliceRepo, sliceBranch) { return __awaiter(void 0, void 0, void 0, function () {
    var sliceGitUrlObject, sliceOctokit, listResponse, assignees;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                common_1.logger.logWriteLine('Slice', "Finding co-authors with 'GIT_SLICE_OPEN_SOURCE_AUTO_CO_AUTHORS_COMMITS: " + common_1.AUTO_CO_AUTHORS_COMMITS_OPTIONS.PrAssignees + "'");
                sliceGitUrlObject = (0, git_url_parse_1.default)(sliceRepo.gitHttpUri);
                if (sliceGitUrlObject.source !== 'github.com') {
                    throw new Error("Unsuported codehost '" + sliceGitUrlObject.source + "'");
                }
                common_1.logger.logWriteLine('Slice', "Finding PR (" + sliceRepo.defaultBranch + " <- " + sliceBranch + ") ...");
                sliceOctokit = new octokit_1.Octokit({
                    auth: sliceRepo.userToken,
                });
                return [4 /*yield*/, sliceOctokit.rest.pulls.list({
                        owner: sliceGitUrlObject.owner,
                        repo: sliceGitUrlObject.name,
                        base: sliceRepo.defaultBranch,
                        head: sliceGitUrlObject.owner + ":" + sliceBranch,
                        state: 'open',
                    })];
            case 1:
                listResponse = _a.sent();
                if (listResponse.data.length === 0) {
                    common_1.logger.logExtendLastLine("Not found!");
                    return [2 /*return*/, []];
                }
                assignees = listResponse.data[0].assignees;
                return [2 /*return*/, assignees
                        .filter(function (x) { return x.type === 'User'; })
                        .map(function (x) {
                        var _a, _b;
                        return {
                            authorUserName: (_a = x.name) !== null && _a !== void 0 ? _a : x.login,
                            authorEmail: (_b = x.email) !== null && _b !== void 0 ? _b : x.id + "+" + x.login + "@users.noreply.github.com",
                        };
                    })];
        }
    });
}); };
exports.getCoAuthorsFromPR = getCoAuthorsFromPR;
//# sourceMappingURL=coAuthors.js.map