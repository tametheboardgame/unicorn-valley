import { writeFile } from 'node:fs/promises';
import {
  evaluatePerformanceMetrics,
  KiB,
  LEGACY_METRICS,
  measurePerformance,
  PERFORMANCE_BUDGETS,
} from './performance/performancePolicy.mjs';

const repositoryRoot = new URL('../', import.meta.url);
const distDirectory = new URL('dist/', repositoryRoot);
const manifestUrl = new URL('dist/.vite/manifest.json', repositoryRoot);
const reportUrl = new URL('performance-report.json', repositoryRoot);

const report = await measurePerformance({ manifestUrl, distDirectory });
const failures = evaluatePerformanceMetrics(report);

await writeFile(
  reportUrl,
  `${JSON.stringify(
    {
      ...report,
      generatedAt: new Date().toISOString(),
      failures,
    },
    null,
    2,
  )}\n`,
);

console.log('H0H performance architecture report');
console.log(
  `- entry: ${(report.entry.rawBytes / KiB).toFixed(1)} KiB raw / ${(report.entry.gzipBytes / KiB).toFixed(1)} KiB gzip (raw budget ${(PERFORMANCE_BUDGETS.entryRawBytes / KiB).toFixed(0)} KiB)`,
);
console.log(
  `- initial/title/first-playable: ${(report.initialGraph.gzipBytes / KiB).toFixed(1)} KiB gzip across ${report.initialGraph.chunkCount} chunks (budget ${(PERFORMANCE_BUDGETS.initialGraphGzipBytes / KiB).toFixed(0)} KiB)`,
);
console.log(
  `- largest lazy chunk: ${report.largestLazyChunk.file}, ${(report.largestLazyChunk.gzipBytes / KiB).toFixed(1)} KiB gzip (budget ${(PERFORMANCE_BUDGETS.largestLazyChunkGzipBytes / KiB).toFixed(0)} KiB)`,
);
console.log(
  `- JavaScript chunks: ${report.javascriptChunkCount} (budget ${PERFORMANCE_BUDGETS.javascriptChunkCount})`,
);
console.log(
  `- total JavaScript breadth: ${(report.totalJavaScript.rawBytes / KiB).toFixed(1)} KiB raw / ${(report.totalJavaScript.gzipBytes / KiB).toFixed(1)} KiB gzip (trend only)`,
);
console.log(
  `- legacy total-JS metric: ${(report.totalJavaScript.gzipBytes / KiB).toFixed(1)} KiB gzip vs ${(LEGACY_METRICS.totalJavaScriptGzipBytes / KiB).toFixed(0)} KiB historical envelope; retained for visibility, not used as the startup gate`,
);

if (report.diagnosticsChunk) {
  console.log(
    `- diagnostics: ${report.diagnosticsChunk.file}, ${(report.diagnosticsChunk.gzipBytes / KiB).toFixed(1)} KiB gzip, initial=${report.diagnosticsInInitialGraph ? 'yes' : 'no'}`,
  );
}

if (failures.length > 0) {
  throw new Error(`Performance budget failed:\n- ${failures.join('\n- ')}`);
}

console.log(`Performance architecture budget passed. Report: ${reportUrl.pathname}`);
