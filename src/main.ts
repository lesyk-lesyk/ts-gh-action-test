import * as core from '@actions/core'
import { handlePushStatus } from '@redocly/cli/lib/cms/commands/push-status'

export async function run(): Promise<void> {
  try {
    console.log('Action started!')

    const organization = core.getInput('organization')
    const project = core.getInput('project')
    const pushId = core.getInput('pushId')
    const domain = core.getInput('domain')

    const handlePushStatusData = await handlePushStatus(
      {
        organization,
        project,
        pushId,
        domain,
        'max-execution-time': 1000
      },
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      {} as any // TODO: pass config
    )

    console.log('handlePushStatusData:', handlePushStatusData)
    console.log('Action finished!')

    core.setOutput('pushId', pushId)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
