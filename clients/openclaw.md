# Install dochost in OpenClaw

OpenClaw can publish to dochost two ways. The **skill** path works everywhere and
is the recommended default; the **MCP** path gives the agent native `publish` /
`list_my_pages` tools if you prefer.

## Prerequisite (both paths)

Create a dochost API key: sign in at <https://dochost.io> → **Settings → API keys**.
Export it where your OpenClaw agent runs:

```bash
export DOCHOST_API_KEY="dk_live_…"
```

(Add it to your agent host's environment / secrets so it persists.)

## Path A — install the skill (recommended)

The skill is published on ClawHub and lives in this repo under
`skills/dochost-publish/`.

```bash
# From ClawHub:
openclaw skills install dochost-publish
#   or, equivalently:
clawhub install dochost-publish

# Or straight from this repo (no ClawHub needed):
git clone https://github.com/zyli5313/dochost-mcp
cp -r dochost-mcp/skills/dochost-publish ./skills/dochost-publish
```

`clawhub install` drops the skill into `./skills/dochost-publish` and records the
version in `.clawhub/lock.json`. Your agent now knows to publish to dochost when
you say "share this as a link" / "发布到 dochost".

## Path B — add the MCP server (native tools)

Add the remote server to your mcporter config (`~/.config/mcporter/config.json`),
passing the key as an `Authorization` header:

```json
{
  "mcpServers": {
    "dochost": {
      "url": "https://dochost.io/api/mcp",
      "headers": {
        "Authorization": "Bearer ${DOCHOST_API_KEY}"
      }
    }
  }
}
```

The agent gets two tools: `publish` and `list_my_pages`. (If your OpenClaw build
supports interactive OAuth instead of an API key, you can omit the header and
authorize in the browser — but for a headless Telegram agent the API key is simpler.)

## Verify

Ask your agent: *"Publish 'hello from openclaw' as a markdown page and give me the
link."* You should get back a `https://dochost.io/d/…` URL.
