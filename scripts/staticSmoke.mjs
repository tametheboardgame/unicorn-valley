import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const distDirectory = new URL('../dist/', import.meta.url);
const indexUrl = new URL('index.html', distDirectory);
const indexHtml = await readFile(indexUrl, 'utf8');

if (!indexHtml.includes('<title>Unicorn Valley</title>')) {
  throw new Error(
    'Static build smoke failed: dist/index.html is missing the Unicorn Valley title.',
  );
}

const referencedPaths = [
  ...new Set(
    [...indexHtml.matchAll(/(?:src|href)="(\/[^"#?]+)(?:[?#][^"]*)?"/g)].map((match) => match[1]),
  ),
];

if (!referencedPaths.some((path) => path.startsWith('/assets/'))) {
  throw new Error(
    'Static build smoke failed: dist/index.html contains no built /assets/ reference.',
  );
}

for (const referencedPath of referencedPaths) {
  await readFile(new URL(referencedPath.slice(1), distDirectory));
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const relativePath = requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname.slice(1);
    const body = await readFile(new URL(relativePath, distDirectory));
    response.writeHead(200);
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

try {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Static build smoke failed: local smoke server did not expose a TCP port.');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const smokePaths = ['/', '/?scene=resize-test', ...referencedPaths];

  for (const smokePath of smokePaths) {
    const response = await fetch(`${baseUrl}${smokePath}`);
    if (!response.ok) {
      throw new Error(`Static build smoke failed: ${smokePath} returned HTTP ${response.status}.`);
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log(`Static build smoke passed for ${referencedPaths.length} referenced assets.`);
