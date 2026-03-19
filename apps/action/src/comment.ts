export interface GitHubComment {
  id: number;
  body: string;
}

export interface GitHubClient {
  listComments(
    org: string,
    repo: string,
    prNumber: number,
  ): Promise<GitHubComment[]>;
  createComment(
    org: string,
    repo: string,
    prNumber: number,
    body: string,
  ): Promise<void>;
  updateComment(
    org: string,
    repo: string,
    commentId: number,
    body: string,
  ): Promise<void>;
}

export interface CommentOptions {
  org: string;
  repo: string;
  prNumber: number;
  sha: string;
  workerUrl: string;
  packageNames: string[];
}

export async function postPrComment(
  _options: CommentOptions,
  _github: GitHubClient,
): Promise<void> {
  throw new Error("Not implemented");
}
