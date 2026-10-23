#!/usr/bin/env node
// Gemral Edge MCP — stdio proxy to the remote server at https://mcp.gemral.com/mcp
// Zero dependencies (Node >= 18). Reads newline-delimited JSON-RPC on stdin, writes responses on stdout.
//
// With GEMRAL_EDGE_API_KEY set: every message is forwarded to the remote server (Streamable HTTP).
// Without a key: initialize / tools/list are answered from the bundled tools.json (generated from the
// live server's tools/list), and tools/call returns an error explaining how to get access.
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const URL_ = process.env.GEMRAL_EDGE_MCP_URL || 'https://mcp.gemral.com/mcp';
const KEY = (process.env.GEMRAL_EDGE_API_KEY || '').trim();
const PKG = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const TOOLS = JSON.parse(readFileSync(new URL('./tools.json', import.meta.url), 'utf8'));
const NO_KEY_MSG = 'GEMRAL_EDGE_API_KEY is not set. Get a key at https://gemral.com/edge/connect, '
  + 'or connect your client directly to https://mcp.gemral.com/mcp (OAuth sign-in, free tier).';

let sessionId = null;
const out = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const err = (id, code, message) => out({ jsonrpc: '2.0', id, error: { code, message } });

function local(msg) {
  const { id, method } = msg;
  if (method === 'initialize') {
    return out({ jsonrpc: '2.0', id, result: {
      protocolVersion: msg.params?.protocolVersion || '2025-06-18',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'gemral-edge', version: PKG.version },
      instructions: NO_KEY_MSG } });
  }
  if (method === 'ping') return out({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return out({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  if (method === 'tools/call') {
    return out({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: NO_KEY_MSG }] } });
  }
  if (id !== undefined && id !== null) err(id, -32601, `method not found: ${method}`);
}

async function forward(msg) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${KEY}`, 'User-Agent': `gemral-edge-mcp-proxy/${PKG.version}` };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  let res;
  try {
    res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify(msg) });
  } catch (e) {
    if (msg.id != null) err(msg.id, -32603, `network error: ${e.message}`);
    return;
  }
  sessionId = res.headers.get('mcp-session-id') || sessionId;
  const text = await res.text();
  if (msg.id == null) return; // notification: nothing to write back
  if (!res.ok) {
    let detail = text.slice(0, 300);
    try { detail = JSON.parse(text).error ?? detail; } catch { /* keep raw text */ }
    return err(msg.id, -32000, `HTTP ${res.status}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  const body = text.trimStart().startsWith('{') || text.trimStart().startsWith('[')
    ? text
    : text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).pop() || '';
  try {
    const parsed = JSON.parse(body);
    for (const m of Array.isArray(parsed) ? parsed : [parsed]) out(m);
  } catch {
    err(msg.id, -32603, 'invalid response from remote server');
  }
}

const rl = createInterface({ input: process.stdin });
let queue = Promise.resolve();
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return err(null, -32700, 'Parse error'); }
  // Keep order: each message waits for the previous one (initialize must finish before tools/list).
  queue = queue.then(() => (KEY ? forward(msg) : local(msg))).catch((e) => process.stderr.write(String(e) + '\n'));
});
rl.on('close', () => { queue.then(() => process.exit(0)); });
