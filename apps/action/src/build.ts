import type { CiConfig } from "@draftpkg/config";

import type { Executor } from "./executor";

export async function runBuild(
  config: CiConfig,
  repoRoot: string,
  executor: Executor,
): Promise<void> {
  if (config.installCommand !== false) {
    await executor.run(`npm run ${config.installCommand}`, { cwd: repoRoot });
  }

  if (config.buildCommand !== false) {
    await executor.run(`npm run ${config.buildCommand}`, { cwd: repoRoot });
  }
}
