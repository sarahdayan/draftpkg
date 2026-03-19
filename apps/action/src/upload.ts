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
  _packages: PackResult[],
  _options: UploadOptions,
  _httpClient: HttpClient,
): Promise<void> {
  throw new Error("Not implemented");
}
