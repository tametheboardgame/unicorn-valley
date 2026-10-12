import { appendFileSync } from 'node:fs';
import { evaluateStreamFileOwnership } from './streamStatePolicy.mjs';

const name = process.env.GITHUB_EVENT_NAME ?? '';
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const number = Number(process.env.PR_NUMBER ?? 0);

async function request(path) {
  const result = await fetch('https://api.github.com/repos/' + repo + '/' + path, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new Error('Stream ownership API lookup failed: HTTP ' + result.status);
  return result.json();
}

async function main() {
  if (name !== 'pull_request' && !number) {
    console.log('Stream ownership: not a pull-request run.');
    return;
  }
  if (!repo || !token || !number) throw new Error('Missing PR repository, token or number.');
  const pr = await request('pulls/' + number);
  if (pr.draft) {
    console.log('Stream ownership: provisional draft; final diff check deferred.');
    return;
  }
  const files = [];
  for (let page = 1; page <= 30; page++) {
    const items = await request('pulls/' + number + '/files?per_page=100&page=' + page);
    files.push(...items.map(({ filename, status }) => ({ filename, status })));
    if (items.length < 100) break;
    if (page === 30) throw new Error('PR has more than 3000 changed files.');
  }
  if (files.length !== pr.changed_files) {
    throw new Error(
      'Changed-file pagination mismatch: ' + files.length + ' != ' + pr.changed_files,
    );
  }
  const result = evaluateStreamFileOwnership({ branch: pr.head.ref, number, files });
  const summary = [
    'Stream ownership #' + number + ': ' + (result.stream ?? 'unclassified'),
    ...result.errors.map((item) => 'ERROR: ' + item),
    ...result.warnings.map((item) => 'WARNING: ' + item),
    result.errors.length ? 'FAIL' : 'PASS',
  ].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      '## ENG-WP2.5 stream ownership\n\n' + summary + '\n\n',
    );
  }
  if (result.errors.length) process.exitCode = 1;
}
main().catch((error) => {
  console.error('Stream ownership failed closed: ' + error.message);
  process.exitCode = 1;
});
