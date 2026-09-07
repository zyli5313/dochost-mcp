#!/usr/bin/env node

// Forward the live server's protocol, tools, schemas and responses unchanged.
// Anonymous discovery works; tool execution still requires dochost auth.
const args = [
  'https://dochost.io/api/mcp',
  '--transport',
  'http-only',
  '--silent',
];

if (process.env.DOCHOST_API_KEY) {
  // mcp-remote expands this variable internally; do not put the key in argv.
  args.push('--header', 'Authorization: Bearer ${DOCHOST_API_KEY}');
}

process.argv.splice(2, process.argv.length - 2, ...args);
await import('mcp-remote/dist/proxy.js');
