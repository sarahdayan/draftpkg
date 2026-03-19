import { Octokit } from "@octokit/rest";

import type { GitHubClient } from "./comment";

export function createGitHubClient(token: string): GitHubClient {
  const octokit = new Octokit({ auth: token });

  return {
    async listComments(org, repo, prNumber) {
      const { data } = await octokit.issues.listComments({
        owner: org,
        repo,
        issue_number: prNumber,
      });

      return data.map((c) => ({ id: c.id, body: c.body ?? "" }));
    },

    async createComment(org, repo, prNumber, body) {
      await octokit.issues.createComment({
        owner: org,
        repo,
        issue_number: prNumber,
        body,
      });
    },

    async updateComment(org, repo, commentId, body) {
      await octokit.issues.updateComment({
        owner: org,
        repo,
        comment_id: commentId,
        body,
      });
    },
  };
}
