# dochost MCP server

[![dochost-mcp MCP server](https://glama.ai/mcp/servers/zyli5313/dochost-mcp/badges/score.svg)](https://glama.ai/mcp/servers/zyli5313/dochost-mcp)

English | [简体中文](./README.zh-CN.md)

Publish **Markdown or HTML to a clean, shareable link** — straight from your AI
assistant. The dochost MCP server gives Claude, ChatGPT, Cursor and any other MCP
client eight tools — `publish`, `update_page`, `get_page_content`,
`set_page_options`, `list_my_pages`, `get_page`, `get_account`, `delete_page` — so your assistant can hand back a public
[dochost](https://dochost.io) link and then keep maintaining it. No copy-paste,
no separate dashboard.

- 🌐 Website: **https://dochost.io**
- 🔌 MCP server: **https://dochost.io/mcp**
- 🛰️ Endpoint: `https://dochost.io/api/mcp` (Streamable HTTP, OAuth)
- 🔑 Auth: OAuth sign-in — **no API keys**

## Why

Your LLM produced a report, a README, an HTML artifact. Sending it shouldn't mean
a screenshot or a raw `.md` blob. dochost turns that output into a normal web page
at its own URL, in one tool call. Markdown **and** HTML are rendered live.

## Quick start

**Claude Code** (one line):

```bash
claude mcp add --transport http dochost https://dochost.io/api/mcp
```

Then run `/mcp` inside Claude Code and approve in the browser. Add `--scope user`
to use it in every project.

**Gemini CLI** (extension):

```bash
gemini extensions install https://github.com/zyli5313/dochost-mcp
```

Or add a remote HTTP server in `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "dochost": {
      "httpUrl": "https://dochost.io/api/mcp"
    }
  }
}
```

**Claude Desktop / Cursor / VS Code / Windsurf** — add a remote HTTP server:

```json
{
  "mcpServers": {
    "dochost": {
      "type": "http",
      "url": "https://dochost.io/api/mcp"
    }
  }
}
```

You authorize once via OAuth in the browser; the assistant then publishes **as
you**, and output follows your dochost plan's entitlements.

## Stdio / Docker bridge

For clients or directory evaluators that need a local stdio process, this
repository includes a bridge to the same hosted MCP endpoint:

```sh
npm ci --ignore-scripts
node server/index.js
```

Or run it in Docker:

```sh
docker build -t dochost-mcp .
docker run --rm -i dochost-mcp
```

Node.js 22 or newer is required. The bridge forwards the live tools and schemas;
it is not a self-hosted copy of the dochost application. Initialization and
tool discovery are public. Interactive clients can use OAuth; headless tool
execution needs an existing `DOCHOST_API_KEY` runtime secret (Docker:
`docker run --rm -i -e DOCHOST_API_KEY dochost-mcp`).

Maintainers: see [Glama claim, build and release instructions](docs/glama-release.md).

## Which auth method?

| Client | Recommended auth | Why |
|---|---|---|
| **OpenClaw**, **Hermes** | **API key** | Headless agents (e.g. a Telegram orchestrator). A static Bearer key works with the plain-HTTP skill and any MCP runner, with no browser step per session. |
| Claude, Cursor, ChatGPT, VS Code, Windsurf, and all other MCP clients | **OAuth** | One browser approval, nothing long-lived stored in config; the assistant publishes **as you**. |

Keep the API key like any secret: store it as an environment variable / host
secret (never commit it), and revoke or rotate it from **Settings → API keys** if
it leaks.

## Agents (OpenClaw, Hermes) — API key

OpenClaw and Hermes are headless, so they authenticate with an **API key**. Create
one at [dochost.io](https://dochost.io) → **Settings → API keys**, export it as
`DOCHOST_API_KEY`, and either:

- **Install the skill** — a self-contained `publish` skill that works on any agent
  that can make an HTTP request: [`skills/dochost-publish/`](./skills/dochost-publish/SKILL.md).
- **Wire the MCP** — point the agent at `https://dochost.io/api/mcp` with the key as
  a Bearer header: [`examples/mcporter.config.json`](./examples/mcporter.config.json).

Per-host install guides:

- **OpenClaw** → [`clients/openclaw.md`](./clients/openclaw.md)
- **Hermes** → [`clients/hermes.md`](./clients/hermes.md)

One-shot from a shell: [`examples/publish.sh`](./examples/publish.sh).

## Tools

Eight tools. `publish` creates; the rest let the assistant keep working with what it
already published, instead of stranding a link every time you revise something.

### `publish`
Publish Markdown or HTML as a hosted page and get a shareable URL.

| Parameter | Type | Notes |
|---|---|---|
| `body` | string (required) | The Markdown or HTML content to publish. |
| `format` | `"markdown"` \| `"html"` | Auto-detected when omitted. |
| `public` | boolean | List on Explore. Defaults to `false` (unlisted). |
| `customSlug` | string · Pro | Choose the link path instead of a random slug. |
| `password` | string · Pro | Gate the page behind a password. |
| `noBranding` | boolean · Pro | Hide the dochost footer badge. |

Returns `url`, `slug`, `expiresAt`, and an `editToken`.

> Example: *"Publish my Q3 report as a private page with a password."* →
> `dochost.co/d/q3-report` (password-gated, 7-day link on free).

### `update_page`
Replace the content of a page **in place**. The URL, view/like counts and expiry
all survive — only `body`, `format` and `title` change.

| Parameter | Type | Notes |
|---|---|---|
| `slug` | string (required) | The page to update. |
| `body` | string (required) | The new Markdown or HTML content. |
| `format` | `"markdown"` \| `"html"` | Auto-detected when omitted. |
| `title` | string | Override the derived title. |

> Prefer this over publishing again whenever you are revising something already
> published — a second `publish` mints a second link and strands the one the
> reader already has. Resending identical content is a no-op.

### `get_page_content`
Read back the **current** Markdown or HTML of one of your pages by `slug`. Call it
before `update_page` whenever the assistant did not write the live content itself
in the same conversation — `update_page` replaces the body wholesale, so editing
from memory silently discards edits made elsewhere, including in the browser.
Returns `version` and `sha256`; pass them to `update_page` as `ifVersion` /
`ifSha` so the write is refused instead of overwriting a change it did not read.
Expired pages are readable, and updating one republishes it on the same URL.

### `set_page_options`
Change a published page's visibility, search-engine indexing or password
**without republishing it** — the URL, view count and content stay the same.
Parameters: `slug` (required), `public`, `searchable`, `password`,
`removePassword`; send only the fields to change. Turning a paid capability off
never needs an entitlement; turning one on is checked against the current plan.
A password always forces the page private, so asking for both `public: true` and
a password is refused. Branding is not settable here.

### `list_my_pages`
List the pages you have published, newest first. Paginated (`limit`, `offset`);
returns compact records without page bodies.

### `get_page`
Look up one page by `slug`: title, format, status, view/like counts, expiry, and
whether it is password-protected. Never returns the body or the password.

### `get_account`
Your plan, page-quota usage and entitlement flags (size cap, custom slug,
password, branding). Worth calling before `publish` so the assistant knows your
limits up front instead of failing on them.

### `delete_page`
Permanently delete a page by `slug`. The link stops working immediately and the
slug is freed. Deleting an already-deleted page is a safe no-op.

## Notes

- Ownership and entitlements come from your authenticated account, never from
  tool input.
- Published pages live on **`dochost.co`**, a separate cookieless content origin
  — never on the app origin `dochost.io`. That is what lets dochost serve author
  HTML under a hardened policy without it touching your session. `dochost.io/d/…`
  permanently redirects to `dochost.co/d/…`, so old links keep working.
- Free links last 7 days; permanent links, password, custom slug, custom
  subdomain and branding removal are on the paid plans — see
  [dochost.io](https://dochost.io).

## Links

- Homepage — https://dochost.io
- MCP setup & docs — https://dochost.io/mcp

## License

MIT — see [LICENSE](./LICENSE).
