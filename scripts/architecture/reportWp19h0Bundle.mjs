import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const repositoryRoot = new URL('../../', import.meta.url);
const manifestUrl = new URL('dist/.vite/manifest.json', repositoryRoot);
const outputUrl = new URL('docs/evidence/wp19h0/baseline-bundle.json', repositoryRoot);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
const sourceCommit = process.env.BASELINE_SOURCE_COMMIT;

if (!sourceCommit) {
  throw new Error('Set BASELINE_SOURCE_COMMIT to the exact source checkpoint being measured.');
}

const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
if (!entryKey) throw new Error('No entry was found in dist/.vite/manifest.json.');

async function sizeFor(file) {
  const url = new URL(`dist/${file}`, repositoryRoot);
  const body = await readFile(url);
  return { rawBytes: (await stat(url)).size, gzipBytes: gzipSync(body).byteLength };
}

const javascript = [];
for (const [key, value] of Object.entries(manifest)) {
  if (!value.file.endsWith('.js')) continue;
  javascript.push({ key, file: value.file, ...(await sizeFor(value.file)) });
}
javascript.sort((left, right) => right.gzipBytes - left.gzipBytes);

function staticClosure(rootKey) {
  const visited = new Set();
  const visit = (key) => {
    if (visited.has(key)) return;
    visited.add(key);
    for (const dependency of manifest[key]?.imports ?? []) visit(dependency);
  };
  visit(rootKey);
  return [...visited];
}

const initialKeys = staticClosure(entryKey);
const byKey = new Map(javascript.map((chunk) => [chunk.key, chunk]));
const initialChunks = initialKeys.map((key) => byKey.get(key)).filter(Boolean);
const sum = (chunks, field) => chunks.reduce((total, chunk) => total + chunk[field], 0);
const entry = byKey.get(entryKey);
const dynamicEntries = (manifest[entryKey].dynamicImports ?? [])
  .map((key) => byKey.get(key))
  .filter(Boolean);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceCommit,
  measurement: {
    buildCommand: 'npm run build -- --manifest',
    reportCommand: `BASELINE_SOURCE_COMMIT=${sourceCommit} node scripts/architecture/reportWp19h0Bundle.mjs`,
    gzipMethod:
      'Node.js zlib.gzipSync over each emitted JavaScript file; sums are per-file gzip bytes',
    boundaries: {
      entry: 'application entry chunk only (legacy 520 KiB metric is raw bytes)',
      initial:
        'entry plus transitive static manifest imports fetched to evaluate the entry; includes Phaser',
      title:
        'same static closure as initial: TitleScene is statically registered through gameConfig',
      firstPlayable:
        'same static closure as title: MoonflowerGladeScene is statically registered through gameConfig; excludes asynchronously scheduled managers',
      total:
        'all emitted JavaScript, including optional, immediately scheduled and diagnostics chunks',
    },
  },
  counts: { javascriptChunks: javascript.length, manifestEntries: Object.keys(manifest).length },
  bytes: {
    entry: { raw: entry.rawBytes, gzip: entry.gzipBytes },
    initial: { raw: sum(initialChunks, 'rawBytes'), gzip: sum(initialChunks, 'gzipBytes') },
    titleGraph: { raw: sum(initialChunks, 'rawBytes'), gzip: sum(initialChunks, 'gzipBytes') },
    firstPlayableGraph: {
      raw: sum(initialChunks, 'rawBytes'),
      gzip: sum(initialChunks, 'gzipBytes'),
    },
    totalJavaScript: { raw: sum(javascript, 'rawBytes'), gzip: sum(javascript, 'gzipBytes') },
  },
  legacyBudgets: { entryRawBytes: 520 * 1024, totalJavaScriptGzipBytes: 650 * 1024 },
  entry: { key: entry.key, file: entry.file },
  initialChunks: initialChunks.map(({ key, file, rawBytes, gzipBytes }) => ({
    key,
    file,
    rawBytes,
    gzipBytes,
  })),
  largestJavaScriptChunks: javascript.slice(0, 15),
  entryDynamicImports: dynamicEntries,
  allJavaScriptChunks: javascript,
};

await mkdir(new URL('docs/evidence/wp19h0/', repositoryRoot), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${outputUrl.pathname}`);
console.log(JSON.stringify(report.bytes, null, 2));
