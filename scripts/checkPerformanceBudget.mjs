import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const KiB = 1024;
const budgets = {
  entryRawBytes: 420 * KiB,
  largestChunkRawBytes: 1800 * KiB,
  totalJsRawBytes: 2050 * KiB,
  totalJsGzipBytes: 560 * KiB,
};

const distDirectory = new URL('../dist/', import.meta.url);
const assetsDirectory = new URL('assets/', distDirectory);
const indexHtml = await readFile(new URL('index.html', distDirectory), 'utf8');
const assetNames = await readdir(assetsDirectory);
const jsNames = assetNames.filter((name) => name.endsWith('.js')).sort();

if (jsNames.length < 3) {
  throw new Error(
    `Performance budget failed: expected split application, Phaser and diagnostics chunks, found ${jsNames.length} JavaScript files.`,
  );
}

const chunks = await Promise.all(
  jsNames.map(async (name) => {
    const url = new URL(name, assetsDirectory);
    const body = await readFile(url);
    const metadata = await stat(url);
    return {
      name,
      rawBytes: metadata.size,
      gzipBytes: gzipSync(body).byteLength,
    };
  }),
);

const entryMatch = indexHtml.match(/src="\/assets\/(index-[^"]+\.js)"/);
if (!entryMatch) {
  throw new Error(
    'Performance budget failed: unable to identify the built application entry chunk.',
  );
}
const entry = chunks.find(({ name }) => name === entryMatch[1]);
if (!entry) {
  throw new Error(`Performance budget failed: missing entry chunk ${entryMatch[1]}.`);
}

const phaser = chunks.find(({ name }) => name.startsWith('phaser-'));
if (!phaser) {
  throw new Error('Performance budget failed: Phaser is not isolated in a stable vendor chunk.');
}

const diagnostics = chunks.find(({ name }) => name.startsWith('BrowserDiagnostics-'));
if (!diagnostics) {
  throw new Error(
    'Performance budget failed: browser diagnostics are not emitted as an on-demand chunk.',
  );
}
if (indexHtml.includes(diagnostics.name)) {
  throw new Error(
    'Performance budget failed: diagnostics are referenced by the initial HTML payload.',
  );
}

const totalRawBytes = chunks.reduce((total, chunk) => total + chunk.rawBytes, 0);
const totalGzipBytes = chunks.reduce((total, chunk) => total + chunk.gzipBytes, 0);
const largestChunk = chunks.reduce((largest, chunk) =>
  chunk.rawBytes > largest.rawBytes ? chunk : largest,
);

const failures = [];
if (entry.rawBytes > budgets.entryRawBytes) {
  failures.push(
    `entry ${entry.name} is ${(entry.rawBytes / KiB).toFixed(1)} KiB raw (budget ${(budgets.entryRawBytes / KiB).toFixed(0)} KiB)`,
  );
}
if (largestChunk.rawBytes > budgets.largestChunkRawBytes) {
  failures.push(
    `largest chunk ${largestChunk.name} is ${(largestChunk.rawBytes / KiB).toFixed(1)} KiB raw (budget ${(budgets.largestChunkRawBytes / KiB).toFixed(0)} KiB)`,
  );
}
if (totalRawBytes > budgets.totalJsRawBytes) {
  failures.push(
    `total JavaScript is ${(totalRawBytes / KiB).toFixed(1)} KiB raw (budget ${(budgets.totalJsRawBytes / KiB).toFixed(0)} KiB)`,
  );
}
if (totalGzipBytes > budgets.totalJsGzipBytes) {
  failures.push(
    `total JavaScript is ${(totalGzipBytes / KiB).toFixed(1)} KiB gzip (budget ${(budgets.totalJsGzipBytes / KiB).toFixed(0)} KiB)`,
  );
}

if (failures.length > 0) {
  throw new Error(`Performance budget failed:\n- ${failures.join('\n- ')}`);
}

console.log('Performance bundle budget passed.');
for (const chunk of chunks) {
  console.log(
    `- ${chunk.name}: ${(chunk.rawBytes / KiB).toFixed(1)} KiB raw / ${(chunk.gzipBytes / KiB).toFixed(1)} KiB gzip`,
  );
}
console.log(
  `Total: ${(totalRawBytes / KiB).toFixed(1)} KiB raw / ${(totalGzipBytes / KiB).toFixed(1)} KiB gzip`,
);
