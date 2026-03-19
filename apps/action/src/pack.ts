import type { Executor } from "./executor";
import type { ResolvedPackage } from "./resolve-packages";

export interface PackResult {
  packageName: string;
  tarballPath: string;
}

export async function packPackages(
  _packages: ResolvedPackage[],
  _publishDirectory: Record<string, string>,
  _executor: Executor,
): Promise<PackResult[]> {
  throw new Error("Not implemented");
}
