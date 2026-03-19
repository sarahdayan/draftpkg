import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import type { Executor } from "./executor";
import { setup } from "./setup";

const execAsync = promisify(exec);

function createExecutor(): Executor {
  return {
    async run(command, options) {
      return execAsync(command, { cwd: options?.cwd });
    },
  };
}

const command = process.argv[2];

if (command !== "setup") {
  console.error(`Unknown command: ${command ?? "(none)"}`);
  console.error("Usage: draftpkg setup [target-dir]");
  process.exit(1);
}

const targetDir = path.resolve(process.argv[3] ?? "draftpkg-worker");

console.log(`Setting up Draftpkg in ${targetDir}...\n`);

setup(targetDir, createExecutor())
  .then((result) => {
    console.log("\nDraftpkg is ready!\n");
    console.log(`  Worker URL: ${result.workerUrl}`);
    console.log(`  API Key:    ${result.apiKey}`);
    console.log(`  Directory:  ${targetDir}`);
    console.log("\nAdd these as secrets in your GitHub repo:");
    console.log("  DRAFTPKG_WORKER_URL");
    console.log("  DRAFTPKG_API_KEY");
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
