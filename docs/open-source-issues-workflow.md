# Open source issues management in Github Project v2

## Setup Github Project V2

We need to create a new Github Project v2 with following custom fields:

1. `Status`
   Issue status field, type `Single select` with following options:
   |Options|Description|
   |--|--|
   |`Pending issue`||
   |`Issue rejected`||
   |`Issue approved`||
   |`In progress`||
   |`Ready for last review`||
   |`Ready to push upstream`||
   |`Changes requested`||
   |`Client review`||
   |`PR merged`||
   |`PR closed`||
1. `Credit estimate`
   Number of estimated credits, type `Number`
1. `Issue reviewer`
   Username of reviewer who reviewed the issue, type `Text`
1. `PR reviewer`
   Username of reviewer who reviewed the PR of issue, type `Text`
1. `Added by`
   Username of account who pulled the issue from upstream or issue creator, type `Text`
1. `Instance name`
   Name of open source instance which is configured in `git-slice-open-source.yml` file

## Setup workflow in repositories

### Script

```shell

# Install `git-slice-tools` globally

# With yarn
yarn global add https://github.com/GitStartHQ/git-slice-tools#v1.8.1

# With npm
npm install -g https://github.com/GitStartHQ/git-slice-tools#v1.8.1

# Navigate into local repository
cd client-cypress

# Execute setup script and follow instructions
git-slice-tools open-source setup-workflow

```

Example:

```shell

Setup git-slice-open-source workflow in this local repository: /Users/kentnguyen/Projects/client-sourcegraph
git-slice-open-source.yml already exists. Do you want to override it? (y/n) y
Loading template...
Please enter following inputs (enter 'q' to exit):
Name of open source instance: Cypress
Open source git url (Ex: https://github.com/cypress-io/cypress.git): https://github.com/cypress-io/cypress.git
Upstream repo (forked repo) git url (Ex: https://github.com/GitStartHQ/cypress.git): fasdfasdf
  Invalid 'Upstream repo (forked repo) git url', should be matched /^https:\/\/(github.com|gitlab.com)\/[\w-]+\/[\w-]+\.git$/i
Upstream repo (forked repo) git url (Ex: https://github.com/GitStartHQ/cypress.git): https://github.com/GitStartHQ/cypress.g
it
Upstream repo (forked repo) default branch: develop
Slice repo (internal repo) git url (Ex: https://github.com/GitStartHQ/client-cypress.git): https://github.com/GitStartHQ/cli
ent-cypress.git
Slice repo (internal repo) default branch: main
Writing git-slice-open-source.yml file with entered inputs...
  - GIT_SLICE_CHECKOUT_CACHED_KEY: abe89ff8-5e28-4e38-a4d8-a91042b06774
  - GIT_SLICE_OPEN_SOURCE_INSTANCE_NAME: Cypress
  - GIT_SLICE_OPEN_SOURCE_URL: https://github.com/cypress-io/cypress.git
  - GIT_SLICE_UPSTREAM_REPO_URL: https://github.com/GitStartHQ/cypress.git
  - GIT_SLICE_UPSTREAM_REPO_DEFAULT_BRANCH: develop
  - GIT_SLICE_SLICE_REPO_URL: https://github.com/GitStartHQ/client-cypress.git
  - GIT_SLICE_SLICE_REPO_DEFAULT_BRANCH: main
Done!
Please remember to:
  - Push '.github/workflows/git-slice-open-source.yml' file to default branch of slice repo.
  - Invite 'gitstart' (bot@gitstart.com) as a maintainer of both slice and upstream repos.

```

### Manually

Repo maintainers copy `git-slice-open-source.yml` into `.github/workflows` of repositories and complete all variables in `env:` section. Outside of [`git-slice-tools` env variables](../README.md#environment-variables), open source issues workflow requires 3 extra variables:

| Options                                          | Description                                                                                                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GIT_SLICE_OPEN_SOURCE_INSTANCE_NAME`            | Value of `Instance name` field when issues from this repo are added into project                                                                                                        |
| `GIT_SLICE_OPEN_SOURCE_MANAGER_PROJECT_VIEW`     | Link to open source project. Ex: https://github.com/orgs/GitStartHQ/projects/5/views/1. This should be the same for all open source instances - In `GitStart` uses an org secret for it |
| `GIT_SLICE_OPEN_SOURCE_TEAM_REVIEWING_COMMITTEE` | Name of `reviewing committee` Github team, it's required for checking permissions - In `GitStart` uses an org secret for it                                                             |

## Workflow

### Add new issues

When an issue is created (no matter it's created manually or via `git-slice-tools` `pull-issue` job), it's added into projects table with `Status=Pending issue` `Instance name=<configured instance name` `Added by=<issue creator|pull-issue job trigger`, also it leaves a comment to inform `reviewing committee` to review this new pending issue.

### Estimate credits

Devs can update credits estimate with leaving a comment in the issue with format `/open-source estimate <number of credits>`, this command will update the issue in projects table with `Credit estimate=<number of credits>`.

### Review issues

A member of `reviewing committee` team (reviewer) should review issues with `Status=Pending review` and give the descision:

#### Reject issues

Reviewer rejects an issue by adding label `oss/issue/reviewer-rejected`, this action:

- Update the issue on project table with `Status=Issue rejected` and `Issue reviewer=<reviewer>`.
- Leave a comment in the issue to inform maintainer.
- Close issue as not planned.

#### Approve issues

Reviewer approves an issue by adding label `oss/issue/reviewer-approved`, this action does:

- Update the issue on project table with `Status=Issue approved` and `Issue reviewer=<reviewer>`.
- Leave a comment in the issue to inform maintainer.

### Assign developers to issues

Maintainer assigns developers to an issue with `Status=Issue approved`, this action does:

- Update the issue in projects table with `Status=In progress`.

### Review pull requests

Devs start working on the `Status=In progress` issue, create a PR and link PR to issue (PR/Issue links are required).

Devs and repo maintainer continue internal PR review process, once the PR is in good state, maintainer adds label `oss/pr/ready-for-review` in the PR, this action does:

- Update the linked issue in projects table with `Status=Ready for last review`.
- Leave a comment to inform `reviewing committee` team to review the pull request.

Reviewers should review issues with `Status=Ready for last review` and give the descision in linked PRs:

#### Approve pull requests

Reviewer approves a PR by adding label `oss/pr/ready-to-push-upstream`, this action:

- Update the issue on project table with `Status=Ready to push upstream` and `PR reviewer=<reviewer>`.
- Leave a comment in the issue to inform maintainer.

#### Request changes pull requests

Reviewer requests changes in a PR and then add label `oss/pr/changes-requested`, this action:

- Update the issue in projects table with `Status=Changes requested` and `PR reviewer=<reviewer>`.
- Leave a comment in the issue to inform maintainer.

In this state, devs and maintainer continue the internal process to apply requested changes, maintainer can add `oss/pr/ready-for-review` back once the PR is good to re-review.

### Push PRs upstream

After pushed PRs upstream, maintainer should add label `oss/pr/pushed-to-client` in the PR. This action does:

- Update the linked issue in projects table with `Status=Client review`.

### Merge PRs

After client merged PRs, maintainer should add label `oss/pr/pr-merged` in the PR. This action does:

- Update the linked issue in projects table with `Status=PR merged`.
- Close the PR and the linked issue as completed.

### Close PRs

For some reasons we have to discontinue a PR, maintainer should add label `oss/pr/pr-closed` in the PR. This action does:

- Updates the linked issue in projects table with `Status=PR closed`.
- Close the PR and the linked issue as not planned.
