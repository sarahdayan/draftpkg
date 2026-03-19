import { vol } from "memfs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadConfig } from "../load-config";

vi.mock("node:fs/promises", async () => {
  const memfs = await import("memfs");

  return { default: memfs.fs.promises };
});

beforeEach(() => {
  vol.reset();
});

describe("loadConfig", () => {
  it("loads config from `.draftpkg/ci.json`", async () => {
    vol.fromJSON({
      "/repo/.draftpkg/ci.json": JSON.stringify({ buildCommand: "build:prod" }),
    });

    const config = await loadConfig("/repo");

    expect(config.buildCommand).toBe("build:prod");
  });

  it("falls back to `.codesandbox/ci.json`", async () => {
    vol.fromJSON({
      "/repo/.codesandbox/ci.json": JSON.stringify({
        buildCommand: "build:csb",
      }),
    });

    const config = await loadConfig("/repo");

    expect(config.buildCommand).toBe("build:csb");
  });

  it("prefers `.draftpkg/ci.json` over `.codesandbox/ci.json`", async () => {
    vol.fromJSON({
      "/repo/.draftpkg/ci.json": JSON.stringify({
        buildCommand: "build:draftpkg",
      }),
      "/repo/.codesandbox/ci.json": JSON.stringify({
        buildCommand: "build:csb",
      }),
    });

    const config = await loadConfig("/repo");

    expect(config.buildCommand).toBe("build:draftpkg");
  });

  it("returns defaults when no config file exists", async () => {
    vol.fromJSON({});

    const config = await loadConfig("/repo");

    expect(config).toEqual({
      installCommand: "install",
      buildCommand: "build",
      packages: ["."],
      publishDirectory: {},
      node: "24",
    });
  });

  it("throws on invalid JSON", async () => {
    vol.fromJSON({
      "/repo/.draftpkg/ci.json": "not json{",
    });

    await expect(loadConfig("/repo")).rejects.toThrow(SyntaxError);
  });
});
