import type { CiConfig } from "@draftpkg/config";

import type { Executor } from "./executor";

export async function runBuild(
  _config: CiConfig,
  _repoRoot: string,
  _executor: Executor,
): Promise<void> {
  throw new Error("Not implemented");
}
