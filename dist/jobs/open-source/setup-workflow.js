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
var crypto_1 = __importDefault(require("crypto"));
var fs_1 = __importDefault(require("fs"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var path_1 = __importDefault(require("path"));
var terminal_kit_1 = require("terminal-kit");
var setupWorkflow = function (repoDir) { return __awaiter(void 0, void 0, void 0, function () {
    var repoAbsFolder, workflowFilePath, shouldOverride, template, content, requiredInputs, i, requiredInput, desc, ex, defaultValue, _a, regex, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                repoAbsFolder = path_1.default.resolve(process.cwd(), repoDir);
                workflowFilePath = path_1.default.resolve(repoAbsFolder, '.github/workflows/git-slice-open-source.yml');
                (0, terminal_kit_1.terminal)("Setup git-slice-open-source workflow in this local repository: " + repoAbsFolder + "\n");
                if (!fs_1.default.existsSync(workflowFilePath)) return [3 /*break*/, 2];
                (0, terminal_kit_1.terminal)('git-slice-open-source.yml already exists. Do you want to override it? (y/n) ');
                return [4 /*yield*/, terminal_kit_1.terminal.inputField({ cancelable: false }).promise];
            case 1:
                shouldOverride = _c.sent();
                if (shouldOverride.toLowerCase() !== 'y') {
                    process.exit();
                }
                (0, terminal_kit_1.terminal)("\n");
                _c.label = 2;
            case 2:
                (0, terminal_kit_1.terminal)("Loading template...\n");
                return [4 /*yield*/, (0, node_fetch_1.default)('https://raw.githubusercontent.com/GitStartHQ/git-slice-tools/main/git-slice-open-source.yml')];
            case 3: return [4 /*yield*/, (_c.sent()).text()];
            case 4:
                template = _c.sent();
                content = template;
                (0, terminal_kit_1.terminal)("Please enter following inputs (enter 'q' to exit):\n");
                requiredInputs = [
                    {
                        env: 'GIT_SLICE_OPEN_SOURCE_INSTANCE_NAME',
                        desc: 'Name of open source instance',
                    },
                    {
                        env: 'GIT_SLICE_OPEN_SOURCE_URL',
                        desc: 'Open source git url',
                        ex: 'https://github.com/cypress-io/cypress.git',
                        regex: /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i,
                    },
                    {
                        env: 'GIT_SLICE_UPSTREAM_REPO_URL',
                        desc: 'Upstream repo (forked repo) git url',
                        ex: 'https://github.com/GitStartHQ/cypress.git',
                        regex: /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i,
                    },
                    {
                        env: 'GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH',
                        desc: 'Upstream repo (forked repo) default branch',
                        defaultValue: 'main',
                    },
                    {
                        env: 'GIT_SLICE_SLICE_REPO_URL',
                        desc: 'Slice repo (internal repo) git url',
                        ex: 'https://github.com/GitStartHQ/client-cypress.git',
                        regex: /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i,
                    },
                    {
                        env: 'GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH',
                        desc: 'Slice repo (internal repo) default branch',
                        defaultValue: 'main',
                    },
                ];
                i = 0;
                _c.label = 5;
            case 5:
                if (!(i < requiredInputs.length)) return [3 /*break*/, 8];
                requiredInput = requiredInputs[i];
                desc = requiredInput.desc, ex = requiredInput.ex, defaultValue = requiredInput.defaultValue, _a = requiredInput.regex, regex = _a === void 0 ? /.{1}/ : _a;
                (0, terminal_kit_1.terminal)("" + desc + (ex ? " (Ex: " + ex + ")" : '') + ": ");
                _b = requiredInput;
                return [4 /*yield*/, terminal_kit_1.terminal.inputField({
                        cancelable: false,
                        default: defaultValue,
                    }).promise];
            case 6:
                _b.value = _c.sent();
                if (requiredInput.value === 'q') {
                    (0, terminal_kit_1.terminal)("\nYou entered 'q'. Existing... \n");
                    process.exit();
                }
                regex.lastIndex = 0;
                if (!regex.test(requiredInput.value)) {
                    (0, terminal_kit_1.terminal)("\n  Invalid '" + desc + "', should be matched " + String(regex).replace('^', '^^'));
                    i -= 1;
                }
                (0, terminal_kit_1.terminal)("\n");
                _c.label = 7;
            case 7:
                i++;
                return [3 /*break*/, 5];
            case 8:
                (0, terminal_kit_1.terminal)('Writing git-slice-open-source.yml file with entered inputs...\n');
                requiredInputs.unshift({ env: 'GIT_SLICE_CHECKOUT_CACHED_KEY', desc: '', value: crypto_1.default.randomUUID() });
                requiredInputs.forEach(function (_a) {
                    var env = _a.env, value = _a.value;
                    (0, terminal_kit_1.terminal)("  - " + env + ": " + value + "\n");
                    content = content.replace("<input-" + env + ">", value);
                });
                fs_1.default.writeFileSync(workflowFilePath, "" + content, { flag: 'w' });
                (0, terminal_kit_1.terminal)('Done!\n');
                (0, terminal_kit_1.terminal)('Please remember to: \n');
                (0, terminal_kit_1.terminal)("  - Push '.github/workflows/git-slice-open-source.yml' file to default branch of slice repo.\n");
                (0, terminal_kit_1.terminal)("  - Invite 'gitstart' (bot@gitstart.com) as a maintainer of both slice and upstream repos.\n");
                process.exit();
                return [2 /*return*/];
        }
    });
}); };
exports.setupWorkflow = setupWorkflow;
//# sourceMappingURL=setup-workflow.js.map