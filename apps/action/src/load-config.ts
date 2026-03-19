import fs from "node:fs/promises";
import path from "node:path";

import { parseCiConfig } from "@draftpkg/config";
import type { CiConfig } from "@draftpkg/config";

const CONFIG_PATHS = [".draftpkg/ci.json", ".codesandbox/ci.json"];

export async function loadConfig(repoRoot: string): Promise<CiConfig> {
  for (const configPath of CONFIG_PATHS) {
    const fullPath = path.join(repoRoot, configPath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");

      return parseCiConfig(JSON.parse(content));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw error;
      }
    }
  }

  return parseCiConfig({});
}
