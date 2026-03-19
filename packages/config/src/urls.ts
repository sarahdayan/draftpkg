import type { BuildCommitUrlParams, ParsedRegistryUrl } from "./types";

export function buildCommitUrl(params: BuildCommitUrlParams): string {
  const base = params.baseUrl.replace(/\/+$/, "");

  return `${base}/${params.org}/${params.repo}/commit/${params.sha}/${params.packageName}`;
}

const COMMIT_URL_REGEXP =
  /^\/([^/]+)\/([^/]+)\/commit\/([^/]+)\/((?:@[^/]+\/)?[^/]+)$/;

export function parseRegistryUrl(path: string): ParsedRegistryUrl | null {
  const match = COMMIT_URL_REGEXP.exec(path);

  if (!match) {
    return null;
  }

  return {
    org: match[1]!,
    repo: match[2]!,
    sha: match[3]!,
    packageName: match[4]!,
  };
}
