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
exports.pull = void 0;
var terminal_kit_1 = require("terminal-kit");
var common_1 = require("../common");
var pull = function (sliceGit, upstreamGit, actionInputs) { return __awaiter(void 0, void 0, void 0, function () {
    var upstreamLastCommitId, upstreamGitSliceIgnore, resolvedGitSliceIgnoreFiles, diffFiles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, terminal_kit_1.terminal)('-'.repeat(30) + '\n');
                (0, terminal_kit_1.terminal)('Performing pull job...\n');
                return [4 /*yield*/, (0, common_1.checkoutAndPullLastVersion)(upstreamGit, 'Upstream', actionInputs.upstreamRepo.defaultBranch)];
            case 1:
                _a.sent();
                if (!actionInputs.isOpenSourceFlow) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, common_1.checkoutAndPullLastVersion)(upstreamGit, 'OpenSource', actionInputs.upstreamRepo.defaultBranch, true)];
            case 2:
                _a.sent();
                (0, common_1.logWriteLine)('Upstream', "Push '" + actionInputs.upstreamRepo.defaultBranch + "' branch to make sure it up-to-date open-source repo ...");
                return [4 /*yield*/, upstreamGit.push('origin', actionInputs.upstreamRepo.defaultBranch)];
            case 3:
                _a.sent();
                (0, common_1.logExtendLastLine)('Done!');
                _a.label = 4;
            case 4:
                (0, common_1.logWriteLine)('Upstream', "Get last commit oid...");
                return [4 /*yield*/, upstreamGit.revparse('HEAD')];
            case 5:
                upstreamLastCommitId = _a.sent();
                (0, common_1.logExtendLastLine)("Done! -> " + upstreamLastCommitId);
                return [4 /*yield*/, (0, common_1.checkoutAndPullLastVersion)(sliceGit, 'Slice', actionInputs.sliceRepo.defaultBranch)];
            case 6:
                _a.sent();
                upstreamGitSliceIgnore = (0, common_1.getGitSliceIgoreConfig)(actionInputs.upstreamRepo.dir);
                resolvedGitSliceIgnoreFiles = __spreadArray(__spreadArray([], upstreamGitSliceIgnore, true), actionInputs.sliceIgnores, true);
                return [4 /*yield*/, (0, common_1.deleteGitSliceIgnoreFiles)(resolvedGitSliceIgnoreFiles, actionInputs.upstreamRepo.dir, 'Upstream')];
            case 7:
                _a.sent();
                return [4 /*yield*/, (0, common_1.copyFiles)(sliceGit, actionInputs.upstreamRepo.dir, actionInputs.sliceRepo.dir, actionInputs.sliceIgnores, 'Slice')];
            case 8:
                diffFiles = _a.sent();
                if (!(diffFiles.length !== 0)) return [3 /*break*/, 11];
                return [4 /*yield*/, sliceGit.raw('add', '.', '--force')];
            case 9:
                _a.sent();
                return [4 /*yield*/, (0, common_1.createCommitAndPushCurrentChanges)(sliceGit, "git-slice:" + upstreamLastCommitId, actionInputs.sliceRepo.defaultBranch, 'Slice')];
            case 10:
                _a.sent();
                _a.label = 11;
            case 11:
                (0, common_1.logWriteLine)('Slice', "Up to date");
                return [2 /*return*/];
        }
    });
}); };
exports.pull = pull;
//# sourceMappingURL=pull.js.map