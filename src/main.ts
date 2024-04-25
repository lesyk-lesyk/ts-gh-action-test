import * as core from '@actions/core';

import { handlePush } from '@redocly/cli/lib/cms/commands/push';
import { handlePushStatus } from '@redocly/cli/lib/cms/commands/push-status';

import { setCommitStatuses } from './set-commit-statuses';
import { getRedoclyConfig, parseEventData, parseInputData } from './helpers';

export async function run(): Promise<void> {
  try {
    const inputData = parseInputData();
    const ghEvent = parseEventData();

    // eslint-disable-next-line no-console
    console.debug('Push arguments', {
      inputData,
      ghEvent
    });

    const config = await getRedoclyConfig(inputData.redoclyConfigPath);

    if (
      !ghEvent.branch ||
      !ghEvent.defaultBranch ||
      !ghEvent.commit.commitMessage ||
      !ghEvent.commit.commitSha ||
      !ghEvent.commit.commitAuthor ||
      !ghEvent.namespace ||
      !ghEvent.repository
    ) {
      throw new Error('Invalid GitHub event data');
    }

    const pushData = await handlePush(
      {
        domain: inputData.redoclyDomain,
        organization: inputData.redoclyOrgSlug,
        project: inputData.redoclyProjectSlug,
        'mount-path': inputData.mountPath,
        files: inputData.files,
        'max-execution-time': inputData.maxExecutionTime,
        namespace: ghEvent.namespace,
        repository: ghEvent.repository,
        branch: ghEvent.branch,
        'default-branch': ghEvent.defaultBranch,
        message: ghEvent.commit.commitMessage,
        'commit-sha': ghEvent.commit.commitSha,
        'commit-url': ghEvent.commit.commitUrl,
        author: ghEvent.commit.commitAuthor,
        'created-at': ghEvent.commit.commitCreatedAt
      },
      config
    );

    if (!pushData?.pushId) {
      throw new Error('Missing push ID');
    }

    const pushStatusData = await handlePushStatus(
      {
        organization: inputData.redoclyOrgSlug,
        project: inputData.redoclyProjectSlug,
        pushId: pushData.pushId,
        domain: inputData.redoclyDomain,
        wait: true,
        'continue-on-deploy-failures': true,
        'max-execution-time': inputData.maxExecutionTime,
        onRetry: async lastResult => {
          try {
            setCommitStatuses({
              data: lastResult,
              owner: ghEvent.namespace!, // TODO: remove the `!` operator
              repo: ghEvent.repository!, // TODO: remove the `!` operator
              commitId: ghEvent.commit.commitSha! // TODO: remove the `!` operator
            });
          } catch (error: unknown) {
            core.error(
              `Failed to set commit statuses. Error: ${(error as Error)?.message}`
            );
          }
        }
      },
      config
    );

    if (!pushStatusData) {
      throw new Error('Missing push status data');
    }

    await setCommitStatuses({
      data: pushStatusData,
      owner: ghEvent.namespace,
      repo: ghEvent.repository,
      commitId: ghEvent.commit.commitSha
    });

    core.setOutput('pushId', pushData.pushId);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
