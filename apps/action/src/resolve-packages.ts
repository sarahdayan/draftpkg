import fs from "node:fs/promises";
import path from "node:path";

export interface ResolvedPackage {
  name: string;
  path: string;
}

export async function resolvePackages(
  repoRoot: string,
  patterns: string[],
): Promise<ResolvedPackage[]> {
  const packages: ResolvedPackage[] = [];

  for (const pattern of patterns) {
    if (isGlob(pattern)) {
      const dirs = await expandGlob(repoRoot, pattern);

      for (const dir of dirs) {
        const name = await readPackageName(dir);

        if (name) {
          packages.push({ name, path: dir });
        }
      }
    } else {
      const fullPath = path.join(repoRoot, pattern);
      const name = await readPackageName(fullPath);

      if (!name) {
        throw new Error(`No package.json found in ${pattern}`);
      }

      packages.push({ name, path: fullPath });
    }
  }

  return packages;
}

function isGlob(pattern: string): boolean {
  return pattern.includes("*");
}

async function readPackageName(dir: string): Promise<string | null> {
  try {
    const content = await fs.readFile(path.join(dir, "package.json"), "utf-8");
    const pkg = JSON.parse(content) as { name?: string };

    return pkg.name ?? null;
  } catch {
    return null;
  }
}

async function expandGlob(
  repoRoot: string,
  pattern: string,
): Promise<string[]> {
  const parts = pattern.split("*");

  if (parts.length !== 2) {
    throw new Error(`Unsupported glob pattern: ${pattern}`);
  }

  const prefix = parts[0]!;
  const baseDir = path.join(repoRoot, prefix);

  let entries: string[];

  try {
    entries = await fs.readdir(baseDir);
  } catch {
    return [];
  }

  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      results.push(fullPath);
    }
  }

  return results;
}
