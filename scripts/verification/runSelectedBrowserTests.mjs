import { spawnSync } from 'node:child_process';

const tests = [...new Set(
  (process.env.BROWSER_TESTS ?? '')
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean),
)].sort();

if (tests.length === 0) {
  console.error('Tier 2 was requested but no deterministic browser tests were selected.');
  process.exit(1);
}

for (const test of tests) {
  if (!test.startsWith('tests/play/') || !test.endsWith('.spec.ts')) {
    console.error(`Refusing invalid Tier 2 browser test path: ${test}`);
    process.exit(1);
  }
}

console.log(`> npx playwright test ${tests.join(' ')}`);
const result = spawnSync('npx', ['playwright', 'test', ...tests], {
  stdio: 'inherit',
  shell: false,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
