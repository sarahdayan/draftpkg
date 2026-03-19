import fs from "node:fs/promises";
import path from "node:path";

import { createGitHubClient } from "./github-client";
import { run } from "./index";

function required(name: string): string {
  const value = process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`];

  if (!value) {
    throw new Error(`Missing required input: ${name}`);
  }

  return value;
}

async function getPrNumber(): Promise<number | undefined> {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath) {
    return undefined;
  }

  try {
    const event = JSON.parse(await fs.readFile(eventPath, "utf-8"));

    return event.pull_request?.number ?? undefined;
  } catch {
    return undefined;
  }
}

const repoRoot = process.env.GITHUB_WORKSPACE ?? process.cwd();
const sha = process.env.INPUT_SHA || process.env.GITHUB_SHA;

if (!sha) {
  throw new Error(
    "Missing SHA: provide the `sha` input or run in a GitHub Actions environment",
  );
}

const [org, repo] = (
  process.env.GITHUB_REPOSITORY ?? required("repository")
).split("/");

const githubToken = process.env.GITHUB_TOKEN;
const prNumber = await getPrNumber();

run({
  repoRoot: path.resolve(repoRoot),
  workerUrl: required("worker-url"),
  apiKey: required("api-key"),
  org: org!,
  repo: repo!,
  sha,
  prNumber,
  github: githubToken ? createGitHubClient(githubToken) : undefined,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
