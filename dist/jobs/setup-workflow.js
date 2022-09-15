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
exports.setupWorkflow = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var terminal_kit_1 = require("terminal-kit");
var child_process_1 = require("child_process");
var setupWorkflow = function (repoDir) { return __awaiter(void 0, void 0, void 0, function () {
    var mainGitSliceToolsVersion, installedGitSliceToolsVersion, shouldOverride, repoAbsFolder, workflowFilePath, gitUriRegex, shouldOverride, template, content, requiredInputs, useOpensourceWorkflow, _a, _b, currentRemoteOrigin, sliceRepoUrlInput, sliceRepoDefaultBranchInput, sliceRepoUsernameInput, sliceRepoEmailInput, upstreamRepoUrlInput, upstreamRepoDefaultBranchInput, upstreamRepoUsernameInput, upstreamRepoEmailInput;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                (0, terminal_kit_1.terminal)("Checking git-slice-tool version...");
                mainGitSliceToolsVersion = String(JSON.parse((0, child_process_1.execSync)('curl -s https://raw.githubusercontent.com/GitStartHQ/git-slice-tools/main/package.json').toString('utf8')).version);
                installedGitSliceToolsVersion = (0, child_process_1.execSync)('git-slice-tools --version').toString('utf8').trim();
                (0, terminal_kit_1.terminal)(installedGitSliceToolsVersion + "\n");
                if (!(mainGitSliceToolsVersion !== installedGitSliceToolsVersion)) return [3 /*break*/, 2];
                (0, terminal_kit_1.terminal)("Installed git-slice-tools version " + installedGitSliceToolsVersion + " is out of date.\n");
                (0, terminal_kit_1.terminal)("We recommend to update version " + mainGitSliceToolsVersion + " before continue. Do you still want to continue? (y/n) ");
                return [4 /*yield*/, terminal_kit_1.terminal.inputField({ cancelable: false }).promise];
            case 1:
                shouldOverride = _c.sent();
                if (shouldOverride.toLowerCase() !== 'y') {
                    process.exit();
                }
                (0, terminal_kit_1.terminal)("\n");
                _c.label = 2;
            case 2:
                repoAbsFolder = path_1.default.resolve(process.cwd(), repoDir);
                workflowFilePath = path_1.default.resolve(repoAbsFolder, '.github/workflows/git-slice.yml');
                gitUriRegex = /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i;
                (0, terminal_kit_1.terminal)("Setup git-slice workflow in this local repository: " + repoAbsFolder + "\n");
                if (!fs_1.default.existsSync(workflowFilePath)) return [3 /*break*/, 4];
                (0, terminal_kit_1.terminal)('git-slice.yml already exists. Do you want to override it? (y/n) ');
                return [4 /*yield*/, terminal_kit_1.terminal.inputField({ cancelable: false }).promise];
            case 3:
                shouldOverride = _c.sent();
                if (shouldOverride.toLowerCase() !== 'y') {
                    process.exit();
                }
                (0, terminal_kit_1.terminal)("\n");
                _c.label = 4;
            case 4:
                (0, terminal_kit_1.terminal)("Loading template...\n");
                template = (0, child_process_1.execSync)('curl -s https://raw.githubusercontent.com/GitStartHQ/git-slice-tools/main/git-slice.yml').toString('utf8');
                content = template;
                requiredInputs = [];
                (0, terminal_kit_1.terminal)('Do you want to use open-source workflow?: (y/n) ');
                return [4 /*yield*/, terminal_kit_1.terminal.inputField({ cancelable: false }).promise];
            case 5:
                useOpensourceWorkflow = (_c.sent()).toLowerCase() === 'y';
                (0, terminal_kit_1.terminal)("\n");
                // GIT_SLICE_OPEN_SOURCE_FLOW
                requiredInputs.push({
                    env: 'GIT_SLICE_OPEN_SOURCE_FLOW',
                    desc: '',
                    value: String(useOpensourceWorkflow),
                });
                if (!useOpensourceWorkflow) return [3 /*break*/, 7];
                _b = (_a = requiredInputs).push;
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_OPEN_SOURCE_URL',
                        desc: 'Open source git url',
                        ex: 'https://github.com/cypress-io/cypress.git',
                        regex: gitUriRegex,
                    })];
            case 6:
                _b.apply(_a, [_c.sent()]);
                return [3 /*break*/, 8];
            case 7:
                requiredInputs.push({
                    env: 'GIT_SLICE_OPEN_SOURCE_URL',
                    desc: '',
                    value: "''",
                });
                _c.label = 8;
            case 8:
                currentRemoteOrigin = (0, child_process_1.execSync)('git config --get remote.origin.url', { cwd: repoAbsFolder }).toString().trim();
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_SLICE_REPO_URL',
                        desc: 'Slice repo (internal repo) git url',
                        ex: 'https://github.com/GitStartHQ/client-cypress.git',
                        regex: gitUriRegex,
                        defaultValue: currentRemoteOrigin || undefined,
                    })];
            case 9:
                sliceRepoUrlInput = _c.sent();
                requiredInputs.push(sliceRepoUrlInput);
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH',
                        desc: 'Slice repo (internal repo) default branch',
                        defaultValue: 'main',
                    })];
            case 10:
                sliceRepoDefaultBranchInput = _c.sent();
                requiredInputs.push(sliceRepoDefaultBranchInput);
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_SLICE_REPO_USERNAME',
                        desc: 'Slice repo (internal repo) username',
                        defaultValue: 'gitstart',
                    })];
            case 11:
                sliceRepoUsernameInput = _c.sent();
                requiredInputs.push(sliceRepoUsernameInput);
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_SLICE_REPO_EMAIL',
                        desc: 'Slice repo (internal repo) email',
                        defaultValue: 'bot@gitstart.com',
                    })];
            case 12:
                sliceRepoEmailInput = _c.sent();
                requiredInputs.push(sliceRepoEmailInput);
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_UPSTREAM_REPO_URL',
                        desc: "Upstream repo (" + (useOpensourceWorkflow ? 'forked repo' : 'client repo') + ") git url",
                        ex: useOpensourceWorkflow ? 'https://github.com/GitStartHQ/cypress.git' : undefined,
                        regex: gitUriRegex,
                    })];
            case 13:
                upstreamRepoUrlInput = _c.sent();
                requiredInputs.push(upstreamRepoUrlInput);
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH',
                        desc: "Upstream repo (" + (useOpensourceWorkflow ? 'forked repo' : 'client repo') + ") default branch",
                        defaultValue: 'main',
                    })];
            case 14:
                upstreamRepoDefaultBranchInput = _c.sent();
                requiredInputs.push(upstreamRepoDefaultBranchInput);
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_UPSTREAM_REPO_USERNAME',
                        desc: "Upstream repo (" + (useOpensourceWorkflow ? 'forked repo' : 'client repo') + ") username",
                        defaultValue: useOpensourceWorkflow ? 'gitstart' : 'gitstart-',
                    })];
            case 15:
                upstreamRepoUsernameInput = _c.sent();
                requiredInputs.push(upstreamRepoUsernameInput);
                return [4 /*yield*/, getTerminalInput({
                        env: 'GIT_SLICE_UPSTREAM_REPO_EMAIL',
                        desc: "Upstream repo (" + (useOpensourceWorkflow ? 'forked repo' : 'client repo') + ") email",
                        defaultValue: useOpensourceWorkflow
                            ? 'bot@gitstart.com'
                            : upstreamRepoUsernameInput.value.replace('gitstart-', '') + "@gitstart.com",
                    })];
            case 16:
                upstreamRepoEmailInput = _c.sent();
                requiredInputs.push(upstreamRepoEmailInput);
                (0, terminal_kit_1.terminal)('Writing git-slice.yml file with entered inputs...\n');
                requiredInputs.forEach(function (_a) {
                    var env = _a.env, value = _a.value;
                    (0, terminal_kit_1.terminal)("  - " + env + ": " + value + "\n");
                    content = content.replace("<input-" + env + ">", value);
                });
                if (useOpensourceWorkflow && sliceRepoUsernameInput.value === 'gitstart') {
                    // if slice repo uses `gitstart` account
                    // we should use `${{ secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT }}` instead of `${{ secrets.GIT_SLICE_SLICE_REPO_PASSWORD }}`
                    content = content.replace('secrets.GIT_SLICE_SLICE_REPO_PASSWORD', 'secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT');
                }
                if (useOpensourceWorkflow && upstreamRepoUsernameInput.value === 'gitstart') {
                    // if slice repo uses `gitstart` account
                    // we should use `${{ secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT }}` instead of `${{ secrets.GIT_SLICE_UPSTREAM_REPO_PASSWORD }}`
                    content = content.replace('secrets.GIT_SLICE_UPSTREAM_REPO_PASSWORD', 'secrets.OPEN_SOURCE_GITSTART_ACCOUNT_PAT');
                }
                fs_1.default.mkdirSync(path_1.default.dirname(workflowFilePath), { recursive: true });
                fs_1.default.writeFileSync(workflowFilePath, "" + content, { flag: 'w' });
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)('Please remember to: \n');
                (0, terminal_kit_1.terminal)("  - Push '.github/workflows/git-slice.yml' file to default branch of slice repo.\n");
                if (useOpensourceWorkflow) {
                    if (upstreamRepoUsernameInput.value !== sliceRepoUsernameInput.value) {
                        (0, terminal_kit_1.terminal)("  - Invite '" + sliceRepoUsernameInput.value + "' as a maintainer of slice repo.\n");
                        (0, terminal_kit_1.terminal)("  - Invite '" + upstreamRepoEmailInput.value + "' as a maintainer of upstream repo.\n");
                    }
                    else {
                        (0, terminal_kit_1.terminal)("  - Invite '" + sliceRepoUsernameInput.value + "' as a maintainer of both slice and upstream repos.\n");
                    }
                }
                else {
                    (0, terminal_kit_1.terminal)("  - Invite '" + sliceRepoUsernameInput.value + "' as a maintainer of slice repo.\n");
                }
                if (!useOpensourceWorkflow || sliceRepoUsernameInput.value !== 'gitstart') {
                    (0, terminal_kit_1.terminal)("  - Create a repo secret with name is 'GIT_SLICE_SLICE_REPO_PASSWORD' and value is the PAT of '" + sliceRepoUsernameInput.value + "' account.\n");
                }
                if (!useOpensourceWorkflow || upstreamRepoUsernameInput.value !== 'gitstart') {
                    (0, terminal_kit_1.terminal)("  - Create a repo secret with name is 'GIT_SLICE_UPSTREAM_REPO_PASSWORD' and value is the PAT of '" + upstreamRepoUsernameInput.value + "' account.\n");
                }
                (0, terminal_kit_1.terminal)("  - Create a repo secret with name is 'GIT_SLICE_UPSTREAM_REPO_CACHE_KEY' and value is a dummy string value.\n");
                process.exit();
                return [2 /*return*/];
        }
    });
}); };
exports.setupWorkflow = setupWorkflow;
var getTerminalInput = function (requiredInput) { return __awaiter(void 0, void 0, void 0, function () {
    var isValid, desc, ex, defaultValue, _a, regex, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                isValid = false;
                _c.label = 1;
            case 1:
                if (!!isValid) return [3 /*break*/, 3];
                desc = requiredInput.desc, ex = requiredInput.ex, defaultValue = requiredInput.defaultValue, _a = requiredInput.regex, regex = _a === void 0 ? /.{1}/ : _a;
                (0, terminal_kit_1.terminal)("" + desc + (ex ? " (Ex: " + ex + ")" : '') + ": ");
                _b = requiredInput;
                return [4 /*yield*/, terminal_kit_1.terminal.inputField({
                        cancelable: false,
                        default: defaultValue,
                    }).promise];
            case 2:
                _b.value = _c.sent();
                if (requiredInput.value === 'q') {
                    (0, terminal_kit_1.terminal)("\nYou entered 'q'. Existing... \n");
                    process.exit();
                }
                regex.lastIndex = 0;
                if (!regex.test(requiredInput.value)) {
                    (0, terminal_kit_1.terminal)("\n  Invalid '" + desc + "', should be matched " + String(regex).replace('^', '^^') + "\n");
                    return [3 /*break*/, 1];
                }
                (0, terminal_kit_1.terminal)("\n");
                isValid = true;
                return [3 /*break*/, 1];
            case 3: return [2 /*return*/, requiredInput];
        }
    });
}); };
//# sourceMappingURL=setup-workflow.js.map