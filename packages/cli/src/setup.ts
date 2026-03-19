import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { Executor } from "./executor";

export interface SetupResult {
  workerUrl: string;
  apiKey: string;
}

const WORKER_SOURCE = `import { parseRegistryUrl } from "@draftpkg/config";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parsed = parseRegistryUrl(url.pathname);

    if (!parsed) {
      return new Response("Not found", { status: 404 });
    }

    switch (request.method) {
      case "GET":
        return handleGet(parsed, env);
      case "POST":
        return handlePost(request, parsed, env);
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  },
};

function r2Key(org, repo, sha, packageName) {
  return \`\${org}/\${repo}/\${sha}/\${packageName}.tgz\`;
}

function kvKey(org, repo, sha, packageName) {
  return \`\${org}/\${repo}/\${sha}/\${packageName}\`;
}

async function handleGet(parsed, env) {
  const key = r2Key(parsed.org, parsed.repo, parsed.sha, parsed.packageName);
  const object = await env.TARBALLS.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: { "content-type": "application/gzip" },
  });
}

async function handlePost(request, parsed, env) {
  if (!env.API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const auth = request.headers.get("authorization");

  if (auth !== \`Bearer \${env.API_KEY}\`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.arrayBuffer();
  const key = r2Key(parsed.org, parsed.repo, parsed.sha, parsed.packageName);

  await env.TARBALLS.put(key, body);

  await env.METADATA.put(
    kvKey(parsed.org, parsed.repo, parsed.sha, parsed.packageName),
    JSON.stringify({
      org: parsed.org,
      repo: parsed.repo,
      sha: parsed.sha,
      packageName: parsed.packageName,
    }),
  );

  return new Response("Created", { status: 201 });
}
`;

function buildWranglerToml(kvNamespaceId: string): string {
  return `name = "draftpkg-worker"
main = "src/index.js"
compatibility_date = "2025-05-26"

[[kv_namespaces]]
binding = "METADATA"
id = "${kvNamespaceId}"

[[r2_buckets]]
binding = "TARBALLS"
bucket_name = "draftpkg-tarballs"
`;
}

const PACKAGE_JSON = JSON.stringify(
  {
    name: "draftpkg-worker",
    private: true,
    dependencies: {
      "@draftpkg/config": "latest",
    },
  },
  null,
  2,
);

function parseKvNamespaceId(output: string): string {
  const match = output.match(/id\s*=\s*"([^"]+)"/);

  if (!match) {
    throw new Error("Failed to parse KV namespace ID from wrangler output");
  }

  return match[1]!;
}

export async function setup(
  targetDir: string,
  executor: Executor,
): Promise<SetupResult> {
  // 1. Check login
  try {
    await executor.run("wrangler whoami");
  } catch {
    throw new Error(
      "Not logged in to Wrangler. Run `wrangler login` first.",
    );
  }

  // 2. Create KV namespace
  const { stdout: kvOutput } = await executor.run(
    "wrangler kv namespace create METADATA",
  );
  const kvNamespaceId = parseKvNamespaceId(kvOutput);

  // 3. Create R2 bucket
  await executor.run("wrangler r2 bucket create draftpkg-tarballs");

  // 4. Scaffold project
  await fs.mkdir(path.join(targetDir, "src"), { recursive: true });
  await fs.writeFile(
    path.join(targetDir, "src/index.js"),
    WORKER_SOURCE,
  );
  await fs.writeFile(
    path.join(targetDir, "wrangler.toml"),
    buildWranglerToml(kvNamespaceId),
  );
  await fs.writeFile(
    path.join(targetDir, "package.json"),
    PACKAGE_JSON,
  );

  // 5. Install dependencies
  await executor.run("npm install", { cwd: targetDir });

  // 6. Deploy
  const { stdout: deployOutput } = await executor.run("wrangler deploy", {
    cwd: targetDir,
  });
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.workers\.dev/);
  const workerUrl = urlMatch?.[0] ?? "";

  // 7. Set API key
  const apiKey = crypto.randomUUID();
  await executor.run(
    `echo "${apiKey}" | wrangler secret put API_KEY`,
    { cwd: targetDir },
  );

  return { workerUrl, apiKey };
}
