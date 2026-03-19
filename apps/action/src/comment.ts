import { buildCommitUrl } from "@draftpkg/config";

const MARKER = "<!-- draftpkg -->";

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
  options: CommentOptions,
  github: GitHubClient,
): Promise<void> {
  const body = buildCommentBody(options);

  const comments = await github.listComments(
    options.org,
    options.repo,
    options.prNumber,
  );

  const existing = comments.find((c) => c.body.includes(MARKER));

  if (existing) {
    await github.updateComment(options.org, options.repo, existing.id, body);
  } else {
    await github.createComment(
      options.org,
      options.repo,
      options.prNumber,
      body,
    );
  }
}

function buildCommentBody(options: CommentOptions): string {
  const rows = options.packageNames.map((name) => {
    const url = buildCommitUrl({
      baseUrl: options.workerUrl,
      org: options.org,
      repo: options.repo,
      sha: options.sha,
      packageName: name,
    });

    return `| \`${name}\` | \`npm install ${url}\` |`;
  });

  return [
    MARKER,
    "",
    "### Draftpkg",
    "",
    `Built from ${options.sha}`,
    "",
    "| Package | Install |",
    "|---|---|",
    ...rows,
  ].join("\n");
}
