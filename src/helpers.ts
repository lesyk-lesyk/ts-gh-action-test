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

export function parseEventData(): ParsedEventData {
  console.log('>>> github.context', github.context);
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
