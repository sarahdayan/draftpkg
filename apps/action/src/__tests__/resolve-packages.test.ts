import { vol } from "memfs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolvePackages } from "../resolve-packages";

vi.mock("node:fs/promises", async () => {
  const memfs = await import("memfs");

  return { default: memfs.fs.promises };
});

beforeEach(() => {
  vol.reset();
});

describe("resolvePackages", () => {
  it("resolves a single root package", async () => {
    vol.fromJSON({
      "/repo/package.json": JSON.stringify({ name: "my-lib" }),
    });

    const packages = await resolvePackages("/repo", ["."]);

    expect(packages).toEqual([{ name: "my-lib", path: "/repo" }]);
  });

  it("resolves explicit package paths", async () => {
    vol.fromJSON({
      "/repo/packages/react/package.json": JSON.stringify({ name: "react" }),
      "/repo/packages/react-dom/package.json": JSON.stringify({
        name: "react-dom",
      }),
    });

    const packages = await resolvePackages("/repo", [
      "packages/react",
      "packages/react-dom",
    ]);

    expect(packages).toEqual([
      { name: "react", path: "/repo/packages/react" },
      { name: "react-dom", path: "/repo/packages/react-dom" },
    ]);
  });

  it("resolves glob patterns", async () => {
    vol.fromJSON({
      "/repo/packages/alpha/package.json": JSON.stringify({
        name: "@scope/alpha",
      }),
      "/repo/packages/beta/package.json": JSON.stringify({
        name: "@scope/beta",
      }),
    });

    const packages = await resolvePackages("/repo", ["packages/*"]);

    expect(packages).toEqual(
      expect.arrayContaining([
        { name: "@scope/alpha", path: "/repo/packages/alpha" },
        { name: "@scope/beta", path: "/repo/packages/beta" },
      ]),
    );
    expect(packages).toHaveLength(2);
  });

  it("skips directories without a `package.json`", async () => {
    vol.fromJSON({
      "/repo/packages/real/package.json": JSON.stringify({ name: "real" }),
      "/repo/packages/not-a-package/.gitkeep": "",
    });

    const packages = await resolvePackages("/repo", ["packages/*"]);

    expect(packages).toEqual([{ name: "real", path: "/repo/packages/real" }]);
  });

  it("throws when an explicit path has no `package.json`", async () => {
    vol.fromJSON({
      "/repo/packages/missing/.gitkeep": "",
    });

    await expect(
      resolvePackages("/repo", ["packages/missing"]),
    ).rejects.toThrow("packages/missing");
  });
});
