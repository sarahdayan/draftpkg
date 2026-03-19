import { beforeEach, describe, expect, it } from "vitest";

import type { CommentOptions, GitHubClient, GitHubComment } from "../comment";
import { postPrComment } from "../comment";

const MARKER = "<!-- draftpkg -->";

const defaultOptions: CommentOptions = {
  org: "algolia",
  repo: "instantsearch",
  prNumber: 42,
  sha: "abc123",
  workerUrl: "https://pkg.example.com",
  packageNames: ["algoliasearch-helper"],
};

describe("postPrComment", () => {
  let github: ReturnType<typeof createFakeGitHubClient>;

  beforeEach(() => {
    github = createFakeGitHubClient();
  });

  it("creates a comment with install URLs", async () => {
    await postPrComment(defaultOptions, github);

    expect(github.createdComments).toHaveLength(1);
    expect(github.createdComments[0]!.body).toContain(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/algoliasearch-helper",
    );
  });

  it("includes all packages in the comment", async () => {
    await postPrComment(
      {
        ...defaultOptions,
        packageNames: ["@algolia/client-search", "@algolia/recommend"],
      },
      github,
    );

    const body = github.createdComments[0]!.body;

    expect(body).toContain("@algolia/client-search");
    expect(body).toContain("@algolia/recommend");
  });

  it("includes a hidden marker for identification", async () => {
    await postPrComment(defaultOptions, github);

    expect(github.createdComments[0]!.body).toContain(MARKER);
  });

  it("updates an existing comment instead of creating a new one", async () => {
    github = createFakeGitHubClient([
      { id: 99, body: `${MARKER}\nold comment` },
    ]);

    await postPrComment(defaultOptions, github);

    expect(github.createdComments).toHaveLength(0);
    expect(github.updatedComments).toHaveLength(1);
    expect(github.updatedComments[0]!.commentId).toBe(99);
    expect(github.updatedComments[0]!.body).toContain("abc123");
  });

  it("includes the commit SHA in the comment", async () => {
    await postPrComment(defaultOptions, github);

    expect(github.createdComments[0]!.body).toContain("abc123");
  });
});

interface CreatedComment {
  org: string;
  repo: string;
  prNumber: number;
  body: string;
}

interface UpdatedComment {
  org: string;
  repo: string;
  commentId: number;
  body: string;
}

function createFakeGitHubClient(
  existingComments: GitHubComment[] = [],
): GitHubClient & {
  createdComments: CreatedComment[];
  updatedComments: UpdatedComment[];
} {
  const createdComments: CreatedComment[] = [];
  const updatedComments: UpdatedComment[] = [];

  return {
    createdComments,
    updatedComments,
    async listComments(org, repo, prNumber) {
      return existingComments;
    },
    async createComment(org, repo, prNumber, body) {
      createdComments.push({ org, repo, prNumber, body });
    },
    async updateComment(org, repo, commentId, body) {
      updatedComments.push({ org, repo, commentId, body });
    },
  };
}
