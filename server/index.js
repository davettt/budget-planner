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
import { PORT } from './config.js';

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

  app.use(cors({ origin: `http://localhost:${resolvedPort}` }));
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

  const server = app.listen(resolvedPort, () => {
    console.log(`Budget Planner running on http://localhost:${resolvedPort}`);
  });

  return { app, server, port: resolvedPort };
}

startServer();
