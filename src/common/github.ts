import { Octokit } from 'octokit'
import { IssueOSSData, IssueTimelineEvent, ProjectManagerView, ProjectV2Field } from '../types'
import { OPEN_SOURCE_FIELDS, OPEN_SOURCE_PROJECT_FIELD_TYPES } from './constants'
import { logExtendLastLine, logWriteLine } from './logger'

export const getProjectManagerViewInfo = (link: string): ProjectManagerView => {
    const regexResult = /https:\/\/github\.com\/orgs\/([^/.*]+)\/projects\/(\d+)\/views\/(\d+)/gi.exec(link)

    if (regexResult == null) {
        throw new Error(`Invalid project view link: ${link}`)
    }
    const [, owner, projectId, viewId] = regexResult

    return {
        org: owner,
        projectNumber: +projectId,
        viewNumber: +viewId,
    }
}

export const getProjectV2 = async (
    octokit: Octokit,
    organization: string,
    projectNumber: number
): Promise<{ projectId: string }> => {
    logWriteLine('OpenSource', `Getting project...`)

    const {
        organization: {
            projectV2: { id: projectId },
        },
    } = await octokit.graphql<{ organization: { projectV2: { id: string } } }>(
        `
        query($organization: String!, $projectNumber: Int!) {
          organization(login: $organization) {
            projectV2(number: $projectNumber) {
              id
            }
          }
        }
        `,
        {
            organization,
            projectNumber,
        }
    )

    logExtendLastLine(`Project Id: ${projectId}`)

    return { projectId }
}

export const getPullRequest = async (
    octokit: Octokit,
    organization: string,
    repoName: string,
    prNumber: number
): Promise<{ prId: string; linkedIssues: { issueId: string; issueNumber: number }[] }> => {
    logWriteLine('OpenSource', `Getting pull request...`)

    const {
        repository: {
            pullRequest: {
                prId,
                closingIssuesReferences: { nodes: linkedIssues },
            },
        },
    } = await octokit.graphql<{
        repository: {
            pullRequest: {
                prId: string
                closingIssuesReferences: { nodes: { issueId: string; issueNumber: number }[] }
            }
        }
    }>(
        `
        query($repoName: String!, $organization: String!, $prNumber: Int!) {
          repository(name: $repoName, owner: $organization) {
            pullRequest(number: $prNumber) {
              prId: id
              closingIssuesReferences(first: 20) {
                nodes {
                  issueId: id
                  issueNumber: number
                }
              }
            }
          }
        }
        `,
        {
            organization,
            repoName,
            prNumber,
        }
    )

    logExtendLastLine(`PR Id: ${prId}`)

    return { prId, linkedIssues }
}

export const getIssue = async (
    octokit: Octokit,
    organization: string,
    repoName: string,
    issueNumber: number
): Promise<{ issueId: string; issueAddedBy: string }> => {
    logWriteLine('OpenSource', `Getting issue...`)

    let issueAddedBy = ''

    const {
        repository: {
            issue: {
                id: issueId,
                body: issueBody,
                author: { login: issueCreator },
            },
        },
    } = await octokit.graphql<{ repository: { issue: { id: string; body: string; author: { login: string } } } }>(
        `
        query($repoName: String!, $organization: String!, $issueNumber: Int!) {
          repository(name: $repoName, owner: $organization) {
            issue(number: $issueNumber) {
              id
              body
              author {
                login
              }
            }
          }
        }
        `,
        {
            organization,
            repoName,
            issueNumber,
        }
    )

    const creatorExecResult = /^<!-- @(.*) -->/g.exec(issueBody)

    if (creatorExecResult && creatorExecResult[1]) {
        issueAddedBy = creatorExecResult[1]
    } else {
        issueAddedBy = issueCreator
    }

    logExtendLastLine(`Issue Id: ${issueId}`)

    return { issueId, issueAddedBy }
}

export const getIssueRelatedPRs = async (
    octokit: Octokit,
    issueId: string
): Promise<{ prId: string; prNumber: number }[]> => {
    const issueReferencedSubjectFragment = `
      __typename
      ... on Issue {
        title
        id
        itemNumber: number
      }
      ... on PullRequest {
        title
        id
        itemNumber: number
      }
    `

    const issueEventFragment = `
      source {
        ${issueReferencedSubjectFragment}
      }
      subject {
        ${issueReferencedSubjectFragment}
      }
    `

    const {
        node: {
            timelineItems: { nodes: issueTimelineEvents },
        },
    } = await octokit.graphql<{
        node: { timelineItems: { nodes: IssueTimelineEvent[] } }
    }>(
        `
        query($issueId: ID!, $timelineItemTypes: [IssueTimelineItemsItemType!]!) {
          node(id: $issueId) {
            ... on Issue {
              timelineItems(first: 20, itemTypes: $timelineItemTypes) {
                nodes {
                  __typename
                  ... on ConnectedEvent {
                    ${issueEventFragment}
                  }
                  ... on DisconnectedEvent {
                    ${issueEventFragment}
                  }
                }
              }
            }
          }
        }
        `,
        {
            issueId,
            timelineItemTypes: ['CONNECTED_EVENT', 'DISCONNECTED_EVENT'],
        }
    )

    const connectedPRs: Record<string, { prId: string; prNumber: number }> = {}

    for (const issueTimelineEvent of issueTimelineEvents) {
        if (
            issueTimelineEvent.__typename === 'ConnectedEvent' &&
            issueTimelineEvent.subject.__typename === 'PullRequest'
        ) {
            connectedPRs[issueTimelineEvent.subject.id] = {
                prId: issueTimelineEvent.subject.id,
                prNumber: issueTimelineEvent.subject.itemNumber,
            }
            continue
        }
        if (
            issueTimelineEvent.__typename === 'DisconnectedEvent' &&
            issueTimelineEvent.subject.__typename === 'PullRequest'
        ) {
            delete connectedPRs[issueTimelineEvent.subject.id]
            continue
        }
    }

    return Object.values(connectedPRs)
}

export const getIssueOSSData = async (
    octokit: Octokit,
    issueId: string
): Promise<{ issueId: string; itemId: string } | null> => {
    logWriteLine('OpenSource', `Checking for OSS data comment...`)

    const {
        node: {
            comments: { nodes: issueComments },
        },
    } = await octokit.graphql<{ node: { comments: { nodes: { body: string }[] } } }>(
        `
        query($issueId: ID!) {
          node(id: $issueId) {
            ... on Issue {
              comments(first: 10) {
                nodes {
                  ... on IssueComment {
                    body
                  }
                }
              }
            }
          }
        }
        `,
        {
            issueId,
        }
    )

    const ossDataComment = issueComments.find(x => x.body.startsWith('OSS data:'))

    if (ossDataComment) {
        logExtendLastLine(`Found OSS data comment. `)

        logWriteLine('OpenSource', `Issue has already existed in OSS table`)

        const fields = ['itemId', 'issueId']
        const lines = ossDataComment.body.split(/\r?\n/g)
        const data = lines
            .map(line => new RegExp(`- (${fields.join('|')}): (.*)$`, 'g').exec(line.trim()))
            .filter(Boolean)
            .map(x => ({ key: x[1], value: x[2] }))
            .reduce((prev, current) => {
                return {
                    ...prev,
                    [current.key]: current.value,
                }
            }, {})

        return data as IssueOSSData
    } else {
        logExtendLastLine(`OSS data comment not found`)
    }

    return null
}

export const getProjectFields = async (octokit: Octokit, projectId: string): Promise<ProjectV2Field[]> => {
    logWriteLine('OpenSource', `Loading all project fields...`)

    const {
        node: {
            fields: { nodes: projectAllFields },
        },
    } = await octokit.graphql<{
        node: { fields: { nodes: ProjectV2Field[] } }
    }>(
        `
        query($projectId: ID!) {
          node(id: $projectId) {
            ... on ProjectV2 {
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
        `,
        {
            projectId,
        }
    )

    logExtendLastLine(`Done!`)

    return projectAllFields
}

export const updateIssueFieldValue = async (
    octokit: Octokit,
    projectId: string,
    itemId: string,
    fieldId: string,
    type: keyof typeof OPEN_SOURCE_PROJECT_FIELD_TYPES,
    value: string | number
): Promise<void> => {
    const fieldValue = type === 'Number' ? +value : value
    const inputValueProp = OPEN_SOURCE_PROJECT_FIELD_TYPES[type]
    const fieldValueTypeAnnotation = type === 'Number' ? 'Float!' : 'String!'

    await octokit.graphql(
        `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $fieldValue: ${fieldValueTypeAnnotation}) {
          updateProjectV2ItemFieldValue(
            input: {
              projectId: $projectId,
              itemId: $itemId,
              fieldId: $fieldId,
              value: { 
                ${inputValueProp}: $fieldValue
              }
            }
          ) {
            projectV2Item {
              id
            }
          }
        }
        `,
        {
            projectId,
            itemId,
            fieldId,
            fieldValue,
        }
    )
}

export const isMaintainerOfRepo = async (
    octokit: Octokit,
    organization: string,
    repoName: string,
    member: string
): Promise<boolean> => {
    logWriteLine('OpenSource', `Checking maintainer...`)

    const {
        repository: {
            collaborators: { edges: collabEdges, nodes: collabNodes },
        },
    } = await octokit.graphql<{
        repository: { collaborators: { edges: { permission: string }[]; nodes: { login: string }[] } }
    }>(
        `
        query($repoName: String!, $owner: String!, $member: String!) {
          repository(name: $repoName, owner: $owner) {
            collaborators(first: 20, query: $member) {
              edges {
                permission
              }
              nodes {
                id
                login
                name
              }
            }
          }
        }
        `,
        {
            owner: organization,
            repoName,
            member,
        }
    )

    if (collabEdges.length === 0 || collabNodes.length === 0) {
        logExtendLastLine(`'${member}' doesn't belong to '${repoName}' repository`)
        return false
    }

    const collabNodeIdx = collabNodes.findIndex(x => x.login === member)

    if (collabNodeIdx < 0 || !['ADMIN', 'MAINTAIN'].includes(collabEdges[collabNodeIdx]?.permission)) {
        logExtendLastLine(`'${member}' isn't a maintainer of '${repoName}' repo`)
        return false
    }

    return true
}

export const isMemberOfTeam = async (
    octokit: Octokit,
    organization: string,
    team: string,
    member: string
): Promise<boolean> => {
    logWriteLine('OpenSource', `Checking member in team...`)

    const response = await octokit.graphql<{
        organization: { team?: { name: string; members: { nodes: { id: string; login: string; name: string }[] } } }
    }>(
        `
        query($organization: String!, $team: String!, $member: String!) {
          organization(login: $organization) {
            team(slug: $team) {
              name
              slug
              members(first: 10, query: $member) {
                nodes {
                  id
                  login
                  name
                }
              }
            }
          }
        }
        `,
        {
            organization,
            team,
            member,
        }
    )

    const isInMember = Boolean(response.organization.team?.members.nodes?.some(x => x.login === member))

    logExtendLastLine(isInMember ? `In team` : `Not in team`)

    return isInMember
}

export const getCurrentIssueStatusOfProjectItem = async (octokit: Octokit, itemId: string): Promise<string> => {
    logWriteLine('OpenSource', `Checking current status of issue on OSS project table...`)

    const {
        node: {
            fieldValueByName: { name: currentStatus },
        },
    } = await octokit.graphql<{
        node: { fieldValueByName: { name: string } }
    }>(
        `
        query($itemId: ID!, $fieldName: String!) {
          node(id: $itemId) {
            ... on ProjectV2Item {
              fieldValueByName(name: $fieldName) {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                }
              }
            }
          }
        }
        `,
        {
            itemId,
            fieldName: OPEN_SOURCE_FIELDS.Status,
        }
    )

    logExtendLastLine(`Current status: ${currentStatus}`)

    return currentStatus
}

export const closePR = async (octokit: Octokit, pullRequestId: string, prNumber: number): Promise<void> => {
    logWriteLine('OpenSource', `Closing PR #${prNumber}...`)

    await octokit.graphql(
        `
            mutation($pullRequestId: ID!) {
              closePullRequest(
                input: {
                  pullRequestId: $pullRequestId
                }
              ) {
                clientMutationId
              }
            }
            `,
        {
            pullRequestId,
        }
    )

    logExtendLastLine(`Done`)
}

export const closeIssue = async (octokit: Octokit, issueId: string, completed = false): Promise<void> => {
    logWriteLine('OpenSource', `Closing issue...`)
    await octokit.graphql(
        `
        mutation($issueId: ID!, $stateReason: IssueClosedStateReason!) {
          closeIssue(
            input: {
              issueId: $issueId,
              stateReason: $stateReason
            }
          ) {
            clientMutationId
          }
        }
        `,
        {
            issueId,
            stateReason: completed ? 'COMPLETED' : 'NOT_PLANNED',
        }
    )
    logExtendLastLine(`Done!`)
}

export const addComment = async (octokit: Octokit, subjectId: string, body: string): Promise<void> => {
    await octokit.graphql(
        `
        mutation($body: String!, $subjectId: ID!) {
          addComment(
            input: {
              subjectId: $subjectId,
              body: $body
            }
          ) {
            clientMutationId
          }
        }
        `,
        {
            subjectId,
            body,
        }
    )
}
