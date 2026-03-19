import { vol } from "memfs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PackResult } from "../pack";
import type { HttpClient, UploadOptions } from "../upload";
import { uploadPackages } from "../upload";

vi.mock("node:fs/promises", async () => {
  const memfs = await import("memfs");

  return { default: memfs.fs.promises };
});

const defaultOptions: UploadOptions = {
  workerUrl: "https://pkg.example.com",
  apiKey: "test-key",
  org: "algolia",
  repo: "instantsearch",
  sha: "abc123",
};

describe("uploadPackages", () => {
  let httpClient: ReturnType<typeof createFakeHttpClient>;

  beforeEach(() => {
    vol.reset();
    httpClient = createFakeHttpClient();
  });

  it("uploads a single package", async () => {
    vol.fromJSON({
      "/repo/my-lib-1.0.0.tgz": Buffer.from([1, 2, 3, 4]).toString("binary"),
    });

    const packages: PackResult[] = [
      { packageName: "my-lib", tarballPath: "/repo/my-lib-1.0.0.tgz" },
    ];

    await uploadPackages(packages, defaultOptions, httpClient);

    expect(httpClient.calls).toHaveLength(1);
    expect(httpClient.calls[0]!.url).toBe(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/my-lib",
    );
    expect(httpClient.calls[0]!.headers).toEqual({
      authorization: "Bearer test-key",
    });
  });

  it("uploads multiple packages", async () => {
    vol.fromJSON({
      "/repo/alpha-1.0.0.tgz": Buffer.from([1, 2]).toString("binary"),
      "/repo/beta-2.0.0.tgz": Buffer.from([3, 4]).toString("binary"),
    });

    const packages: PackResult[] = [
      { packageName: "@scope/alpha", tarballPath: "/repo/alpha-1.0.0.tgz" },
      { packageName: "@scope/beta", tarballPath: "/repo/beta-2.0.0.tgz" },
    ];

    await uploadPackages(packages, defaultOptions, httpClient);

    expect(httpClient.calls).toHaveLength(2);
    expect(httpClient.calls[0]!.url).toBe(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/@scope/alpha",
    );
    expect(httpClient.calls[1]!.url).toBe(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/@scope/beta",
    );
  });

  it("strips trailing slash from worker URL", async () => {
    vol.fromJSON({
      "/repo/my-lib-1.0.0.tgz": Buffer.from([1, 2]).toString("binary"),
    });

    const packages: PackResult[] = [
      { packageName: "my-lib", tarballPath: "/repo/my-lib-1.0.0.tgz" },
    ];

    await uploadPackages(
      packages,
      { ...defaultOptions, workerUrl: "https://pkg.example.com/" },
      httpClient,
    );

    expect(httpClient.calls[0]!.url).toBe(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/my-lib",
    );
  });

  it("throws when upload fails", async () => {
    vol.fromJSON({
      "/repo/my-lib-1.0.0.tgz": Buffer.from([1, 2]).toString("binary"),
    });

    httpClient = {
      calls: [],
      async post(url, body, headers) {
        this.calls.push({ url, body, headers });

        return { status: 500 };
      },
    };

    const packages: PackResult[] = [
      { packageName: "my-lib", tarballPath: "/repo/my-lib-1.0.0.tgz" },
    ];

    await expect(
      uploadPackages(packages, defaultOptions, httpClient),
    ).rejects.toThrow("my-lib");
  });
});

interface RecordedCall {
  url: string;
  body: Uint8Array;
  headers: Record<string, string>;
}

function createFakeHttpClient(): HttpClient & { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  return {
    calls,
    async post(url, body, headers) {
      calls.push({ url, body, headers });

      return { status: 201 };
    },
  };
}
