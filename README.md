# git-slice-tools

This utility can be used to take out folder(s) from a git repository, fork it into a new git repository and eventually provide commands to sync changes between both repositories.

A new version of git-slice, super high performance and more features.

## Environment variables

| Name                                     | Description                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GIT_SLICE_UPSTREAM_REPO_DIR`            | Relation/absolute path to directory which contains upstream source                                                                                                                         |
| `GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH` | Name of default branch of upstream repo                                                                                                                                                    |
| `GIT_SLICE_UPSTREAM_REPO_USERNAME`       | Username for git authentication and commit details on upstream repo                                                                                                                        |
| `GIT_SLICE_UPSTREAM_REPO_EMAIL`          | User email for git authentication and commit details on upstream repo                                                                                                                      |
| `GIT_SLICE_UPSTREAM_REPO_PASSWORD`       | Personal Access Token for git authentication on upstream repo                                                                                                                              |
| `GIT_SLICE_UPSTREAM_REPO_URL`            | Http git url of upstream repo, should be in this format : https://github.com/GitStartHQ/client-sourcegraph.git                                                                             |
| `GIT_SLICE_OPEN_SOURCE_FLOW`             | (`true` or `false`). Default is `false`. Set `true` if you want to use opensource flow                                                                                                     |
| `GIT_SLICE_OPEN_SOURCE_URL`              | Http git url of the opensource repo, should be in this format : https://github.com/sourcegraph/sourcegraph.git                                                                             |
| `GIT_SLICE_SLICE_REPO_DIR`               | Relation/absolute path to directory which contains slice source                                                                                                                            |
| `GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH`    | Name of default branch of slice repo                                                                                                                                                       |
| `GIT_SLICE_SLICE_REPO_USERNAME`          | Username for git authentication and commit details on slice repo                                                                                                                           |
| `GIT_SLICE_SLICE_REPO_EMAIL`             | User email for git authentication and commit details on slice repo                                                                                                                         |
| `GIT_SLICE_SLICE_REPO_PASSWORD`          | Personal Access Token for git authentication on slice repo                                                                                                                                 |
| `GIT_SLICE_SLICE_REPO_URL`               | Http git url of slice repo, should be in this format : https://github.com/GitStartHQ/client-sourcegraph.git                                                                                |
| `GIT_SLICE_SLICE_IGNORES`                | Array of glob patterns which are used to ignore files when syncing changes between 2 repos. ex: `['.git-slice.json', 'dev/*']`                                                             |
| `GIT_SLICE_PUSH_BRANCH_NAME_TEMPLATE`    | Pattern for building branch name in upstream repo when pushing a branch in slice repo, git-slice-tools would replace `<branch_name>` with the name pushing branch. ex: `dev/<branch_name>` |
| `GIT_SLICE_PUSH_COMMIT_MSG_REGEX`        | Regular expression which is used to validate commit messages                                                                                                                               |
| `GIT_SLICE_FORCE_GIT_INIT`               | (`true` or `false`). Default is `true`. git-slice-tools would reset git configs in every run times                                                                                         |
| `GIT_SLICE_PR_LABELS`                    | Array of labels which git-slice-tools will add into new PR. Ex: ex: `["gitstart","team/frontend-platform"`                                                                                 |
| `GIT_SLICE_PR_DRAFT`                     | (`true` or `false`). Default is `true`. git-slice-tools would raise new PR as draft PR                                                                                                     |

Sample `.env` file

```
GIT_SLICE_SLICE_IGNORES='["internal-docs.md"]'
GIT_SLICE_PUSH_BRANCH_NAME_TEMPLATE='dev/<branch_name>'
GIT_SLICE_PUSH_COMMIT_MSG_REGEX='.*'
GIT_SLICE_FORCE_GIT_INIT=true

GIT_SLICE_UPSTREAM_REPO_DIR=/Users/gitstart/Projects/repos/gitstart-sourcegraph
GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH=main
GIT_SLICE_UPSTREAM_REPO_USERNAME=foobar
GIT_SLICE_UPSTREAM_REPO_EMAIL=foo.bar@git.com
GIT_SLICE_UPSTREAM_REPO_PASSWORD=<PAT>
GIT_SLICE_UPSTREAM_REPO_URL=https://github.com/GitStartHQ/gitstart-sourcegraph.git

GIT_SLICE_SLICE_REPO_DIR=/Users/gitstart/Projects/repos/sourcegraph-sourcegraph
GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH=main
GIT_SLICE_SLICE_REPO_USERNAME=jackjill
GIT_SLICE_SLICE_REPO_EMAIL=jack.fill@git.com
GIT_SLICE_SLICE_REPO_PASSWORD=<PAT>
GIT_SLICE_SLICE_REPO_URL=https://github.com/sourcegraph/sourcegraph.git

GIT_SLICE_PR_LABELS='["gitstart","team/frontend-platform"]'
GIT_SLICE_PR_DRAFT=true

GIT_SLICE_OPEN_SOURCE_FLOW=false
GIT_SLICE_OPEN_SOURCE_URL=https://github.com/sourcegraph/sourcegraph.git
```

## Development

To use `git-slice-tools` in dev mode, clone `git-slice-tools` repository

```bash
# Clone repository
git clone https://github.com/GitStartHQ/git-slice-tools

# Navigate to source code container folder
cd git-slice-tools

# yarn install
yarn

# Prepare environment variables in .env file from .env.example (Please update copied .env file before executing jobs)
cp .env.example .env

# Execute jobs
yarn <job_name> [...job_options] [--env <env_file_path>] [--help] [--version]
```

We don't recommend to use `nodemon` for development since it could effect production repositories. But in case you really want to use it you can use this form:

```bash
yarn dev --exec "yarn pull"
```

## Global CLI

You can install and use `git-slice-tools` globally

```bash
# Install package globally

# With yarn
yarn global add https://github.com/GitStartHQ/git-slice-tools

# With npm
npm install -g https://github.com/GitStartHQ/git-slice-tools

# Execute jobs
git-slice-tools <job_name> [...job_options] [--env <env_file_path>] [--help] [--version]
```

You can save all required environment variables in a text file and use `--env` param with its file path in every job execution, git-slice-tools will load environment variables from it, with this way you can use git-slice-tools global CLI with multiple projects without spending efforts on updating environment variables.

## Jobs

| Name          | Description                                                                                                                                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkout`    | Fetch `origin` and checkout default branch of both upstream and slice repos                                                                                                                                                                                                                                                             |
| `pull`        | Pull last changes from upstream repo into slice repo                                                                                                                                                                                                                                                                                    |
| `push`        | Push a branch in slice repo to upstream repo                                                                                                                                                                                                                                                                                            |
| `raise-pr`    | Raise new PR for branch on upstream repo (GitHub only) with details (title/body) from the PR for a branch on slice repo                                                                                                                                                                                                                 |
| `pull-branch` | Pull last changes of a branch from upstream repo into slice repo. The destination branch in slice repo has the pulling branch but with `upstream-*` prefix. Please note that this job uses `force-push` and the upstream should be updated to date with the default branch of upstream repo otherwise there would be some extra changes |
| `pull-review` | Pull a PR review from a PR on upstream repo into a PR on slice repo (GitHub only). Please note that if upstream review has comments on code, this job will throw errors if upstream and slice branches don't have the same changes                                                                                                      |
| `pull-issue`  | Pull an issue from upstream repo (or open source repo with `open source flow`) into slice repo (GitHub only)                                                                                                                                                                                                                            |

### Job `checkout`

No command arguments needed

```bash
yarn checkout

git-slice-tools checkout
```

Support `open source flow`

### Job `pull`

No command arguments needed

```bash
yarn pull

git-slice-tools pull
```

Support `open source flow`

### Job `push`

Command arguments

| Arg              | Description                               |
| ---------------- | ----------------------------------------- |
| `--branch` `-b`  | Name of pushing branch in slice repo      |
| `--message` `-m` | Commit message                            |
| `--force-push`   | Determine wether to use force push or not |

```bash
yarn push --branch dev-test --message "test: commit message" --force-push false

git-slice-tools push --branch dev-test --message "test: commit message" --force-push false
```

### Job `raise-pr`

Command arguments

| Arg             | Description                          |
| --------------- | ------------------------------------ |
| `--branch` `-b` | Name of pushing branch in slice repo |

```bash
yarn raise-pr --branch dev-test

git-slice-tools raise-pr --branch dev-test
```

Support `open source flow`

### Job `pull-branch`

Command arguments

| Arg             | Description                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--branch` `-b` | Name of pulling branch in upstream repo                                                                           |
| `--target` `-g` | Name of target branch in slice repo. If it's passed, git-slice will create a PR (target branch <- pulling branch) |

```bash
yarn pull-branch --branch dev-test

git-slice-tools pull-branch --branch dev-test
```

### Job `pull-review`

Command arguments

| Arg                | Description                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--pr-number`      | PR number on slice repo which you want to pull a review into                                                                                                                                                                                                                                |
| `--pr-review-link` | The link of pull request review you want to pull from, ex: https://github.com/sourcegraph/sourcegraph/pull/37919#pullrequestreview-1025518547 . Actually git-slice-tools only care about `/pull/<pull_id>#pullrequestreview-<review_id>` part for getting pull request number and review id |

```bash
yarn pull-review --pr-number 123 --pr-review-link https://github.com/sourcegraph/sourcegraph/pull/37919#pullrequestreview-1025518547

git-slice-tools pull-review --pr-number 123 --pr-review-link https://github.com/sourcegraph/sourcegraph/pull/37919#pullrequestreview-1025518547
```

Support `open source flow`

### Job `pull-issue`

Command arguments

| Arg      | Description                                             |
| -------- | ------------------------------------------------------- |
| `--from` | Number of the upstream issue you want to pull           |
| `--to`   | (optional) Number of the slice issue you want to update |

```bash
yarn pull-issue --from 123

yarn pull-issue --from 123 --to 332
```

Support `open source flow`

## Open source flow

In open source contribution, we slice a forked-repo of an open source and raise PRs on open source repo. `git-slice-tools` supports that flow, you just need to setup `GIT_SLICE_OPEN_SOURCE_FLOW=true` and
`GIT_SLICE_OPEN_SOURCE_URL=...` env variables.

In this flow:

- `pull` job will update forked-repo default branch with last version of that branch on open source repo,
- `raise-pr` job will create a PR on open source repo with `head` is a branch on forked-repo (upstream repo).
- `pull-issue` and `pull-review` will look for issues and reviews on open source repo.

## Use `git-slice-tools` in Github Action

You can setup `git-slice-tools` easily in Github Action by coping our prepared `git-slice.yml` file into your `.github/workflows` folder and correct the root `env:` object with your slice/upstream/opensource repo you want. It requires 3 extra secret variables:

| Name                                | Description                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GIT_SLICE_UPSTREAM_REPO_PASSWORD`  | it's PAT of the Github Account for upstream repo                                                                                                      |
| `GIT_SLICE_SLICE_REPO_PASSWORD`     | it's PAT of the Github Account for slice repo                                                                                                         |
| `GIT_SLICE_UPSTREAM_REPO_CACHE_KEY` | it's a key for caching a version of sourcecode of both upstream and slice repos. You should change it when you see it takes longer time for pull jobs |

A note about Github Account for slice repo, please make sure it has right permissions for force-push changes on default branch, we recommend to give it `admin` permission.

Once the setup is done, you can use `/git-slice ...` comments to trigger `git-slice-tools` jobs or use workflow dispatch if you want.

These are `/git-slice ...` command you can use in PR comments:

| Name                                                | Description                                                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/git-slice push -m "comment message" [-f] [-pr]`   | Push changes of current branch in slice repo to upstream repo                                         |
| `/git-slice pull-review -from "<pull review link>"` | Pull a review from upstream PR to slice PR. Please make sure you wrap the pull review link in `"..."` |

These are features you can trigger with using workflow dispatch in actions page, you can select the `job` you want:

| Name            | Description                                                                                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pull-a-branch` | this job will pull a branch from upstream repo into slice repo. If you set `Raise a PR to merge the pulled upstream branch into this branch` field, it will create a PR to merge it into a slice branch but you still need to review and merge the PR manually |
| `pull-an-issue` | this job will pull an issue from upstream repo into a new slice repo issue, if you set `Slice issue number to update` it will update the current one instead of creating a new one                                                                             |

## Ignore files in `pull` and `push` jobs

Env `GIT_SLICE_SLICE_IGNORES` is used for ignoring files in `pull` and `push` jobs, this configuration is defined in slice repo.

To allow upstream repos control this, `git-slice-tools` supports to load glob patterns from `.gitsliceignore` file from upstream repo from version 1.2.0.

Please note that `.gitsliceignore` file will be ignored in `push` job which means that only upstream repo can make changes on that file.

Example:

```
# .gitsliceignore
third-party-licenses

ui

# We still need this file
!ui/**/.gitignore
```

## Projects are using `git-slice-tools` instead of `git-slice` from engine team

These are list of projects which are using `git-slice-tools` instead of `git-slice` from engine

- [HelloAlice - Mad Hatter instance](https://github.com/GitStartHQ/client-helloalice-mad-hatter) - @davidokonji
- [Appsmith - Opensource Instance](https://github.com/GitStartHQ/client-appsmith) - @BikashSah999
- [Cypress - Opensource Instance](https://github.com/GitStartHQ/cypress) - @raph941
- [SourceGraph - Front-end instance](https://github.com/GitStartHQ/client-sourcegrapph-gitslice-test) - @raph941
- [SourceGraph - Opensource front-end instance](https://github.com/GitStartHQ/client-sourcegraph) @raph941
- [SourceGraph - Opensource back-end instance](https://github.com/GitStartHQ/client-sourcegaph-devx-oss) @Valentine-Mario

## Contributions

This project works well with these features but we need more hands to make it stable and better with tests covering, docker image and K8S supports. We greatly appreciate all your PRs to resolve them. If you want to have an onboarding tour, let's ping @phunguyenmurcul, this nice guy (me) would help you to understand the project quickly.

## Future jobs

| Job                            | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| GitStart dashboard integration | Support GitStart authentication and fetching repos details from dashboard |
