import type { CiConfig } from "@draftpkg/config";
import { beforeEach, describe, expect, it } from "vitest";

import { runBuild } from "../build";
import type { ExecResult, Executor } from "../executor";

describe("runBuild", () => {
  let executor: ReturnType<typeof createFakeExecutor>;

  beforeEach(() => {
    executor = createFakeExecutor();
  });

  it("runs install and build commands", async () => {
    await runBuild(createConfig(), "/repo", executor);

    expect(executor.calls).toEqual([
      { command: "npm run install", cwd: "/repo" },
      { command: "npm run build", cwd: "/repo" },
    ]);
  });

  it("runs custom install and build commands", async () => {
    await runBuild(
      createConfig({ installCommand: "ci", buildCommand: "build:prod" }),
      "/repo",
      executor,
    );

    expect(executor.calls).toEqual([
      { command: "npm run ci", cwd: "/repo" },
      { command: "npm run build:prod", cwd: "/repo" },
    ]);
  });

  it("skips install when `installCommand` is `false`", async () => {
    await runBuild(createConfig({ installCommand: false }), "/repo", executor);

    expect(executor.calls).toEqual([
      { command: "npm run build", cwd: "/repo" },
    ]);
  });

  it("skips build when `buildCommand` is `false`", async () => {
    await runBuild(createConfig({ buildCommand: false }), "/repo", executor);

    expect(executor.calls).toEqual([
      { command: "npm run install", cwd: "/repo" },
    ]);
  });

  it("skips both when both are `false`", async () => {
    await runBuild(
      createConfig({ installCommand: false, buildCommand: false }),
      "/repo",
      executor,
    );

    expect(executor.calls).toEqual([]);
  });
});

interface RecordedCall {
  command: string;
  cwd: string;
}

function createFakeExecutor(): Executor & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  return {
    calls,
    async run(command: string, options: { cwd: string }): Promise<ExecResult> {
      calls.push({ command, cwd: options.cwd });

      return { stdout: "", stderr: "" };
    },
  };
}

function createConfig(overrides: Partial<CiConfig> = {}): CiConfig {
  return {
    installCommand: "install",
    buildCommand: "build",
    packages: ["."],
    publishDirectory: {},
    node: "24",
    ...overrides,
  };
}
