import type { BuildCommitUrlParams, ParsedRegistryUrl } from "./types";

export function buildCommitUrl(_params: BuildCommitUrlParams): string {
  throw new Error("Not implemented");
}

export function parseRegistryUrl(_path: string): ParsedRegistryUrl | null {
  throw new Error("Not implemented");
}
