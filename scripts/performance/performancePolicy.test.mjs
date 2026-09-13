import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluatePerformanceMetrics,
  PERFORMANCE_BUDGETS,
  staticClosure,
} from './performancePolicy.mjs';

function healthyMetrics() {
  return {
    entry: { rawBytes: PERFORMANCE_BUDGETS.entryRawBytes - 1024 },
    initialGraph: { gzipBytes: PERFORMANCE_BUDGETS.initialGraphGzipBytes - 1024 },
    largestLazyChunk: {
      file: 'assets/optional-feature.js',
      gzipBytes: PERFORMANCE_BUDGETS.largestLazyChunkGzipBytes - 1024,
    },
    javascriptChunkCount: PERFORMANCE_BUDGETS.javascriptChunkCount - 1,
    diagnosticsInInitialGraph: false,
  };
}

test('staticClosure follows only static imports', () => {
  const manifest = {
    entry: { imports: ['shared'], dynamicImports: ['lazy'] },
    shared: { imports: ['leaf'] },
    leaf: {},
    lazy: {},
  };

  assert.deepEqual(staticClosure(manifest, 'entry').sort(), ['entry', 'leaf', 'shared']);
});

test('healthy startup and lazy metrics pass', () => {
  assert.deepEqual(evaluatePerformanceMetrics(healthyMetrics()), []);
});

test('total JavaScript breadth is not a hard failure', () => {
  const metrics = {
    ...healthyMetrics(),
    totalJavaScript: { gzipBytes: 900 * 1024, rawBytes: 3200 * 1024 },
  };

  assert.deepEqual(evaluatePerformanceMetrics(metrics), []);
});

test('entry, initial graph, lazy chunk and chunk-count regressions fail', () => {
  const failures = evaluatePerformanceMetrics({
    ...healthyMetrics(),
    entry: { rawBytes: PERFORMANCE_BUDGETS.entryRawBytes + 1 },
    initialGraph: { gzipBytes: PERFORMANCE_BUDGETS.initialGraphGzipBytes + 1 },
    largestLazyChunk: {
      file: 'assets/too-large.js',
      gzipBytes: PERFORMANCE_BUDGETS.largestLazyChunkGzipBytes + 1,
    },
    javascriptChunkCount: PERFORMANCE_BUDGETS.javascriptChunkCount + 1,
  });

  assert.equal(failures.length, 4);
});

test('diagnostics cannot become startup payload', () => {
  const failures = evaluatePerformanceMetrics({
    ...healthyMetrics(),
    diagnosticsInInitialGraph: true,
  });

  assert.deepEqual(failures, [
    'BrowserDiagnostics is part of the initial/title/first-playable graph',
  ]);
});
