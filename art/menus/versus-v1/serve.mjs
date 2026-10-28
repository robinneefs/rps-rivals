import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const types = { '.html': 'text/html', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf' };
http.createServer(async (request, response) => {
  try {
    const file = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://local').pathname)}`);
    if (!file.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(5193, '127.0.0.1');
