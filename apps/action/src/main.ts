import path from "node:path";

import { run } from "./index";

function required(name: string): string {
  const value = process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`];

  if (!value) {
    throw new Error(`Missing required input: ${name}`);
  }

  return value;
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

run({
  repoRoot: path.resolve(repoRoot),
  workerUrl: required("worker-url"),
  apiKey: required("api-key"),
  org: org!,
  repo: repo!,
  sha,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
