"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var common_1 = require("./common");
var yargs_1 = __importDefault(require("yargs/yargs"));
var config_1 = require("./config");
var jobs_1 = require("./jobs");
var loadActionInputs = function (envFilePath, cb) { return __awaiter(void 0, void 0, void 0, function () {
    var actionInputs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                actionInputs = (0, config_1.loadValidateActionInputs)(envFilePath, true);
                return [4 /*yield*/, cb({ actionInputs: actionInputs })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var loadActionInputsAndInit = function (envFilePath, cb) { return __awaiter(void 0, void 0, void 0, function () {
    var actionInputs, _a, sliceGit, upstreamGit;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                actionInputs = (0, config_1.loadValidateActionInputs)(envFilePath);
                return [4 /*yield*/, (0, jobs_1.init)(actionInputs)];
            case 1:
                _a = _b.sent(), sliceGit = _a.sliceGit, upstreamGit = _a.upstreamGit;
                common_1.logger.logWriteLine('Common', 'Initialized git instances');
                return [4 /*yield*/, cb({ actionInputs: actionInputs, sliceGit: sliceGit, upstreamGit: upstreamGit })];
            case 2:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); };
var GLOBAL_OPTIONS_CONFIG = {
    env: {
        type: 'string',
        desc: 'File path of a text file which contains all required git-slice env variables',
    },
};
exports.default = (function (args) {
    if (args === void 0) { args = null; }
    return (0, yargs_1.default)(args !== null && args !== void 0 ? args : process.argv.slice(2))
        .option(GLOBAL_OPTIONS_CONFIG)
        .command('setup-workflow [dir]', 'Setup git-slice Github Actions', function (argv) {
        return argv.positional('dir', { desc: 'Repo directory', type: 'string', default: '.' });
    }, function (argv) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, jobs_1.setupWorkflow)(argv['dir'])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })
        .command('checkout', 'Fetch `origin` and checkout default branch of both upstream and slice repos', GLOBAL_OPTIONS_CONFIG, function (_a) {
        var env = _a.env;
        return loadActionInputsAndInit(env, function (_a) {
            var sliceGit = _a.sliceGit, upstreamGit = _a.upstreamGit, actionInputs = _a.actionInputs;
            return (0, jobs_1.checkout)(sliceGit, upstreamGit, actionInputs);
        });
    })
        .command('pull', 'Pull last changes from upstream repo into slice repo', GLOBAL_OPTIONS_CONFIG, function (_a) {
        var env = _a.env;
        return loadActionInputsAndInit(env, function (_a) {
            var sliceGit = _a.sliceGit, upstreamGit = _a.upstreamGit, actionInputs = _a.actionInputs;
            return (0, jobs_1.pull)(sliceGit, upstreamGit, actionInputs);
        });
    })
        .command('push', 'Push a branch in slice repo to upstream repo', __assign(__assign({}, GLOBAL_OPTIONS_CONFIG), { branch: { type: 'string', alias: 'b', desc: 'Name of pushing branch in slice repo' }, message: { type: 'string', alias: 'm', desc: 'Commit message' }, forcePush: {
            type: 'boolean',
            alias: 'force-push',
            default: false,
            desc: 'Determine wether to use force push or not',
        } }), function (_a) {
        var env = _a.env, branch = _a.branch, message = _a.message, forcePush = _a.forcePush;
        if (!branch || typeof branch !== 'string') {
            throw new Error("push job: 'branch' in string is required");
        }
        if (!message || typeof message !== 'string') {
            throw new Error("push job: 'message' in string is required");
        }
        return loadActionInputsAndInit(env, function (_a) {
            var sliceGit = _a.sliceGit, upstreamGit = _a.upstreamGit, actionInputs = _a.actionInputs;
            return (0, jobs_1.push)(sliceGit, upstreamGit, actionInputs, branch, message, forcePush);
        });
    })
        .command('raise-pr', 'Raise new PR for branch on upstream repo (GitHub only) with details (title/body) from the PR for a branch on slice repo', __assign(__assign({}, GLOBAL_OPTIONS_CONFIG), { branch: { type: 'string', alias: 'b', desc: 'Name of pushing branch in slice repo' } }), function (_a) {
        var branch = _a.branch, env = _a.env;
        if (!branch || typeof branch !== 'string') {
            throw new Error("raise-pr job: 'branch' in string is required");
        }
        return loadActionInputsAndInit(env, function (_a) {
            var actionInputs = _a.actionInputs;
            return (0, jobs_1.raisePr)(actionInputs, branch);
        });
    })
        .command('pull-branch', 'Pull last changes of a branch from upstream repo into slice repo. The destination branch in slice repo has the pulling branch but with `upstream-*` prefix. Please note that this job uses `force-push` and the upstream should be updated to date with the default branch of upstream repo otherwise there would be some extra changes', __assign(__assign({}, GLOBAL_OPTIONS_CONFIG), { branch: { type: 'string', alias: 'b', desc: 'Name of pulling branch in upstream repo' }, target: {
            type: 'string',
            alias: 'g',
            desc: "Name of target branch in slice repo. If it's passed, git-slice will create a PR (target branch <- pulling branch)",
        } }), function (_a) {
        var env = _a.env, branch = _a.branch, target = _a.target;
        if (!branch || typeof branch !== 'string') {
            throw new Error("pull-branch job: 'branch' in string is required");
        }
        return loadActionInputsAndInit(env, function (_a) {
            var actionInputs = _a.actionInputs, sliceGit = _a.sliceGit, upstreamGit = _a.upstreamGit;
            return (0, jobs_1.pullBranch)(sliceGit, upstreamGit, actionInputs, branch, target);
        });
    })
        .command('pull-review', "Pull a PR review from a PR on upstream repo into a PR on slice repo (GitHub only). Please note that if upstream review has comments on code, this job will throw errors if upstream and slice branches don't have the same changes", __assign(__assign({}, GLOBAL_OPTIONS_CONFIG), { prNumber: {
            type: 'number',
            alias: 'pr-number',
            desc: 'PR number on slice repo which you want to pull a review into',
        }, prReivewLink: {
            type: 'string',
            alias: 'from',
            desc: ' The link of pull request review or comment you want to pull from, ex: https://github.com/sourcegraph/sourcegraph/pull/37919#pullrequestreview-1025518547 or https://github.com/supabase/supabase/pull/9538#issuecomment-1279003669. Actually git-slice-tools only care about `/pull/<pull_id>#pullrequestreview-<review_id>` or `/pull/<pull_id>#issuecomment-<comment_id>` part for getting pull request number and review/comment id',
        } }), function (_a) {
        var env = _a.env, prNumber = _a.prNumber, prReivewLink = _a.prReivewLink;
        if (!prNumber || typeof prNumber !== 'number') {
            throw new Error("pull-review job: 'pr-number' in string is required");
        }
        if (!prReivewLink || typeof prReivewLink !== 'string') {
            throw new Error("pull-review job: 'from' in string is required");
        }
        return loadActionInputsAndInit(env, function (_a) {
            var actionInputs = _a.actionInputs;
            return (0, jobs_1.pullReview)(actionInputs, prNumber, prReivewLink);
        });
    })
        .command('pull-issue', "Pull an issue from upstream repo (or open source repo with 'GIT_SLICE_OPEN_SOURCE_FLOW') (GitHub only)", __assign(__assign({}, GLOBAL_OPTIONS_CONFIG), { fromIssueNumber: {
            type: 'number',
            alias: 'from',
            desc: 'Number of the upstream issue you want to pull',
        }, toIssueNumber: {
            type: 'number',
            alias: 'to',
            desc: 'Number of the slice issue you want to update',
            default: 0,
        }, triggerBy: {
            type: 'string',
            alias: 'trigger-by',
            desc: 'username of github account who executed this job',
        } }), function (_a) {
        var env = _a.env, fromIssueNumber = _a.fromIssueNumber, toIssueNumber = _a.toIssueNumber, triggerBy = _a.triggerBy;
        if (!fromIssueNumber || typeof fromIssueNumber !== 'number') {
            throw new Error("pull-issue job: 'from' in number is required");
        }
        if (toIssueNumber != null && typeof toIssueNumber !== 'number') {
            throw new Error("pull-issue job: 'to' in number is required");
        }
        return loadActionInputsAndInit(env, function (_a) {
            var actionInputs = _a.actionInputs;
            return (0, jobs_1.pullIssue)(actionInputs, fromIssueNumber, toIssueNumber, triggerBy);
        });
    })
        .command('open-source', 'Open source tools', function (openSourceArgv) {
        return openSourceArgv
            .command('add-issue <repo> <issue-number>', 'Add an issue to open source project', function (argv) {
            return argv
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('issue-number', { desc: 'Issue number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.addIssue(actionInputs, argv['repo'], argv['issue-number']);
            });
        })
            .command('reviewer-approve-issue <reviewer> <repo> <issue-number>', 'Reviewer approves an issue in open source project', function (argv) {
            return argv
                .positional('reviewer', { desc: 'Username of reviewer', type: 'string' })
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('issue-number', { desc: 'Issue number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.reviewerApproveIssue(actionInputs, argv['reviewer'], argv['repo'], argv['issue-number']);
            });
        })
            .command('reviewer-reject-issue <reviewer> <repo> <issue-number>', 'Reviewer rejects an issue in open source project', function (argv) {
            return argv
                .positional('reviewer', { desc: 'Username of reviewer', type: 'string' })
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('issue-number', { desc: 'Issue number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.reviewerRejectIssue(actionInputs, argv['reviewer'], argv['repo'], argv['issue-number']);
            });
        })
            .command('update-estimate <repo> <issue-number> <credits>', 'Update estimate credits of an issue in open source project', function (argv) {
            return argv
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('issue-number', { desc: 'Issue number', type: 'number' })
                .positional('credits', { desc: 'Estimate credits', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.updateEstimate(actionInputs, argv['repo'], argv['issue-number'], argv['credits']);
            });
        })
            .command('assign-dev <assignee> <repo> <issue-number>', 'Assign dev an issue', function (argv) {
            return argv
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('issue-number', { desc: 'Issue number', type: 'number' })
                .positional('assignee', { desc: 'Assignee username', type: 'string' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.assignDev(actionInputs, argv['assignee'], argv['repo'], argv['issue-number']);
            });
        })
            .command('request-review-pr <maintainer> <repo> <pr-number>', 'Request review pull request', function (argv) {
            return argv
                .positional('maintainer', { desc: 'Maintainer username', type: 'string' })
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('pr-number', { desc: 'Pull request number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.requestReviewPR(actionInputs, argv['maintainer'], argv['repo'], argv['pr-number']);
            });
        })
            .command('reviewer-approve-pr <reviewer> <repo> <pr-number>', 'Reviewer approves a pull request', function (argv) {
            return argv
                .positional('reviewer', { desc: 'Reviewer username', type: 'string' })
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('pr-number', { desc: 'Pull request number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.reviewerApprovePR(actionInputs, argv['reviewer'], argv['repo'], argv['pr-number']);
            });
        })
            .command('reviewer-request-changes-pr <reviewer> <repo> <pr-number>', 'Reviewer requests changes in a pull request', function (argv) {
            return argv
                .positional('reviewer', { desc: 'Reviewer username', type: 'string' })
                .positional('repo', { desc: 'Repository name', type: 'string' })
                .positional('pr-number', { desc: 'Pull request number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.reviewerRequestChangesPR(actionInputs, argv['reviewer'], argv['repo'], argv['pr-number']);
            });
        })
            .command('push-pr <push-pr-maintainer> <push-pr-repo> <push-pr-pr-number>', 'Mark a PR as pushed to client', function (argv) {
            return argv
                .positional('push-pr-maintainer', { desc: 'Maintainer username', type: 'string' })
                .positional('push-pr-repo', { desc: 'Repository name', type: 'string' })
                .positional('push-pr-pr-number', { desc: 'Pull request number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.pushPR(actionInputs, argv['push-pr-maintainer'], argv['push-pr-repo'], argv['push-pr-pr-number']);
            });
        })
            .command('merge-pr <merge-pr-maintainer> <merge-pr-repo> <merge-pr-pr-number>', 'Mark a PR as merged by client', function (argv) {
            return argv
                .positional('merge-pr-maintainer', { desc: 'Maintainer username', type: 'string' })
                .positional('merge-pr-repo', { desc: 'Repository name', type: 'string' })
                .positional('merge-pr-pr-number', { desc: 'Pull request number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.mergePr(actionInputs, argv['merge-pr-maintainer'], argv['merge-pr-repo'], argv['merge-pr-pr-number']);
            });
        })
            .command('close-pr <close-pr-maintainer> <close-pr-repo> <close-pr-pr-number>', 'Mark a PR as discontinued (closed)', function (argv) {
            return argv
                .positional('close-pr-maintainer', { desc: 'Maintainer username', type: 'string' })
                .positional('close-pr-repo', { desc: 'Repository name', type: 'string' })
                .positional('close-pr-pr-number', { desc: 'Pull request number', type: 'number' });
        }, function (argv) {
            return loadActionInputs(argv.env, function (_a) {
                var actionInputs = _a.actionInputs;
                return jobs_1.openSource.closePR(actionInputs, argv['close-pr-maintainer'], argv['close-pr-repo'], argv['close-pr-pr-number']);
            });
        })
            .command('setup-workflow [dir]', 'Setup git-slice-open-source Github Actions', function (argv) {
            return argv.positional('dir', { desc: 'Repo directory', type: 'string', default: '.' });
        }, function (argv) {
            return jobs_1.openSource.setupWorkflow(argv['dir']);
        });
    });
});
//# sourceMappingURL=index.js.map