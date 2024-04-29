import path from 'path';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from '@redocly/openapi-core';
import { ParsedEventData, ParsedInputData } from './types';

export function parseInputData(): ParsedInputData {
  const redoclyOrgSlug = core.getInput('organization');
  const redoclyProjectSlug = core.getInput('project');
  const redoclyDomain =
    core.getInput('domain') || 'https://app.cloud.redocly.com';
  const files = core.getInput('files').split(' ');
  const mountPath = core.getInput('mountPath');
  const maxExecutionTime = Number(core.getInput('maxExecutionTime')) || 20000;
  const redoclyConfigPath = core.getInput('redoclyConfigPath');

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
    redoclyConfigPath
  };
}

export async function parseEventData(): Promise<ParsedEventData> {
  if (
    !(
      github.context.eventName === 'push' ||
      github.context.eventName === 'pull_request'
    )
  ) {
    throw new Error(
      'Unsupported GitHub event type. Only "push" and "pull_request" events are supported.'
    );
  }
  const namespace = github.context.payload?.repository?.owner?.login;
  const repository = github.context.payload?.repository?.name;

  if (!namespace || !repository) {
    throw new Error(
      'Invalid GitHub event data. Can not get owner or repository name from the event payload.'
    );
  }

  const branch =
    github.context.payload.pull_request?.['head']?.['ref'] ||
    github.context.ref.split('/').pop();

  if (!branch) {
    throw new Error(
      'Invalid GitHub event data. Can not get branch from the event payload.'
    );
  }

  const defaultBranch: string | undefined =
    github.context.payload?.repository?.default_branch ||
    github.context.payload?.repository?.master_branch;

  if (!defaultBranch) {
    throw new Error(
      'Invalid GitHub event data. Can not get default branch from the event payload.'
    );
  }

  const commitSha: string | undefined = github.context.payload.after;

  if (!commitSha) {
    throw new Error(
      'Invalid GitHub event data. Can not get commit sha from the event payload.'
    );
  }

  const githubToken = core.getInput('githubToken');
  const octokit = github.getOctokit(githubToken);

  const { data: commitData } = await octokit.rest.repos.getCommit({
    owner: namespace,
    repo: repository,
    ref: commitSha
  });

  const commit: ParsedEventData['commit'] = {
    commitSha,
    commitMessage: commitData.commit.message,
    commitUrl: commitData.html_url,
    commitAuthor: `${commitData.commit.author?.name} <${commitData.commit.author?.email}>`, // what about undefined name or email?
    commitCreatedAt: commitData.commit.author?.date
  };

  return {
    eventName: github.context.eventName,
    namespace,
    repository,
    branch,
    defaultBranch,
    commit
  };
}

export async function getRedoclyConfig(
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
