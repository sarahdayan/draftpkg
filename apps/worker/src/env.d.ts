declare module "cloudflare:test" {
  interface ProvidedEnv {
    METADATA: KVNamespace;
    TARBALLS: R2Bucket;
    API_KEY?: string;
  }
}
