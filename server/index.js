import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath });
}

import express from 'express';
import cors from 'cors';
import router from './router.js';
import { HOST, PORT } from './config.js';

let buildStale = false;
try {
  const mod = await import('./buildCheck.js');
  buildStale = mod.buildStale;
} catch {
  buildStale = false;
}

export function startServer(port) {
  const app = express();
  const resolvedPort = port || parseInt(process.env.PORT, 10) || PORT;

  const allowedOrigins = new Set([
    `http://localhost:${resolvedPort}`,
    `http://127.0.0.1:${resolvedPort}`,
  ]);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const host = req.headers.host;
    if (host && host !== `localhost:${resolvedPort}` && host !== `127.0.0.1:${resolvedPort}`) {
      return res.status(403).json({ error: 'Invalid host' });
    }
    res.set({
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    next();
  });
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, !origin || allowedOrigins.has(origin));
      },
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.get('/api/build-status', (_req, res) => {
    res.json({ stale: buildStale });
  });

  app.use(router);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const server = app.listen(resolvedPort, HOST, () => {
    console.log(`Budget Planner running on http://${HOST}:${resolvedPort}`);
  });

  return { app, server, port: resolvedPort };
}

startServer();
