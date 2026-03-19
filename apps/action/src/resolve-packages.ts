export interface ResolvedPackage {
  name: string;
  path: string;
}

export async function resolvePackages(
  _repoRoot: string,
  _patterns: string[],
): Promise<ResolvedPackage[]> {
  throw new Error("Not implemented");
}
