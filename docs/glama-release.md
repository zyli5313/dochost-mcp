# Glama ownership and quality evaluation

The directory entry is https://glama.ai/mcp/servers/zyli5313/dochost-mcp.
The root `glama.json` already identifies `zyli5313` as its maintainer.

## Claim

Sign in to Glama with the GitHub account `zyli5313`, open the entry and choose
**Claim**. Confirm that the author is verified on its **Score** page. Committing
`glama.json` alone does not complete the account association.

## Build and release

This repository now includes a runnable stdio bridge and a Dockerfile. The bridge
uses the actual hosted endpoint, including its live tool descriptions, schemas,
resource definitions and responses. It does not simulate tools or embed a
catalog just for evaluation. It requires outbound HTTPS access to `dochost.io`.

1. Open https://glama.ai/mcp/servers/zyli5313/dochost-mcp/admin and sync the server
   with GitHub so Glama sees the current `main` branch.
2. Open https://glama.ai/mcp/servers/zyli5313/dochost-mcp/admin/dockerfile.
3. Use the checked-in Dockerfile if the interface supports it. For a generated
   build spec, use Node.js 22 or newer, run `npm ci --omit=dev --ignore-scripts`
   in the repository root, and set CMD to `["node", "server/index.js"]`.
   There are no required environment variables or placeholder parameters for
   discovery. `DOCHOST_API_KEY` is optional and is only needed for authenticated
   execution in a headless container; never put an account key in the build spec,
   Dockerfile or repository.
4. Click **Build**. Check that initialization and tool discovery succeed, then
   choose **Make Release**, version `1.2.0`, and publish (or use **Build & Release**).
5. Wait for the **Score** page to display a quality grade. A successful local
   test, GitHub commit or GitHub release is not a Glama evaluation.

Anonymous discovery exposes public protocol metadata only. Page and account
operations retain the hosted service's authentication and entitlement checks.
For normal interactive use, the hosted HTTP endpoint with OAuth remains the
recommended connection. Headless deployments can supply their own
`DOCHOST_API_KEY` as a runtime secret.

## Local validation

```sh
npm ci --ignore-scripts
npm run test:smoke
docker build -t dochost-mcp .
docker run --rm -i dochost-mcp
```

The smoke test runs an isolated anonymous MCP client, checks initialization,
tool discovery, ping and advertised resource discovery, and compares the
forwarded tools against the live HTTP catalog. It never calls a tool or uses
saved credentials. Docker communicates over stdin/stdout and needs no exposed
port. To execute tools in a headless container, pass an existing runtime secret:

```sh
docker run --rm -i -e DOCHOST_API_KEY dochost-mcp
```

See Glama's [release guide](https://glama.ai/blog/2026-03-15-how-to-make-a-release)
and [ownership guide](https://glama.ai/blog/2025-07-08-what-is-glamajson).
