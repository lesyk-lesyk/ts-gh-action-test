import path from 'path';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { handlePush } from '@redocly/cli/lib/cms/commands/push';
import { handlePushStatus } from '@redocly/cli/lib/cms/commands/push-status';
import { loadConfig } from '@redocly/openapi-core';
import { setCommitStatuses } from './set-commit-statuses';

export async function run(): Promise<void> {
  try {
    const inputData = parseInputData();
    const ghEvent = parseEventData();

    console.debug('Push arguments', {
      redocly: {
        redoclyOrgSlug: inputData.redoclyOrgSlug,
        redoclyProjectSlug: inputData.redoclyProjectSlug,
        redoclyDomain: inputData.redoclyDomain
      },
      github: ghEvent,
      pushParams: {
        files: inputData.files,
        mountPath: inputData.mountPath,
        maxExecutionTime: inputData.maxExecutionTime,
        configPath: inputData.configPath
      }
    });

    const config = await getRedoclyConfig(inputData.configPath);

    console.log('Config', config);

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
        organization: inputData.redoclyOrgSlug,
        project: inputData.redoclyProjectSlug,
        domain: inputData.redoclyDomain,
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

    if (pushData) {
      console.log('Push data:', pushData);
      const pushStatusData = await handlePushStatus(
        {
          organization: inputData.redoclyOrgSlug,
          project: inputData.redoclyProjectSlug,
          pushId: pushData.pushId,
          domain: inputData.redoclyDomain,
          'max-execution-time': inputData.maxExecutionTime,
          wait: true
        },
        config
      );

      console.log('pushStatusData', pushStatusData);

      if (!pushStatusData) {
        throw new Error('Missing push status data');
      }

      await setCommitStatuses({
        data: pushStatusData,
        owner: ghEvent.namespace,
        repo: ghEvent.repository,
        commitId: ghEvent.commit.commitSha,
        organizationSlug: inputData.redoclyOrgSlug,
        projectSlug: inputData.redoclyProjectSlug
      });

      core.setOutput('pushId', pushData.pushId);
    }

    console.log('Action finished!');
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

interface ParsedInputData {
  redoclyOrgSlug: string;
  redoclyProjectSlug: string;
  redoclyDomain: string;
  files: string[];
  mountPath: string;
  maxExecutionTime: number;
  configPath: string;
}

function parseInputData(): ParsedInputData {
  const redoclyOrgSlug = core.getInput('organization');
  const redoclyProjectSlug = core.getInput('project');
  const redoclyDomain =
    core.getInput('domain') || 'https://app.cloud.redocly.com';
  const files = core.getInput('files').split(' ');
  const mountPath = core.getInput('mountPath');
  const maxExecutionTime = Number(core.getInput('maxExecutionTime')) || 20000;
  const configPath = core.getInput('configPath');

  const absoluteFilePaths = files.map(_path =>
    path.join(process.env.GITHUB_WORKSPACE || '', _path)
  );

  return {
    redoclyOrgSlug,
    redoclyProjectSlug,
    redoclyDomain,
    files: absoluteFilePaths,
    mountPath,
    maxExecutionTime,
    configPath
  };
}

interface ParsedEventData {
  namespace?: string;
  repository?: string;
  branch?: string;
  defaultBranch?: string;
  commit: {
    commitMessage?: string;
    commitSha?: string;
    commitUrl?: string;
    commitAuthor?: string;
    commitCreatedAt?: string;
  };
}
function parseEventData(): ParsedEventData {
  const namespace = github.context.payload?.repository?.owner?.login;
  const repository = github.context.payload?.repository?.name;

  const branch = github.context.ref.split('/').pop();
  const defaultBranch: string | undefined =
    github.context.payload?.repository?.default_branch ||
    github.context.payload?.repository?.master_branch;

  const headCommit = github.context.payload?.head_commit;
  const commitMessage: string | undefined = headCommit?.message;
  const commitSha: string | undefined = headCommit?.id;
  const commitUrl: string | undefined = headCommit?.url;
  const commitAuthor: string | undefined =
    headCommit?.author?.name && headCommit?.author?.email
      ? `${headCommit?.author?.name} <${headCommit?.author?.email}>`
      : undefined;
  const commitCreatedAt: string | undefined = headCommit?.timestamp;

  return {
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
    }
  };
}

async function getRedoclyConfig(
  configPath: string | undefined
): ReturnType<typeof loadConfig> {
  const redoclyConfig = await loadConfig({
    configPath:
      configPath && process.env.GITHUB_WORKSPACE
        ? path.join(process.env.GITHUB_WORKSPACE, configPath)
        : undefined
  });

  return redoclyConfig;
}
