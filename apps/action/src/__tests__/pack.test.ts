import { beforeEach, describe, expect, it } from "vitest";

import type { ExecResult, Executor } from "../executor";
import { packPackages } from "../pack";
import type { ResolvedPackage } from "../resolve-packages";

describe("packPackages", () => {
  let executor: ReturnType<typeof createFakeExecutor>;

  beforeEach(() => {
    executor = createFakeExecutor({
      "/repo": "my-lib-1.0.0.tgz",
    });
  });

  it("runs `npm pack` in the package directory", async () => {
    const packages: ResolvedPackage[] = [{ name: "my-lib", path: "/repo" }];

    await packPackages(packages, {}, "/repo", executor);

    expect(executor.calls).toEqual([{ command: "npm pack", cwd: "/repo" }]);
  });

  it("returns tarball paths from `npm pack` output", async () => {
    const packages: ResolvedPackage[] = [{ name: "my-lib", path: "/repo" }];

    const results = await packPackages(packages, {}, "/repo", executor);

    expect(results).toEqual([
      { packageName: "my-lib", tarballPath: "/repo/my-lib-1.0.0.tgz" },
    ]);
  });

  it("packs multiple packages", async () => {
    executor = createFakeExecutor({
      "/repo/packages/alpha": "alpha-1.0.0.tgz",
      "/repo/packages/beta": "beta-2.0.0.tgz",
    });

    const packages: ResolvedPackage[] = [
      { name: "@scope/alpha", path: "/repo/packages/alpha" },
      { name: "@scope/beta", path: "/repo/packages/beta" },
    ];

    const results = await packPackages(packages, {}, "/repo", executor);

    expect(results).toEqual([
      {
        packageName: "@scope/alpha",
        tarballPath: "/repo/packages/alpha/alpha-1.0.0.tgz",
      },
      {
        packageName: "@scope/beta",
        tarballPath: "/repo/packages/beta/beta-2.0.0.tgz",
      },
    ]);
  });

  it("uses `publishDirectory` when specified", async () => {
    executor = createFakeExecutor({
      "/repo/build/node_modules/react": "react-18.0.0.tgz",
    });

    const packages: ResolvedPackage[] = [
      { name: "react", path: "/repo/packages/react" },
    ];

    const results = await packPackages(
      packages,
      { react: "build/node_modules/react" },
      "/repo",
      executor,
    );

    expect(executor.calls).toEqual([
      { command: "npm pack", cwd: "/repo/build/node_modules/react" },
    ]);
    expect(results).toEqual([
      {
        packageName: "react",
        tarballPath: "/repo/build/node_modules/react/react-18.0.0.tgz",
      },
    ]);
  });
});

interface RecordedCall {
  command: string;
  cwd: string;
}

function createFakeExecutor(
  results: Record<string, string> = {},
): Executor & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  return {
    calls,
    async run(command: string, options: { cwd: string }): Promise<ExecResult> {
      calls.push({ command, cwd: options.cwd });

      return { stdout: results[options.cwd] ?? "", stderr: "" };
    },
  };
}
