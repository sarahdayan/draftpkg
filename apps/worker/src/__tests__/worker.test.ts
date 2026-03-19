import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import worker from "../index";

describe("GET /:org/:repo/commit/:sha/:pkg", () => {
  it("returns 404 when tarball does not exist", async () => {
    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/algoliasearch-helper"),
      env,
    );

    expect(res.status).toBe(404);
  });

  it("returns the tarball from R2", async () => {
    const tarball = new Uint8Array([1, 2, 3, 4]);

    await env.TARBALLS.put(
      "algolia/instantsearch/abc123/algoliasearch-helper.tgz",
      tarball,
    );

    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/algoliasearch-helper"),
      env,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/gzip");

    const body = new Uint8Array(await res.arrayBuffer());

    expect(body).toEqual(tarball);
  });

  it("returns the tarball for a scoped package", async () => {
    const tarball = new Uint8Array([5, 6, 7, 8]);

    await env.TARBALLS.put(
      "algolia/instantsearch/abc123/@algolia/client-search.tgz",
      tarball,
    );

    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/@algolia/client-search"),
      env,
    );

    expect(res.status).toBe(200);

    const body = new Uint8Array(await res.arrayBuffer());

    expect(body).toEqual(tarball);
  });
});

describe("POST /:org/:repo/commit/:sha/:pkg", () => {
  it("returns 401 without API key", async () => {
    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/algoliasearch-helper", {
        method: "POST",
        body: new Uint8Array([1, 2, 3]),
      }),
      env,
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong API key", async () => {
    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/algoliasearch-helper", {
        method: "POST",
        headers: { authorization: "Bearer wrong-key" },
        body: new Uint8Array([1, 2, 3]),
      }),
      { ...env, API_KEY: "correct-key" },
    );

    expect(res.status).toBe(401);
  });

  it("uploads tarball to R2 and writes KV metadata", async () => {
    const tarball = new Uint8Array([1, 2, 3, 4]);

    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/algoliasearch-helper", {
        method: "POST",
        headers: { authorization: "Bearer test-key" },
        body: tarball,
      }),
      { ...env, API_KEY: "test-key" },
    );

    expect(res.status).toBe(201);

    const stored = await env.TARBALLS.get(
      "algolia/instantsearch/abc123/algoliasearch-helper.tgz",
    );

    expect(stored).not.toBeNull();

    const storedBody = new Uint8Array(await stored!.arrayBuffer());

    expect(storedBody).toEqual(tarball);

    const metadata = await env.METADATA.get(
      "algolia/instantsearch/abc123/algoliasearch-helper",
    );

    expect(metadata).not.toBeNull();

    const parsed = JSON.parse(metadata!);

    expect(parsed).toEqual(
      expect.objectContaining({
        org: "algolia",
        repo: "instantsearch",
        sha: "abc123",
        packageName: "algoliasearch-helper",
      }),
    );
  });

  it("uploads a scoped package", async () => {
    const tarball = new Uint8Array([5, 6, 7, 8]);

    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/@algolia/client-search", {
        method: "POST",
        headers: { authorization: "Bearer test-key" },
        body: tarball,
      }),
      { ...env, API_KEY: "test-key" },
    );

    expect(res.status).toBe(201);

    const stored = await env.TARBALLS.get(
      "algolia/instantsearch/abc123/@algolia/client-search.tgz",
    );

    expect(stored).not.toBeNull();
    await stored!.arrayBuffer();
  });
});

describe("unsupported routes", () => {
  it("returns 404 for unknown paths", async () => {
    const res = await worker.fetch(request("/"), env);

    expect(res.status).toBe(404);
  });

  it("returns 405 for unsupported methods", async () => {
    const res = await worker.fetch(
      request("/algolia/instantsearch/commit/abc123/algoliasearch-helper", {
        method: "DELETE",
      }),
      env,
    );

    expect(res.status).toBe(405);
  });
});

function request(
  path: string,
  options: RequestInit & { headers?: Record<string, string> } = {},
): Request {
  return new Request(`http://localhost${path}`, options);
}
