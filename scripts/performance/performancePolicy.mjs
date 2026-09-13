import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

export const KiB = 1024;

export const PERFORMANCE_BUDGETS = Object.freeze({
  entryRawBytes: 520 * KiB,
  initialGraphGzipBytes: 560 * KiB,
  largestLazyChunkGzipBytes: 32 * KiB,
  javascriptChunkCount: 112,
});

export const LEGACY_METRICS = Object.freeze({
  totalJavaScriptGzipBytes: 650 * KiB,
  totalJavaScriptRawBytes: 2400 * KiB,
});

export function staticClosure(manifest, rootKey) {
  const visited = new Set();

  const visit = (key) => {
    if (visited.has(key)) return;
    visited.add(key);
    for (const dependency of manifest[key]?.imports ?? []) {
      visit(dependency);
    }
  };

  visit(rootKey);
  return [...visited];
}

function sum(chunks, field) {
  return chunks.reduce((total, chunk) => total + chunk[field], 0);
}

export function evaluatePerformanceMetrics(metrics, budgets = PERFORMANCE_BUDGETS) {
  const failures = [];

  if (metrics.entry.rawBytes > budgets.entryRawBytes) {
    failures.push(
      `entry is ${(metrics.entry.rawBytes / KiB).toFixed(1)} KiB raw (budget ${(budgets.entryRawBytes / KiB).toFixed(0)} KiB)`,
    );
  }

  if (metrics.initialGraph.gzipBytes > budgets.initialGraphGzipBytes) {
    failures.push(
      `initial/title/first-playable graph is ${(metrics.initialGraph.gzipBytes / KiB).toFixed(1)} KiB gzip (budget ${(budgets.initialGraphGzipBytes / KiB).toFixed(0)} KiB)`,
    );
  }

  if (metrics.largestLazyChunk.gzipBytes > budgets.largestLazyChunkGzipBytes) {
    failures.push(
      `largest lazy chunk ${metrics.largestLazyChunk.file} is ${(metrics.largestLazyChunk.gzipBytes / KiB).toFixed(1)} KiB gzip (budget ${(budgets.largestLazyChunkGzipBytes / KiB).toFixed(0)} KiB)`,
    );
  }

  if (metrics.javascriptChunkCount > budgets.javascriptChunkCount) {
    failures.push(
      `JavaScript chunk count is ${metrics.javascriptChunkCount} (budget ${budgets.javascriptChunkCount})`,
    );
  }

  if (metrics.diagnosticsInInitialGraph) {
    failures.push('BrowserDiagnostics is part of the initial/title/first-playable graph');
  }

  return failures;
}

export async function measurePerformance({ manifestUrl, distDirectory }) {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
  if (!entryKey) {
    throw new Error('Performance policy failed: no application entry in Vite manifest.');
  }

  const javascript = [];
  for (const [key, value] of Object.entries(manifest)) {
    if (!value.file.endsWith('.js')) continue;
    const url = new URL(value.file, distDirectory);
    const body = await readFile(url);
    javascript.push({
      key,
      file: value.file,
      rawBytes: (await stat(url)).size,
      gzipBytes: gzipSync(body).byteLength,
    });
  }

  const byKey = new Map(javascript.map((chunk) => [chunk.key, chunk]));
  const entry = byKey.get(entryKey);
  if (!entry) {
    throw new Error(`Performance policy failed: entry chunk ${entryKey} is missing.`);
  }

  const initialKeys = new Set(staticClosure(manifest, entryKey));
  const initialChunks = javascript.filter((chunk) => initialKeys.has(chunk.key));
  const lazyChunks = javascript.filter((chunk) => !initialKeys.has(chunk.key));
  if (lazyChunks.length === 0) {
    throw new Error('Performance policy failed: expected at least one lazy JavaScript chunk.');
  }

  const largestLazyChunk = lazyChunks.reduce((largest, chunk) =>
    chunk.gzipBytes > largest.gzipBytes ? chunk : largest,
  );
  const diagnosticsChunk = javascript.find((chunk) =>
    chunk.file.includes('BrowserDiagnostics-'),
  );

  return {
    schemaVersion: 2,
    budgets: PERFORMANCE_BUDGETS,
    legacyMetrics: LEGACY_METRICS,
    entry: {
      key: entry.key,
      file: entry.file,
      rawBytes: entry.rawBytes,
      gzipBytes: entry.gzipBytes,
    },
    initialGraph: {
      rawBytes: sum(initialChunks, 'rawBytes'),
      gzipBytes: sum(initialChunks, 'gzipBytes'),
      chunkCount: initialChunks.length,
    },
    largestLazyChunk,
    totalJavaScript: {
      rawBytes: sum(javascript, 'rawBytes'),
      gzipBytes: sum(javascript, 'gzipBytes'),
    },
    javascriptChunkCount: javascript.length,
    diagnosticsInInitialGraph: diagnosticsChunk
      ? initialKeys.has(diagnosticsChunk.key)
      : false,
    diagnosticsChunk: diagnosticsChunk ?? null,
    initialChunks: initialChunks
      .sort((left, right) => right.gzipBytes - left.gzipBytes)
      .map(({ key, file, rawBytes, gzipBytes }) => ({ key, file, rawBytes, gzipBytes })),
    largestLazyChunks: lazyChunks
      .sort((left, right) => right.gzipBytes - left.gzipBytes)
      .slice(0, 15)
      .map(({ key, file, rawBytes, gzipBytes }) => ({ key, file, rawBytes, gzipBytes })),
  };
}
