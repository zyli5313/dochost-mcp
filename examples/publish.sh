#!/usr/bin/env bash
# Publish a Markdown or HTML file to dochost and print the shareable URL.
#
# Usage:
#   export DOCHOST_API_KEY="dk_live_…"   # from dochost.io → Settings → API keys
#   ./publish.sh path/to/file.md
#   ./publish.sh path/to/file.html html
#
# Requires: curl, jq.
set -euo pipefail

FILE="${1:?usage: publish.sh <file> [markdown|html]}"
FORMAT="${2:-}"
: "${DOCHOST_API_KEY:?set DOCHOST_API_KEY (dochost.io → Settings → API keys)}"

# Auto-detect format from extension when not given.
if [[ -z "$FORMAT" ]]; then
  case "$FILE" in
    *.html|*.htm) FORMAT="html" ;;
    *) FORMAT="markdown" ;;
  esac
fi

BODY="$(cat "$FILE")"

RESPONSE="$(
  jq -nc --arg body "$BODY" --arg format "$FORMAT" \
    '{jsonrpc:"2.0",id:1,method:"tools/call",
      params:{name:"publish",arguments:{body:$body,format:$format}}}' \
  | curl -sS -X POST https://dochost.io/api/mcp \
      -H "Authorization: Bearer $DOCHOST_API_KEY" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      --data-binary @-
)"

PAYLOAD="$(jq -r '.result.content[0].text' <<<"$RESPONSE")"

if [[ "$(jq -r '.ok' <<<"$PAYLOAD")" == "true" ]]; then
  echo "Published: $(jq -r '.url' <<<"$PAYLOAD")"
  EXPIRES="$(jq -r '.expiresAt // "never"' <<<"$PAYLOAD")"
  echo "Expires:   $EXPIRES"
else
  echo "Publish failed: $(jq -r '.message // "unknown error"' <<<"$PAYLOAD")" >&2
  exit 1
fi
