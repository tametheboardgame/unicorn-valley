import { spawnSync } from 'node:child_process';

function values(name) {
  return (process.env[name] ?? '')
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const mode = process.env.UNIT_MODE ?? 'none';
if (mode === 'full') {
  run('npm', ['run', 'test']);
  process.exit(0);
}

if (mode === 'none') {
  console.log('No unit contracts selected.');
  process.exit(0);
}

if (mode !== 'selected') {
  console.error(`Unknown unit selection mode: ${mode}`);
  process.exit(1);
}

const directTests = values('UNIT_TESTS');
const filters = values('UNIT_FILTERS');
const relatedFiles = values('UNIT_RELATED_FILES');
const selectedFilters = [...new Set([...directTests, ...filters])].sort();

if (selectedFilters.length === 0 && relatedFiles.length === 0) {
  console.error('Selected unit mode resolved no tests or related source files.');
  process.exit(1);
}

if (selectedFilters.length > 0) {
  run('npx', ['vitest', 'run', ...selectedFilters]);
}

if (relatedFiles.length > 0) {
  run('npx', ['vitest', 'related', '--run', ...relatedFiles]);
}
