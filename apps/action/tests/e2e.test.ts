import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { runBuild } from "../src/build";
import { createExecutor } from "../src/executor";
import { loadConfig } from "../src/load-config";
import type { PackResult } from "../src/pack";
import { packPackages } from "../src/pack";
import { resolvePackages } from "../src/resolve-packages";
import type { ResolvedPackage } from "../src/resolve-packages";
import type { CiConfig } from "@draftpkg/config";

const FIXTURE_PATH = path.resolve(
  import.meta.dirname,
  "fixtures/sample-repo",
);

const executor = createExecutor();

let config: CiConfig;
let packages: ResolvedPackage[];
let results: PackResult[];

beforeAll(async () => {
  config = await loadConfig(FIXTURE_PATH);
  packages = await resolvePackages(FIXTURE_PATH, config.packages);
  await runBuild(config, FIXTURE_PATH, executor);
  results = await packPackages(
    packages,
    config.publishDirectory,
    FIXTURE_PATH,
    executor,
  );
}, 30000);

afterAll(async () => {
  for (const r of results ?? []) {
    await fs.rm(r.tarballPath, { force: true });
  }
});

describe("e2e: build and pack from fixture repo", () => {
  it("reads config from .draftpkg/ci.json", () => {
    expect(config.installCommand).toBe(false);
    expect(config.buildCommand).toBe("build");
  });

  it("resolves both packages", () => {
    expect(packages).toHaveLength(2);
    expect(packages.map((p) => p.name).sort()).toEqual([
      "@sample/utils",
      "my-lib",
    ]);
  });

  it("produces a tarball for each package", () => {
    expect(results).toHaveLength(2);
  });

  it("produces valid .tgz files", async () => {
    for (const r of results) {
      const stat = await fs.stat(r.tarballPath);

      expect(stat.size).toBeGreaterThan(0);
      expect(r.tarballPath).toMatch(/\.tgz$/);
    }
  });
});
