import path from "node:path";

import type { Executor } from "./executor";
import type { ResolvedPackage } from "./resolve-packages";

export interface PackResult {
  packageName: string;
  tarballPath: string;
}

export async function packPackages(
  packages: ResolvedPackage[],
  publishDirectory: Record<string, string>,
  repoRoot: string,
  executor: Executor,
): Promise<PackResult[]> {
  const results: PackResult[] = [];

  for (const pkg of packages) {
    const publishDir = publishDirectory[pkg.name];
    const packDir = publishDir
      ? path.join(repoRoot, publishDir)
      : pkg.path;

    const { stdout } = await executor.run("npm pack", { cwd: packDir });
    const tarballName = stdout.trim();

    results.push({
      packageName: pkg.name,
      tarballPath: path.join(packDir, tarballName),
    });
  }

  return results;
}
