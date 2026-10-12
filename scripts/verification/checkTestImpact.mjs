import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { evaluateTestImpact, ENFORCE_FROM_PR } from './testImpactPolicy.mjs';

const eventName = process.env.GITHUB_EVENT_NAME ?? '';
const eventPath = process.env.GITHUB_EVENT_PATH;
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const inputNumber = Number(process.env.PR_NUMBER ?? 0);
const event = eventPath && existsSync(eventPath)
  ? JSON.parse(readFileSync(eventPath, 'utf8')) : {};

async function github(path) {
  const response = await fetch('https://api.github.com/repos/' + repo + '/' + path, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error('GitHub PR review lookup failed: ' + response.status);
  return response.json();
}
async function run() {
  const number = Number(event.pull_request?.number ?? inputNumber);
  if (eventName !== 'pull_request' && !number) {
    console.log('Test impact review: no PR context for main/push; not applicable.');
    return;
  }
  if (!repo || !token || !Number.isInteger(number) || number <= 0) {
    throw new Error('Test impact validation requires PR number, repository and GitHub token.');
  }
  const pr = await github('pulls/' + number);
  const files = [];
  if (!pr.draft && number >= ENFORCE_FROM_PR) {
    for (let page = 1; page <= 30; page++) {
      const result = await github('pulls/' + number + '/files?per_page=100&page=' + page);
      files.push(...result.map(({ filename, status }) => ({ filename, status })));
      if (result.length < 100) break;
      if (page === 30) throw new Error('PR file list exceeds supported 3000 files; review fails closed.');
    }
    if (files.length !== pr.changed_files) {
      throw new Error('PR changed-file reconciliation failed: ' + files.length + ' != ' + pr.changed_files);
    }
  }
  const result = evaluateTestImpact({
    number, draft: pr.draft, body: pr.body, files,
    fileExists: existsSync,
    readPackage: (path) => readFileSync(path, 'utf8'),
  });
  const lines = ['Test Impact Assessment PR #' + number + ': ' + result.summary];
  for (const item of result.warnings) lines.push('WARNING: ' + item);
  for (const item of result.errors) lines.push('ERROR: ' + item);
  console.log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Test-impact review\n\n' + lines.join('\n\n') + '\n\n');
  }
  if (!result.passed) process.exitCode = 1;
}
run().catch((error) => {
  console.error('Test impact validation failed closed:', error);
  process.exitCode = 1;
});
