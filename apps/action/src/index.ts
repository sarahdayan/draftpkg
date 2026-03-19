import { loadConfig } from "./load-config";
import { resolvePackages } from "./resolve-packages";
import { runBuild } from "./build";
import { packPackages } from "./pack";
import { createExecutor } from "./executor";
import type { PackResult } from "./pack";

export interface RunOptions {
  repoRoot: string;
}

export async function run(options: RunOptions): Promise<PackResult[]> {
  const { repoRoot } = options;
  const executor = createExecutor();

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

  return results;
}
