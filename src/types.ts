export interface ParsedInputData {
  redoclyOrgSlug: string;
  redoclyProjectSlug: string;
  redoclyDomain: string;
  files: string[];
  mountPath: string;
  maxExecutionTime: number;
  redoclyConfigPath?: string;
}

export interface ParsedEventData {
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
