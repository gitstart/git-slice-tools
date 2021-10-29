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
exports.pull = void 0;
var simple_git_1 = require("simple-git");
var terminal_kit_1 = require("terminal-kit");
var glob_1 = require("glob");
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var pull = function (sliceGit, upstreamGit, actionInputs) { return __awaiter(void 0, void 0, void 0, function () {
    var upstreamLastCommitId, i, pattern, mg, j, pathMatch, sliceStatus;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, terminal_kit_1.terminal)('-'.repeat(20) + '\n');
                (0, terminal_kit_1.terminal)('Performing pull job...\n');
                (0, terminal_kit_1.terminal)("Upstream: Checkout and pull last versions '" + actionInputs.upstreamDefaultBranch + "' branch...");
                return [4 /*yield*/, upstreamGit.checkout(actionInputs.upstreamDefaultBranch)];
            case 1:
                _a.sent();
                return [4 /*yield*/, upstreamGit.reset(['--hard', "origin/" + actionInputs.upstreamDefaultBranch])];
            case 2:
                _a.sent();
                return [4 /*yield*/, upstreamGit.pull('origin', actionInputs.upstreamDefaultBranch)];
            case 3:
                _a.sent();
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)("Upstream: Clean...");
                return [4 /*yield*/, upstreamGit.clean(simple_git_1.CleanOptions.FORCE + simple_git_1.CleanOptions.IGNORED_ONLY)];
            case 4:
                _a.sent();
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)("Upstream: Get last commit oid...");
                return [4 /*yield*/, upstreamGit.revparse('HEAD')];
            case 5:
                upstreamLastCommitId = _a.sent();
                (0, terminal_kit_1.terminal)("Done! -> " + upstreamLastCommitId + "\n");
                (0, terminal_kit_1.terminal)("Slice: Checkout and pull last versions '" + actionInputs.sliceDefaultBranch + "' branch...");
                return [4 /*yield*/, sliceGit.checkout(actionInputs.sliceDefaultBranch)];
            case 6:
                _a.sent();
                return [4 /*yield*/, sliceGit.reset(['--hard', "origin/" + actionInputs.sliceDefaultBranch])];
            case 7:
                _a.sent();
                return [4 /*yield*/, sliceGit.pull('origin', actionInputs.sliceDefaultBranch)];
            case 8:
                _a.sent();
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)("Slice: Clean...");
                return [4 /*yield*/, sliceGit.clean(simple_git_1.CleanOptions.FORCE + simple_git_1.CleanOptions.IGNORED_ONLY)];
            case 9:
                _a.sent();
                (0, terminal_kit_1.terminal)('Done!\n');
                for (i = 0; i < actionInputs.sliceIgnores.length; i++) {
                    pattern = actionInputs.sliceIgnores[i];
                    (0, terminal_kit_1.terminal)("Upstream: Unlinking ignore files with pattern '" + pattern + "' ...");
                    mg = new glob_1.Glob(pattern, {
                        cwd: actionInputs.upstreamRepoDir,
                        sync: true,
                    });
                    (0, terminal_kit_1.terminal)("Found " + mg.found.length + " file(s)!\n");
                    if (mg.found.length === 0) {
                        continue;
                    }
                    for (j = 0; j < mg.found.length; j++) {
                        pathMatch = mg.found[j];
                        (0, terminal_kit_1.terminal)("Deleting: " + pathMatch + "...");
                        fs_extra_1.default.unlinkSync(path_1.default.join(actionInputs.upstreamRepoDir, pathMatch));
                        (0, terminal_kit_1.terminal)('Done!\n');
                    }
                }
                (0, terminal_kit_1.terminal)("Slice: Copying files from upstream...");
                fs_extra_1.default.copySync(actionInputs.upstreamRepoDir, actionInputs.sliceRepoDir, {
                    overwrite: true,
                    filter: function (filePath) {
                        return filePath.startsWith(path_1.default.join(actionInputs.upstreamRepoDir, '.git'));
                    },
                });
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)("Slice: Status...\n");
                (0, terminal_kit_1.terminal)('Done!\n');
                return [4 /*yield*/, sliceGit.status()];
            case 10:
                sliceStatus = _a.sent();
                if (sliceStatus.files.length === 0) {
                    (0, terminal_kit_1.terminal)("Slice: Up to date with upstream\n");
                    return [2 /*return*/];
                }
                (0, terminal_kit_1.terminal)(sliceStatus.files.map(function (f) { return f.path; }).join('\n'));
                (0, terminal_kit_1.terminal)("Slice: Creating 'git-slice:" + upstreamLastCommitId + "' commit...");
                return [4 /*yield*/, sliceGit.add('*')];
            case 11:
                _a.sent();
                return [4 /*yield*/, sliceGit.commit("git-slice:" + upstreamLastCommitId)];
            case 12:
                _a.sent();
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)("Slice: Pushing... 'git-slice:" + upstreamLastCommitId + "' commit...");
                return [4 /*yield*/, sliceGit.push('origin', actionInputs.sliceDefaultBranch)];
            case 13:
                _a.sent();
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)("Slice: Up to date with upstream\n");
                return [2 /*return*/];
        }
    });
}); };
exports.pull = pull;
