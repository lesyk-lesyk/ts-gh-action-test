import * as core from '@actions/core'
import * as github from '@actions/github'
import { handlePush } from '@redocly/cli/lib/cms/commands/push'
import { handlePushStatus } from '@redocly/cli/lib/cms/commands/push-status'

export async function run(): Promise<void> {
  try {
    console.log('Action started!')

    const organization = core.getInput('organization')
    const project = core.getInput('project')
    const domain = core.getInput('domain')

    // Get the JSON webhook payload for the event that triggered the workflow
    const context = JSON.stringify(github.context, undefined, 2)

    console.log(`The event context: ${context}`)

    const pushData = await handlePush(
      {
        organization,
        namespace: 'default',
        domain,
        project,
        'default-branch': 'main',
        branch: 'main',
        'mount-path': 'docs',
        'commit-sha': '1234567890abcdef',
        'commit-url': '',
        author: 'github-actions',
        message: 'Update docs',
        repository: '',
        files: ['docs/**/*'],
        'max-execution-time': 1000
      },
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      {} as any // TODO: pass config
    )

    if (pushData) {
      const handlePushStatusData = await handlePushStatus(
        {
          organization,
          project,
          pushId: pushData.pushId,
          domain,
          'max-execution-time': 1000
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
