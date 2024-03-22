import * as core from '@actions/core'
import * as github from '@actions/github'
import { handlePush } from '@redocly/cli/lib/cms/commands/push'
import { handlePushStatus } from '@redocly/cli/lib/cms/commands/push-status'

export async function run(): Promise<void> {
  try {
    console.log('Action started!')

    console.log('Parsing params...')

    const rOrganization = core.getInput('organization')
    const rProject = core.getInput('project')
    const rDomain = core.getInput('domain') || 'https://app.cloud.redocly.com'
    const files = core.getInput('files').split(' ')
    const moundPath = core.getInput('mountPath')
    const maxExecutionTime = Number(core.getInput('maxExecutionTime')) || 20000

    const namespace = github.context.payload?.repository?.owner?.login
    const repository = github.context.payload?.repository?.name

    const branch = github.context.ref.split('/').pop() as string
    const defaultBranch: string =
      github.context.payload?.repository?.default_branch ||
      github.context.payload?.repository?.master_branch

    const headCommit = github.context.payload?.head_commit
    const commitMessage = headCommit?.message
    const commitSha = headCommit?.id
    const commitUrl = headCommit?.url
    const commitAuthor = `${headCommit?.author?.name} <${headCommit?.author?.email}>`
    const commitCreatedAt = headCommit?.timestamp

    console.log('Push params', {
      redocly: {
        rOrganization,
        rProject,
        rDomain
      },
      namespace,
      repository,
      branch,
      defaultBranch,
      commit: {
        commitMessage,
        commitSha,
        commitUrl,
        commitAuthor,
        commitCreatedAt
      },
      files,
      moundPath,
      maxExecutionTime
    })

    const pushData = await handlePush(
      {
        organization: rOrganization,
        project: rProject,
        domain: rDomain,
        namespace,
        repository,
        branch,
        'default-branch': defaultBranch,
        message: commitMessage,
        'commit-sha': commitSha,
        'commit-url': commitUrl,
        author: commitAuthor,
        'created-at': commitCreatedAt,
        'mount-path': moundPath,
        files,
        'max-execution-time': maxExecutionTime
      },
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      {} as any // TODO: pass config
    )

    if (pushData) {
      console.log('Push data:', pushData)
      const handlePushStatusData = await handlePushStatus(
        {
          organization: rOrganization,
          project: rProject,
          pushId: pushData.pushId,
          domain: rDomain,
          'max-execution-time': maxExecutionTime
        },
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        {} as any // TODO: pass config
      )
      console.log('handlePushStatusData:', handlePushStatusData)
      core.setOutput('pushId', pushData.pushId)
    }

    console.log('Action finished!')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
