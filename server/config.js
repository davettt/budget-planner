import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'local_data');
export const PORT = process.env.PORT || 3012;
export const HOST = process.env.HOST || '127.0.0.1';
