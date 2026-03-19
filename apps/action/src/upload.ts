import fs from "node:fs/promises";

import { buildCommitUrl } from "@draftpkg/config";

import type { PackResult } from "./pack";

export interface UploadOptions {
  workerUrl: string;
  apiKey: string;
  org: string;
  repo: string;
  sha: string;
}

export interface HttpClient {
  post(
    url: string,
    body: Uint8Array,
    headers: Record<string, string>,
  ): Promise<{ status: number }>;
}

export async function uploadPackages(
  packages: PackResult[],
  options: UploadOptions,
  httpClient: HttpClient,
): Promise<void> {
  for (const pkg of packages) {
    const url = buildCommitUrl({
      baseUrl: options.workerUrl,
      org: options.org,
      repo: options.repo,
      sha: options.sha,
      packageName: pkg.packageName,
    });

    const body = new Uint8Array(await fs.readFile(pkg.tarballPath));

    const { status } = await httpClient.post(url, body, {
      authorization: `Bearer ${options.apiKey}`,
    });

    if (status !== 201) {
      throw new Error(
        `Failed to upload ${pkg.packageName}: server responded with ${status}`,
      );
    }
  }
}
