import type { CiConfig } from "./types";

export function parseCiConfig(input: unknown): CiConfig {
  const raw = (input ?? {}) as Record<string, unknown>;

  const installCommand = raw.installCommand ?? "install";
  if (typeof installCommand !== "string" && installCommand !== false) {
    throw new Error("`installCommand` must be a string or `false`");
  }

  const buildCommand = raw.buildCommand ?? "build";
  if (typeof buildCommand !== "string" && buildCommand !== false) {
    throw new Error("`buildCommand` must be a string or `false`");
  }

  const packages = raw.packages ?? ["."];
  if (
    !Array.isArray(packages) ||
    !packages.every((p) => typeof p === "string")
  ) {
    throw new Error("`packages` must be an array of strings");
  }

  const node = raw.node ?? "24";
  if (typeof node !== "string") {
    throw new Error("`node` must be a string");
  }

  const publishDirectory = raw.publishDirectory ?? {};
  if (
    typeof publishDirectory !== "object" ||
    publishDirectory === null ||
    Array.isArray(publishDirectory) ||
    !Object.values(publishDirectory).every((v) => typeof v === "string")
  ) {
    throw new Error(
      "`publishDirectory` must be an object mapping package names to directories",
    );
  }

  return {
    installCommand,
    buildCommand,
    packages,
    publishDirectory: publishDirectory as Record<string, string>,
    node,
  };
}
