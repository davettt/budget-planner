import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { get } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let child;
let dataDirectory;
let baseUrl;

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('No test port'));
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The child may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Budget Planner did not start within 5 seconds');
}

export async function startTestServer() {
  const port = await availablePort();
  dataDirectory = await mkdtemp(join(tmpdir(), 'budget-planner-smoke-'));
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDirectory },
    stdio: 'ignore',
  });
  await waitForServer(`${baseUrl}/api/build-status`);
  return baseUrl;
}

export async function stopTestServer() {
  child?.kill('SIGTERM');
  if (dataDirectory) await rm(dataDirectory, { recursive: true, force: true });
}

export async function api(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
}

export function requestWithHost(path, host) {
  return new Promise((resolve, reject) => {
    const request = get(`${baseUrl}${path}`, { headers: { Host: host } }, (response) => {
      response.resume();
      response.once('end', () => resolve(response.statusCode));
    });
    request.once('error', reject);
  });
}
