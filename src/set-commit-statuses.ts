import * as core from '@actions/core';
import * as github from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import { DeploymentStatus } from '@redocly/cli/lib/cms/api/types';
import { PushStatusSummary } from '@redocly/cli/lib/cms/commands/push-status';

export async function setCommitStatuses({
  data,
  owner,
  repo,
  commitId,
  organizationSlug,
  projectSlug,
  disableCommitStatusPrefix,
  customCommitStatusPrefix
}: {
  data: PushStatusSummary;
  owner: string;
  repo: string;
  commitId: string;
  organizationSlug: string;
  projectSlug: string;
  disableCommitStatusPrefix: boolean;
  customCommitStatusPrefix?: string;
}): Promise<void> {
  const defaultPrefix = `${organizationSlug}/${projectSlug}`;
  const prefixDelimiter = ' - ';
  const statusPrefix = disableCommitStatusPrefix
    ? ''
    : `${customCommitStatusPrefix || defaultPrefix}${prefixDelimiter}`;

  const githubToken = core.getInput('githubToken');
  const octokit = github.getOctokit(githubToken);

  if (data?.preview) {
    await octokit.rest.repos.createCommitStatus({
      owner,
      repo,
      sha: commitId,
      state: mapDeploymentStateToGithubCommitState(data.preview.status),
      target_url: data.preview.url,
      context: `${statusPrefix}Preview`
    });
  }

  if (data?.preview?.scorecard) {
    // TBD: Should we add a concurrency limit here to avoid hitting rate limits?
    await Promise.all(
      data.preview.scorecard.map(async scorecard => {
        await octokit.rest.repos.createCommitStatus({
          owner,
          repo,
          sha: commitId,
          state: mapDeploymentStateToGithubCommitState(scorecard.status),
          target_url: scorecard.url,
          context: `${statusPrefix}${scorecard.name}`,
          description: scorecard.description
        });
      })
    );
  }

  if (data?.production) {
    await octokit.rest.repos.createCommitStatus({
      owner,
      repo,
      sha: commitId,
      state: mapDeploymentStateToGithubCommitState(data.production.status),
      target_url: data.production.url,
      context: `${statusPrefix}Production`
    });
  }

  // Q1: Do we need scorecard for preview and production?
  // Q2: Do we need prefix for scorecard?
  if (data?.production?.scorecard) {
    // TBD: Should we add a concurrency limit here to avoid hitting rate limits?
    await Promise.all(
      data.production.scorecard.map(async scorecard => {
        await octokit.rest.repos.createCommitStatus({
          owner,
          repo,
          sha: commitId,
          state: mapDeploymentStateToGithubCommitState(scorecard.status),
          target_url: scorecard.url,
          context: `${statusPrefix}${scorecard.name}`,
          description: scorecard.description
        });
      })
    );
  }
}

function mapDeploymentStateToGithubCommitState(
  state?: DeploymentStatus
): RestEndpointMethodTypes['repos']['createCommitStatus']['parameters']['state'] {
  switch (state) {
    case 'pending':
    case 'running':
      return 'pending';
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    default:
      throw new TypeError(`Unknown deployment state: ${state}`);
  }
}
