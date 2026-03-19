import { exec } from "node:child_process";
import { promisify } from "node:util";

import type { Executor } from "./executor";
import { setup } from "./setup";

const execAsync = promisify(exec);

function createExecutor(): Executor {
  return {
    async run(command) {
      return execAsync(command);
    },
  };
}

const command = process.argv[2];

if (command !== "setup") {
  console.error(`Unknown command: ${command ?? "(none)"}`);
  console.error("Usage: draftpkg setup");
  process.exit(1);
}

console.log("Setting up Draftpkg...\n");

setup(createExecutor())
  .then((result) => {
    console.log("\nDraftpkg is ready!\n");
    console.log(`  Worker URL: ${result.workerUrl}`);
    console.log(`  API Key:    ${result.apiKey}`);
    console.log("\nAdd these as secrets in your GitHub repo:");
    console.log("  DRAFTPKG_WORKER_URL");
    console.log("  DRAFTPKG_API_KEY");
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
