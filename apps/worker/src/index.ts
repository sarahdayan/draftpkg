export interface Env {
  METADATA: KVNamespace;
  TARBALLS: R2Bucket;
  API_KEY?: string;
}

export default {
  async fetch(_request: Request, _env: Env): Promise<Response> {
    return new Response("Not implemented", { status: 501 });
  },
} satisfies ExportedHandler<Env>;
