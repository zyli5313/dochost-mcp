import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

// Exercise real anonymous discovery only: do not read or modify user pages.
const authDirectory = await mkdtemp(join(tmpdir(), 'dochost-mcp-smoke-'));
const env = { ...process.env, MCP_REMOTE_CONFIG_DIR: authDirectory };
delete env.DOCHOST_API_KEY;
const useDocker = process.argv.includes('--docker');
const child = spawn(useDocker ? 'docker' : process.execPath,
  useDocker ? ['run', '--rm', '-i', 'dochost-mcp:test'] : ['server/index.js'], {
  cwd: new URL('../', import.meta.url),
  env,
  stdio: ['pipe', 'pipe', 'inherit'],
});
const pending = new Map();
const lines = createInterface({ input: child.stdout });
let nextId = 0;

function rejectPending(error) {
  for (const request of pending.values()) request.reject(error);
  pending.clear();
}

lines.on('line', (line) => {
  try {
    const message = JSON.parse(line);
    assert.equal(message.jsonrpc, '2.0');
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  } catch (error) {
    rejectPending(error);
  }
});
child.on('error', rejectPending);
const exited = new Promise((resolve) => {
  child.on('exit', (code, signal) => {
    rejectPending(new Error(`Bridge exited: ${code ?? signal}`));
    resolve();
  });
});

function request(method, params) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 45_000);
    pending.set(id, {
      resolve: (result) => { clearTimeout(timeout); resolve(result); },
      reject: (error) => { clearTimeout(timeout); reject(error); },
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  });
}

try {
  const initialized = await request('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'dochost-discovery-smoke', version: '1.0.0' },
  });
  assert.equal(initialized.serverInfo.name, 'dochost');
  assert.ok(initialized.capabilities.tools);
  child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');

  const catalog = await request('tools/list', {});
  for (const name of [
    'publish', 'update_page', 'list_my_pages',
    'get_page', 'get_account', 'delete_page',
  ]) {
    const tool = catalog.tools.find((entry) => entry.name === name);
    assert.ok(tool, `Missing live tool: ${name}`);
    assert.ok(tool.description);
    assert.equal(tool.inputSchema.type, 'object');
  }

  const response = await fetch('https://dochost.io/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200);
  const direct = await response.json();
  assert.deepEqual(catalog.tools, direct.result.tools);
  assert.deepEqual(await request('ping'), {});
  if (initialized.capabilities.resources) {
    const resources = await request('resources/list');
    assert.ok(Array.isArray(resources.resources));
  }
  console.log(`PASS: anonymous initialize, ${catalog.tools.length} unchanged live tools, ping and advertised resources.`);
} finally {
  child.kill('SIGTERM');
  await exited;
  lines.close();
  await rm(authDirectory, { recursive: true, force: true });
}
