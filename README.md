# Draftpkg

A self-hosted drop-in replacement for [CodeSandbox CI](https://codesandbox.io/docs/learn/ci). Draftpkg automatically builds npm packages from pull requests and publishes them to a private registry, so developers can test unreleased library changes with standard `npm install`.

## Setup

### 1. Deploy the Worker

The Worker serves as your private registry. It runs on Cloudflare Workers with R2 (storage) and KV (metadata).

**Prerequisites:** a Cloudflare account.

```sh
# Clone this repo
git clone https://github.com/draftpkg/draftpkg.git
cd draftpkg

# Install dependencies
pnpm install

# Configure your Cloudflare account
cd apps/worker

# Edit wrangler.toml:
# - Set a KV namespace ID (create one with `wrangler kv namespace create METADATA`)
# - Set your R2 bucket name (create one with `wrangler r2 bucket create draftpkg-tarballs`)

# Deploy
wrangler deploy

# Set your API key as a secret
wrangler secret put API_KEY
```

Your registry is now live at `https://draftpkg-worker.<your-subdomain>.workers.dev`.

### 2. Add the Action to your repo

In the repository you want to build packages from:

**Add a config file** at `.draftpkg/ci.json` (or reuse your existing `.codesandbox/ci.json`):

```json
{
  "installCommand": "install",
  "buildCommand": "build",
  "packages": ["packages/*"]
}
```

**Add the workflow** at `.github/workflows/draftpkg.yml`:

```yaml
name: Draftpkg

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: draftpkg/action@main
        with:
          worker-url: ${{ secrets.DRAFTPKG_WORKER_URL }}
          api-key: ${{ secrets.DRAFTPKG_API_KEY }}
          sha: ${{ github.event.pull_request.head.sha }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Add secrets** to your repo (Settings > Secrets and variables > Actions):

- `DRAFTPKG_WORKER_URL` — your Worker URL (e.g. `https://draftpkg-worker.example.workers.dev`)
- `DRAFTPKG_API_KEY` — the API key you set with `wrangler secret put`

### 3. Open a PR

When a PR is opened or updated, Draftpkg will:

1. Build your packages
2. Upload them to your registry
3. Post a comment on the PR with install URLs

Install a draft build in any project:

```sh
npm install https://pkg.example.com/your-org/your-repo/commit/abc123/your-package
```

## `ci.json` reference

Place this file at `.draftpkg/ci.json` or `.codesandbox/ci.json`. If both exist, `.draftpkg/ci.json` takes precedence.

| Field              | Type              | Default     | Description                                                               |
| ------------------ | ----------------- | ----------- | ------------------------------------------------------------------------- |
| `installCommand`   | `string \| false` | `"install"` | Script in package.json to run for install. Set to `false` to skip.        |
| `buildCommand`     | `string \| false` | `"build"`   | Script in package.json to run for build. Set to `false` to skip.          |
| `packages`         | `string[]`        | `["."]`     | Paths or glob patterns to packages. For monorepos, e.g. `["packages/*"]`. |
| `publishDirectory` | `object`          | `{}`        | Map of package name to directory to pack from, relative to repo root.     |
| `node`             | `string`          | `"24"`      | Node.js version to use for building.                                      |

### Example: monorepo with custom publish directories

```json
{
  "buildCommand": "build",
  "packages": ["packages/react", "packages/react-dom"],
  "publishDirectory": {
    "react": "build/node_modules/react",
    "react-dom": "build/node_modules/react-dom"
  }
}
```

## URL scheme

```
https://<worker-url>/<org>/<repo>/commit/<sha>/<package-name>
```

Scoped packages use their full name:

```
https://pkg.example.com/algolia/instantsearch/commit/abc123/@algolia/client-search
```

## Architecture

```
apps/
  action/     GitHub Action — builds, packs, uploads, comments on PRs
  worker/     Cloudflare Worker — upload API (authed) + registry (public)

packages/
  config/     Shared types, ci.json parser, URL helpers
```

## Development

```sh
pnpm install
pnpm test        # unit tests
pnpm check-types # type checking
```

## License

MIT
