import crypto from "node:crypto";

import type { Executor } from "./executor";

export interface SetupResult {
  workerUrl: string;
  apiKey: string;
}

export async function setup(executor: Executor): Promise<SetupResult> {
  // 1. Check login
  try {
    await executor.run("wrangler whoami");
  } catch {
    throw new Error(
      "Not logged in to Wrangler. Run `wrangler login` first.",
    );
  }

  // 2. Create KV namespace
  await executor.run("wrangler kv namespace create METADATA");

  // 3. Create R2 bucket
  await executor.run("wrangler r2 bucket create draftpkg-tarballs");

  // 4. Deploy worker
  const { stdout } = await executor.run("wrangler deploy");
  const urlMatch = stdout.match(/https:\/\/[^\s]+\.workers\.dev/);
  const workerUrl = urlMatch?.[0] ?? "";

  // 5. Generate and set API key
  const apiKey = crypto.randomUUID();
  await executor.run(
    `echo "${apiKey}" | wrangler secret put API_KEY`,
  );

  return { workerUrl, apiKey };
}
