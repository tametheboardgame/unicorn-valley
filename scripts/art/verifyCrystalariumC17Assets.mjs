import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve('public/design-assets/crystalarium-c17');
const checks = [
  ['garden-desktop-approved-1920x1080.webp', 'bb31ab491d498d5aebb31546575cd244126e4437467f40a2ec6558f5db13e6f8'],
  ['garden-portrait-approved-1080x1920.webp', 'f25bae9923d06070cab91a741967d1a266b68779889f443568ee9c3c464bf684'],
];
let failed = false;
for (const [filename, expected] of checks) {
  const file = path.join(root, filename);
  if (!existsSync(file)) {
    console.error('MISSING C17 painted art: ' + file);
    failed = true;
    continue;
  }
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual !== expected) {
    console.error('CHECKSUM MISMATCH ' + filename + ': ' + actual);
    failed = true;
  } else {
    console.log('PASS ' + filename + ' SHA-256=' + actual);
  }
}
if (failed) process.exitCode = 1;
