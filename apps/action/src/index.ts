import { buildCommitUrl } from "@draftpkg/config";

import { runBuild } from "./build";
import { createExecutor } from "./executor";
import { createHttpClient } from "./http-client";
import { loadConfig } from "./load-config";
import { packPackages } from "./pack";
import { resolvePackages } from "./resolve-packages";
import { uploadPackages } from "./upload";

export interface RunOptions {
  repoRoot: string;
  workerUrl: string;
  apiKey: string;
  org: string;
  repo: string;
  sha: string;
}

export async function run(options: RunOptions): Promise<void> {
  const { repoRoot } = options;
  const executor = createExecutor();
  const httpClient = createHttpClient();

  console.log(`Loading config from ${repoRoot}…`);
  const config = await loadConfig(repoRoot);

  console.log(`Resolving packages matching: ${config.packages.join(", ")}…`);
  const packages = await resolvePackages(repoRoot, config.packages);
  console.log(
    `Found ${packages.length} package(s): ${packages.map((p) => p.name).join(", ")}`,
  );

  await runBuild(config, repoRoot, executor);

  console.log("Packing…");
  const results = await packPackages(
    packages,
    config.publishDirectory,
    repoRoot,
    executor,
  );

  for (const result of results) {
    console.log(`  ${result.packageName} → ${result.tarballPath}`);
  }

  console.log("Uploading…");
  await uploadPackages(results, options, httpClient);

  console.log("Done! Install URLs:");
  for (const result of results) {
    const url = buildCommitUrl({
      baseUrl: options.workerUrl,
      org: options.org,
      repo: options.repo,
      sha: options.sha,
      packageName: result.packageName,
    });
    console.log(`  npm install ${url}`);
  }
}
