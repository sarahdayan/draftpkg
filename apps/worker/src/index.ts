import { parseRegistryUrl } from "@draftpkg/config";
import type { ParsedRegistryUrl } from "@draftpkg/config";

export interface Env {
  METADATA: KVNamespace;
  TARBALLS: R2Bucket;
  API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
} satisfies ExportedHandler<Env>;

function r2Key(org: string, repo: string, sha: string, packageName: string) {
  return `${org}/${repo}/${sha}/${packageName}.tgz`;
}

function kvKey(org: string, repo: string, sha: string, packageName: string) {
  return `${org}/${repo}/${sha}/${packageName}`;
}

async function handleGet(
  parsed: ParsedRegistryUrl,
  env: Env,
): Promise<Response> {
  const key = r2Key(parsed.org, parsed.repo, parsed.sha, parsed.packageName);
  const object = await env.TARBALLS.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: { "content-type": "application/gzip" },
  });
}

async function handlePost(
  request: Request,
  parsed: ParsedRegistryUrl,
  env: Env,
): Promise<Response> {
  if (!env.API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const auth = request.headers.get("authorization");

  if (auth !== `Bearer ${env.API_KEY}`) {
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
