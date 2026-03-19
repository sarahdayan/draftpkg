export interface CiConfig {
  installCommand: string | false;
  buildCommand: string | false;
  packages: string[];
  publishDirectory: Record<string, string>;
  node: string;
}

export interface BuildCommitUrlParams {
  baseUrl: string;
  org: string;
  repo: string;
  sha: string;
  packageName: string;
}

export interface ParsedRegistryUrl {
  org: string;
  repo: string;
  sha: string;
  packageName: string;
}
