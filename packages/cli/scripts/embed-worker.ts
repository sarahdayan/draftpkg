import fs from "node:fs";
import path from "node:path";

const workerSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../../apps/worker/src/index.ts"),
  "utf-8",
);

const output = `// Auto-generated — do not edit. Source: apps/worker/src/index.ts
export const WORKER_SOURCE = ${JSON.stringify(workerSource)};
`;

fs.writeFileSync(
  path.resolve(import.meta.dirname, "../src/worker-source.ts"),
  output,
);
