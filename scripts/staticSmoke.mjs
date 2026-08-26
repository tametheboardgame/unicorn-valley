import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const distDirectory = new URL('../dist/', import.meta.url);
const indexUrl = new URL('index.html', distDirectory);
const headersUrl = new URL('_headers', distDirectory);
const indexHtml = await readFile(indexUrl, 'utf8');
const headersText = (await readFile(headersUrl, 'utf8')).replaceAll('\r\n', '\n');

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

const builtAssetPaths = referencedPaths.filter((path) => path.startsWith('/assets/'));
if (builtAssetPaths.length === 0) {
  throw new Error(
    'Static build smoke failed: dist/index.html contains no built /assets/ reference.',
  );
}

for (const assetPath of builtAssetPaths) {
  if (!/\/assets\/[^/?]+-[A-Za-z0-9_-]{6,}\.(?:js|css)$/.test(assetPath)) {
    throw new Error(
      `Static build smoke failed: ${assetPath} is not a fingerprinted JavaScript or CSS asset.`,
    );
  }
}

const requiredCacheRules = [
  '/\n  Cache-Control: no-cache',
  '/index.html\n  Cache-Control: no-cache',
  '/assets/*\n  Cache-Control: public, max-age=31536000, immutable',
];
for (const requiredRule of requiredCacheRules) {
  if (!headersText.includes(requiredRule)) {
    throw new Error(
      `Static build smoke failed: dist/_headers is missing required cache rule ${JSON.stringify(requiredRule)}.`,
    );
  }
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

console.log(
  `Static build smoke passed for ${referencedPaths.length} referenced assets with deployment cache policy.`,
);
