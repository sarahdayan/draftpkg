import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import worker from "../index";

describe("e2e: upload then download", () => {
  it("uploads a tarball and downloads the same bytes", async () => {
    const tarball = new Uint8Array(
      Array.from({ length: 1024 }, (_, i) => i % 256),
    );

    const uploadRes = await worker.fetch(
      new Request(
        "http://localhost/algolia/instantsearch/commit/abc123/algoliasearch-helper",
        {
          method: "POST",
          headers: { authorization: "Bearer test-key" },
          body: tarball,
        },
      ),
      { ...env, API_KEY: "test-key" },
    );

    expect(uploadRes.status).toBe(201);

    const downloadRes = await worker.fetch(
      new Request(
        "http://localhost/algolia/instantsearch/commit/abc123/algoliasearch-helper",
      ),
      env,
    );

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get("content-type")).toBe("application/gzip");

    const downloaded = new Uint8Array(await downloadRes.arrayBuffer());

    expect(downloaded).toEqual(tarball);
  });

  it("upload then download works for scoped packages", async () => {
    const tarball = new Uint8Array([10, 20, 30, 40, 50]);

    const uploadRes = await worker.fetch(
      new Request(
        "http://localhost/algolia/instantsearch/commit/def456/@algolia/client-search",
        {
          method: "POST",
          headers: { authorization: "Bearer test-key" },
          body: tarball,
        },
      ),
      { ...env, API_KEY: "test-key" },
    );

    expect(uploadRes.status).toBe(201);

    const downloadRes = await worker.fetch(
      new Request(
        "http://localhost/algolia/instantsearch/commit/def456/@algolia/client-search",
      ),
      env,
    );

    expect(downloadRes.status).toBe(200);

    const downloaded = new Uint8Array(await downloadRes.arrayBuffer());

    expect(downloaded).toEqual(tarball);
  });

  it("different commits produce different tarballs", async () => {
    const tarball1 = new Uint8Array([1, 2, 3]);
    const tarball2 = new Uint8Array([4, 5, 6]);

    const upload1 = await worker.fetch(
      new Request("http://localhost/org/repo/commit/sha1/my-pkg", {
        method: "POST",
        headers: { authorization: "Bearer key" },
        body: tarball1,
      }),
      { ...env, API_KEY: "key" },
    );

    expect(upload1.status).toBe(201);

    const upload2 = await worker.fetch(
      new Request("http://localhost/org/repo/commit/sha2/my-pkg", {
        method: "POST",
        headers: { authorization: "Bearer key" },
        body: tarball2,
      }),
      { ...env, API_KEY: "key" },
    );

    expect(upload2.status).toBe(201);

    const res1 = await worker.fetch(
      new Request("http://localhost/org/repo/commit/sha1/my-pkg"),
      env,
    );
    const res2 = await worker.fetch(
      new Request("http://localhost/org/repo/commit/sha2/my-pkg"),
      env,
    );

    expect(new Uint8Array(await res1.arrayBuffer())).toEqual(tarball1);
    expect(new Uint8Array(await res2.arrayBuffer())).toEqual(tarball2);
  });
});
