# Install dochost in Hermes

Hermes loads skills from its skills directory and can call any HTTP endpoint, so
the self-contained `dochost-publish` skill works directly — no MCP wiring required.

## Prerequisite

Create a dochost API key at <https://dochost.io> → **Settings → API keys**, and
make it available to your Hermes agent as `DOCHOST_API_KEY` (environment / secret).

## Install the skill

Drop the skill folder into your Hermes skills directory (the folder Hermes scans
for `SKILL.md` bundles — commonly `.hermes/skills/` in your agent workspace, or the
path your Hermes config points at):

```bash
git clone https://github.com/zyli5313/dochost-mcp
mkdir -p .hermes/skills
cp -r dochost-mcp/skills/dochost-publish .hermes/skills/dochost-publish
```

Reload Hermes (restart the agent or re-scan skills). The skill's frontmatter
`description` tells Hermes to invoke it when you ask to publish or share a document.

## Optional — native MCP tools

If your Hermes build supports remote MCP servers, you can register dochost the same
way as any HTTP MCP, authenticating with the key as a Bearer header:

```json
{
  "mcpServers": {
    "dochost": {
      "url": "https://dochost.io/api/mcp",
      "headers": { "Authorization": "Bearer ${DOCHOST_API_KEY}" }
    }
  }
}
```

(Consult your Hermes MCP config docs for the exact file location; the URL + header
shape above is standard for remote streamable-HTTP MCP servers.)

## Verify

Ask Hermes: *"Publish this note as a dochost page and send me the link."* You should
get a `https://dochost.io/d/…` URL back.
