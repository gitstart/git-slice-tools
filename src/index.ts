import { SimpleGit } from 'simple-git'
import { terminal } from 'terminal-kit'
import yargs from 'yargs/yargs'
import { loadValidateActionInputs } from './config'
import {
    checkout,
    init,
    openSource,
    pull,
    pullBranch,
    pullIssue,
    pullReview,
    push,
    raisePr,
    setupWorkflow,
} from './jobs'
import { ActionInputs } from './types'

const loadActionInputs = async (
    envFilePath: string,
    cb: (parameters: { actionInputs: ActionInputs }) => Promise<unknown>
): Promise<void> => {
    const actionInputs = loadValidateActionInputs(envFilePath, true)

    await cb({ actionInputs })

    return
}

const loadActionInputsAndInit = async (
    envFilePath: string,
    cb: (parameters: { actionInputs: ActionInputs; sliceGit: SimpleGit; upstreamGit: SimpleGit }) => Promise<unknown>
): Promise<void> => {
    const actionInputs = loadValidateActionInputs(envFilePath)
    const { sliceGit, upstreamGit } = await init(actionInputs)

    terminal('Initialized git instances\n')

    await cb({ actionInputs, sliceGit, upstreamGit })

    return
}

const GLOBAL_OPTIONS_CONFIG = {
    env: {
        type: 'string',
        desc: 'File path of a text file which contains all required git-slice env variables',
    },
} as const

yargs(process.argv.slice(2))
    .option(GLOBAL_OPTIONS_CONFIG)
    .command(
        'setup-workflow [dir]',
        'Setup git-slice Github Actions',
        argv => {
            return argv.positional('dir', { desc: 'Repo directory', type: 'string', default: '.' })
        },
        async argv => {
            await setupWorkflow(argv['dir'])
        }
    )
    .command(
        'checkout',
        'Fetch `origin` and checkout default branch of both upstream and slice repos',
        GLOBAL_OPTIONS_CONFIG,
        async ({ env }) => {
            return loadActionInputsAndInit(env, ({ sliceGit, upstreamGit, actionInputs }) =>
                checkout(sliceGit, upstreamGit, actionInputs)
            )
        }
    )
    .command('pull', 'Pull last changes from upstream repo into slice repo', GLOBAL_OPTIONS_CONFIG, async ({ env }) => {
        return loadActionInputsAndInit(env, ({ sliceGit, upstreamGit, actionInputs }) =>
            pull(sliceGit, upstreamGit, actionInputs)
        )
    })
    .command(
        'push',
        'Push a branch in slice repo to upstream repo',
        {
            ...GLOBAL_OPTIONS_CONFIG,
            branch: { type: 'string', alias: 'b', desc: 'Name of pushing branch in slice repo' },
            message: { type: 'string', alias: 'm', desc: 'Commit message' },
            forcePush: {
                type: 'boolean',
                alias: 'force-push',
                default: false,
                desc: 'Determine wether to use force push or not',
            },
        },
        async ({ env, branch, message, forcePush }) => {
            if (!branch || typeof branch !== 'string') {
                throw new Error(`push job: 'branch' in string is required`)
            }

            if (!message || typeof message !== 'string') {
                throw new Error(`push job: 'message' in string is required`)
            }

            return loadActionInputsAndInit(env, ({ sliceGit, upstreamGit, actionInputs }) =>
                push(sliceGit, upstreamGit, actionInputs, branch, message, forcePush)
            )
        }
    )
    .command(
        'raise-pr',
        'Raise new PR for branch on upstream repo (GitHub only) with details (title/body) from the PR for a branch on slice repo',
        {
            ...GLOBAL_OPTIONS_CONFIG,
            branch: { type: 'string', alias: 'b', desc: 'Name of pushing branch in slice repo' },
        },
        async ({ branch, env }) => {
            if (!branch || typeof branch !== 'string') {
                throw new Error(`raise-pr job: 'branch' in string is required`)
            }

            return loadActionInputsAndInit(env, ({ actionInputs }) => raisePr(actionInputs, branch))
        }
    )
    .command(
        'pull-branch',
        'Pull last changes of a branch from upstream repo into slice repo. The destination branch in slice repo has the pulling branch but with `upstream-*` prefix. Please note that this job uses `force-push` and the upstream should be updated to date with the default branch of upstream repo otherwise there would be some extra changes',
        {
            ...GLOBAL_OPTIONS_CONFIG,
            branch: { type: 'string', alias: 'b', desc: 'Name of pulling branch in upstream repo' },
            target: {
                type: 'string',
                alias: 'g',
                desc: "Name of target branch in slice repo. If it's passed, git-slice will create a PR (target branch <- pulling branch)",
            },
        },
        async ({ env, branch, target }) => {
            if (!branch || typeof branch !== 'string') {
                throw new Error(`pull-branch job: 'branch' in string is required`)
            }

            return loadActionInputsAndInit(env, ({ actionInputs, sliceGit, upstreamGit }) =>
                pullBranch(sliceGit, upstreamGit, actionInputs, branch, target)
            )
        }
    )
    .command(
        'pull-review',
        "Pull a PR review from a PR on upstream repo into a PR on slice repo (GitHub only). Please note that if upstream review has comments on code, this job will throw errors if upstream and slice branches don't have the same changes",
        {
            ...GLOBAL_OPTIONS_CONFIG,
            prNumber: {
                type: 'number',
                alias: 'pr-number',
                desc: 'PR number on slice repo which you want to pull a review into',
            },
            prReivewLink: {
                type: 'string',
                alias: 'from',
                desc: ' The link of pull request review or comment you want to pull from, ex: https://github.com/sourcegraph/sourcegraph/pull/37919#pullrequestreview-1025518547 or https://github.com/supabase/supabase/pull/9538#issuecomment-1279003669. Actually git-slice-tools only care about `/pull/<pull_id>#pullrequestreview-<review_id>` or `/pull/<pull_id>#issuecomment-<comment_id>` part for getting pull request number and review/comment id',
            },
        },
        async ({ env, prNumber, prReivewLink }) => {
            if (!prNumber || typeof prNumber !== 'number') {
                throw new Error(`pull-review job: 'pr-number' in string is required`)
            }

            if (!prReivewLink || typeof prReivewLink !== 'string') {
                throw new Error(`pull-review job: 'from' in string is required`)
            }

            return loadActionInputsAndInit(env, ({ actionInputs }) => pullReview(actionInputs, prNumber, prReivewLink))
        }
    )
    .command(
        'pull-issue',
        "Pull an issue from upstream repo (or open source repo with 'GIT_SLICE_OPEN_SOURCE_FLOW') (GitHub only)",
        {
            ...GLOBAL_OPTIONS_CONFIG,
            fromIssueNumber: {
                type: 'number',
                alias: 'from',
                desc: 'Number of the upstream issue you want to pull',
            },
            toIssueNumber: {
                type: 'number',
                alias: 'to',
                desc: 'Number of the slice issue you want to update',
                default: 0,
            },
            triggerBy: {
                type: 'string',
                alias: 'trigger-by',
                desc: 'username of github account who executed this job',
            },
        },
        async ({ env, fromIssueNumber, toIssueNumber, triggerBy }) => {
            if (!fromIssueNumber || typeof fromIssueNumber !== 'number') {
                throw new Error(`pull-issue job: 'from' in number is required`)
            }

            if (toIssueNumber != null && typeof toIssueNumber !== 'number') {
                throw new Error(`pull-issue job: 'to' in number is required`)
            }

            return loadActionInputsAndInit(env, ({ actionInputs }) =>
                pullIssue(actionInputs, fromIssueNumber, toIssueNumber, triggerBy)
            )
        }
    )
    .command('open-source', 'Open source tools', openSourceArgv => {
        return openSourceArgv
            .command(
                'add-issue <repo> <issue-number>',
                'Add an issue to open source project',
                argv => {
                    return argv
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('issue-number', { desc: 'Issue number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.addIssue(actionInputs, argv['repo'], argv['issue-number'])
                    )
                }
            )
            .command(
                'reviewer-approve-issue <reviewer> <repo> <issue-number>',
                'Reviewer approves an issue in open source project',
                argv => {
                    return argv
                        .positional('reviewer', { desc: 'Username of reviewer', type: 'string' })
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('issue-number', { desc: 'Issue number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.reviewerApproveIssue(
                            actionInputs,
                            argv['reviewer'],
                            argv['repo'],
                            argv['issue-number']
                        )
                    )
                }
            )
            .command(
                'reviewer-reject-issue <reviewer> <repo> <issue-number>',
                'Reviewer rejects an issue in open source project',
                argv => {
                    return argv
                        .positional('reviewer', { desc: 'Username of reviewer', type: 'string' })
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('issue-number', { desc: 'Issue number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.reviewerRejectIssue(
                            actionInputs,
                            argv['reviewer'],
                            argv['repo'],
                            argv['issue-number']
                        )
                    )
                }
            )
            .command(
                'update-estimate <repo> <issue-number> <credits>',
                'Update estimate credits of an issue in open source project',
                argv => {
                    return argv
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('issue-number', { desc: 'Issue number', type: 'number' })
                        .positional('credits', { desc: 'Estimate credits', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.updateEstimate(actionInputs, argv['repo'], argv['issue-number'], argv['credits'])
                    )
                }
            )
            .command(
                'assign-dev <assignee> <repo> <issue-number>',
                'Assign dev an issue',
                argv => {
                    return argv
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('issue-number', { desc: 'Issue number', type: 'number' })
                        .positional('assignee', { desc: 'Assignee username', type: 'string' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.assignDev(actionInputs, argv['assignee'], argv['repo'], argv['issue-number'])
                    )
                }
            )
            .command(
                'request-review-pr <maintainer> <repo> <pr-number>',
                'Request review pull request',
                argv => {
                    return argv
                        .positional('maintainer', { desc: 'Maintainer username', type: 'string' })
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('pr-number', { desc: 'Pull request number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.requestReviewPR(actionInputs, argv['maintainer'], argv['repo'], argv['pr-number'])
                    )
                }
            )
            .command(
                'reviewer-approve-pr <reviewer> <repo> <pr-number>',
                'Reviewer approves a pull request',
                argv => {
                    return argv
                        .positional('reviewer', { desc: 'Reviewer username', type: 'string' })
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('pr-number', { desc: 'Pull request number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.reviewerApprovePR(actionInputs, argv['reviewer'], argv['repo'], argv['pr-number'])
                    )
                }
            )
            .command(
                'reviewer-request-changes-pr <reviewer> <repo> <pr-number>',
                'Reviewer requests changes in a pull request',
                argv => {
                    return argv
                        .positional('reviewer', { desc: 'Reviewer username', type: 'string' })
                        .positional('repo', { desc: 'Repository name', type: 'string' })
                        .positional('pr-number', { desc: 'Pull request number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.reviewerRequestChangesPR(
                            actionInputs,
                            argv['reviewer'],
                            argv['repo'],
                            argv['pr-number']
                        )
                    )
                }
            )
            .command(
                'push-pr <push-pr-maintainer> <push-pr-repo> <push-pr-pr-number>',
                'Mark a PR as pushed to client',
                argv => {
                    return argv
                        .positional('push-pr-maintainer', { desc: 'Maintainer username', type: 'string' })
                        .positional('push-pr-repo', { desc: 'Repository name', type: 'string' })
                        .positional('push-pr-pr-number', { desc: 'Pull request number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.pushPR(
                            actionInputs,
                            argv['push-pr-maintainer'],
                            argv['push-pr-repo'],
                            argv['push-pr-pr-number']
                        )
                    )
                }
            )
            .command(
                'merge-pr <merge-pr-maintainer> <merge-pr-repo> <merge-pr-pr-number>',
                'Mark a PR as merged by client',
                argv => {
                    return argv
                        .positional('merge-pr-maintainer', { desc: 'Maintainer username', type: 'string' })
                        .positional('merge-pr-repo', { desc: 'Repository name', type: 'string' })
                        .positional('merge-pr-pr-number', { desc: 'Pull request number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.mergePr(
                            actionInputs,
                            argv['merge-pr-maintainer'],
                            argv['merge-pr-repo'],
                            argv['merge-pr-pr-number']
                        )
                    )
                }
            )
            .command(
                'close-pr <close-pr-maintainer> <close-pr-repo> <close-pr-pr-number>',
                'Mark a PR as discontinued (closed)',
                argv => {
                    return argv
                        .positional('close-pr-maintainer', { desc: 'Maintainer username', type: 'string' })
                        .positional('close-pr-repo', { desc: 'Repository name', type: 'string' })
                        .positional('close-pr-pr-number', { desc: 'Pull request number', type: 'number' })
                },
                async argv => {
                    return loadActionInputs(argv.env, ({ actionInputs }) =>
                        openSource.closePR(
                            actionInputs,
                            argv['close-pr-maintainer'],
                            argv['close-pr-repo'],
                            argv['close-pr-pr-number']
                        )
                    )
                }
            )
            .command(
                'setup-workflow [dir]',
                'Setup git-slice-open-source Github Actions',
                argv => {
                    return argv.positional('dir', { desc: 'Repo directory', type: 'string', default: '.' })
                },
                async argv => {
                    await openSource.setupWorkflow(argv['dir'])
                }
            )
    })
    .parseAsync()
