# draftpkg

CLI tool for [Draftpkg](https://github.com/draftpkg/draftpkg) — a self-hosted drop-in replacement for CodeSandbox CI that automatically builds npm packages from pull requests and publishes them to a private registry.

## Usage

```sh
npx draftpkg setup
```

This deploys a Cloudflare Worker that serves as your private npm registry. It will:

1. Create a KV namespace for metadata
2. Create an R2 bucket for tarballs
3. Deploy the Worker
4. Generate an API key

**Prerequisites:** a [Cloudflare account](https://dash.cloudflare.com/sign-up) and [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) logged in (`wrangler login`).

## What's next?

After setup, add the [Draftpkg GitHub Action](https://github.com/draftpkg/action) to your repositories. See the [full documentation](https://github.com/draftpkg/draftpkg) for details.

## License

MIT
