import { describe, expect, it } from "vitest";

import { buildCommitUrl, parseRegistryUrl } from "../urls";

describe("buildCommitUrl", () => {
  it("builds a URL for an unscoped package", () => {
    const url = buildCommitUrl({
      baseUrl: "https://pkg.example.com",
      org: "algolia",
      repo: "instantsearch",
      sha: "abc123",
      packageName: "algoliasearch-helper",
    });

    expect(url).toBe(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/algoliasearch-helper",
    );
  });

  it("builds a URL for a scoped package", () => {
    const url = buildCommitUrl({
      baseUrl: "https://pkg.example.com",
      org: "algolia",
      repo: "instantsearch",
      sha: "abc123",
      packageName: "@algolia/client-search",
    });

    expect(url).toBe(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/@algolia/client-search",
    );
  });

  it("strips trailing slash from `baseUrl`", () => {
    const url = buildCommitUrl({
      baseUrl: "https://pkg.example.com/",
      org: "algolia",
      repo: "instantsearch",
      sha: "abc123",
      packageName: "algoliasearch-helper",
    });

    expect(url).toBe(
      "https://pkg.example.com/algolia/instantsearch/commit/abc123/algoliasearch-helper",
    );
  });
});

describe("parseRegistryUrl", () => {
  it("parses a commit URL for an unscoped package", () => {
    const result = parseRegistryUrl(
      "/algolia/instantsearch/commit/abc123/algoliasearch-helper",
    );

    expect(result).toEqual({
      org: "algolia",
      repo: "instantsearch",
      sha: "abc123",
      packageName: "algoliasearch-helper",
    });
  });

  it("parses a commit URL for a scoped package", () => {
    const result = parseRegistryUrl(
      "/algolia/instantsearch/commit/abc123/@algolia/client-search",
    );

    expect(result).toEqual({
      org: "algolia",
      repo: "instantsearch",
      sha: "abc123",
      packageName: "@algolia/client-search",
    });
  });

  it("returns `null` for an invalid URL", () => {
    expect(parseRegistryUrl("/not/a/valid/url")).toBeNull();
  });

  it("returns `null` for an empty string", () => {
    expect(parseRegistryUrl("")).toBeNull();
  });
});
