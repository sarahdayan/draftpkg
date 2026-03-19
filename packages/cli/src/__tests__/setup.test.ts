import { vol } from "memfs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExecResult, Executor } from "../executor";
import { setup } from "../setup";

vi.mock("node:fs/promises", async () => {
  const memfs = await import("memfs");

  return { default: memfs.fs.promises };
});

const TARGET_DIR = "/home/user/draftpkg-worker";

describe("setup", () => {
  let executor: ReturnType<typeof createFakeExecutor>;

  beforeEach(() => {
    vol.reset();

    executor = createFakeExecutor({
      "wrangler whoami": "You are logged in as test@example.com",
      "wrangler kv namespace create METADATA":
        '🌀 Creating namespace with title "draftpkg-worker-METADATA"\n✅ Success!\nid = "kv-namespace-id-123"',
      "wrangler r2 bucket create draftpkg-tarballs":
        "Created bucket draftpkg-tarballs",
      "npm install": "",
      "wrangler deploy": "Deployed to https://draftpkg-worker.test.workers.dev",
    });
  });

  it("checks wrangler login", async () => {
    await setup(TARGET_DIR, executor);

    expect(executor.calls[0]!.command).toBe("wrangler whoami");
  });

  it("scaffolds the worker project directory", async () => {
    await setup(TARGET_DIR, executor);

    const files = vol.toJSON();

    expect(files[`${TARGET_DIR}/src/index.ts`]).toBeTruthy();
    expect(files[`${TARGET_DIR}/wrangler.toml`]).toBeTruthy();
    expect(files[`${TARGET_DIR}/package.json`]).toBeTruthy();
  });

  it("writes wrangler.toml with the KV namespace ID", async () => {
    await setup(TARGET_DIR, executor);

    const wranglerToml = vol.readFileSync(
      `${TARGET_DIR}/wrangler.toml`,
      "utf-8",
    ) as string;

    expect(wranglerToml).toContain('id = "kv-namespace-id-123"');
    expect(wranglerToml).toContain("draftpkg-tarballs");
  });

  it("creates a KV namespace", async () => {
    await setup(TARGET_DIR, executor);

    expect(
      executor.calls.some((c) =>
        c.command.includes("kv namespace create METADATA"),
      ),
    ).toBe(true);
  });

  it("creates an R2 bucket", async () => {
    await setup(TARGET_DIR, executor);

    expect(
      executor.calls.some((c) =>
        c.command.includes("r2 bucket create draftpkg-tarballs"),
      ),
    ).toBe(true);
  });

  it("installs dependencies in the scaffolded directory", async () => {
    await setup(TARGET_DIR, executor);

    const npmInstall = executor.calls.find((c) =>
      c.command.includes("npm install"),
    );

    expect(npmInstall).toBeTruthy();
    expect(npmInstall!.cwd).toBe(TARGET_DIR);
  });

  it("deploys the worker from the scaffolded directory", async () => {
    await setup(TARGET_DIR, executor);

    const deploy = executor.calls.find((c) =>
      c.command.includes("wrangler deploy"),
    );

    expect(deploy).toBeTruthy();
    expect(deploy!.cwd).toBe(TARGET_DIR);
  });

  it("sets the API key as a secret from the scaffolded directory", async () => {
    await setup(TARGET_DIR, executor);

    const secretPut = executor.calls.find((c) =>
      c.command.includes("wrangler secret put API_KEY"),
    );

    expect(secretPut).toBeTruthy();
    expect(secretPut!.cwd).toBe(TARGET_DIR);
  });

  it("returns the worker URL and API key", async () => {
    const result = await setup(TARGET_DIR, executor);

    expect(result.workerUrl).toBe("https://draftpkg-worker.test.workers.dev");
    expect(result.apiKey).toBeTruthy();
  });

  it("throws if not logged in", async () => {
    executor = createFakeExecutor({});
    executor.run = async (command, options) => {
      executor.calls.push({ command, cwd: options?.cwd });
      if (command === "wrangler whoami") {
        throw new Error("Not logged in");
      }

      return { stdout: "", stderr: "" };
    };

    await expect(setup(TARGET_DIR, executor)).rejects.toThrow("logged in");
  });

  it("runs steps in the correct order", async () => {
    await setup(TARGET_DIR, executor);

    const commands = executor.calls.map((c) => c.command);
    const whoamiIdx = commands.findIndex((c) => c.includes("whoami"));
    const kvIdx = commands.findIndex((c) => c.includes("kv namespace create"));
    const r2Idx = commands.findIndex((c) => c.includes("r2 bucket create"));
    const installIdx = commands.findIndex((c) => c.includes("npm install"));
    const deployIdx = commands.findIndex((c) => c.includes("wrangler deploy"));

    expect(whoamiIdx).toBeLessThan(kvIdx);
    expect(kvIdx).toBeLessThan(r2Idx);
    expect(r2Idx).toBeLessThan(installIdx);
    expect(installIdx).toBeLessThan(deployIdx);
  });
});

interface RecordedCall {
  command: string;
  cwd?: string;
}

function createFakeExecutor(
  responses: Record<string, string> = {},
): Executor & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  return {
    calls,
    async run(
      command: string,
      options?: { cwd?: string },
    ): Promise<ExecResult> {
      calls.push({ command, cwd: options?.cwd });

      return { stdout: responses[command] ?? "", stderr: "" };
    },
  };
}
