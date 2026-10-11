import { appendFileSync } from 'node:fs';
import { evaluateMergeGate } from './mergeGatePolicy.mjs';

const flag = (name) => process.env[name] === 'true';
const event = process.env.GITHUB_EVENT_NAME ?? '';
const plannedHead = process.env.PLAN_HEAD ?? '';
const isPR = event === 'pull_request' || Boolean(process.env.PR_NUMBER);

async function getCurrentHead() {
  if (!isPR) return plannedHead;
  const repo = process.env.GITHUB_REPOSITORY;
  const number = process.env.PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !number || !token) {
    throw new Error('PR head lookup requires repository, PR number and GitHub token.');
  }
  const response = await fetch(`https://api.github.com/repos/${repo}/pulls/${number}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(`Unable to verify PR head: HTTP ${response.status}`);
  const data = await response.json();
  return data.head?.sha ?? null;
}

try {
  const result = evaluateMergeGate({
    planResult: process.env.PLAN_RESULT,
    changeClass: process.env.PLAN_CLASS,
    plannedHead,
    currentHead: await getCurrentHead(),
    requireAuthoritative:
      event !== 'pull_request' || process.env.PR_DRAFT === 'false',
    required: {
      tier0: true,
      tier1: flag('RUN_UNIT'),
      build: flag('RUN_BUILD'),
      tier2: flag('RUN_TIER2'),
      tier3: flag('RUN_TIER3'),
      tier4: flag('RUN_TIER4'),
    },
    outcomes: {
      tier0: process.env.RESULT_TIER0,
      tier1: process.env.RESULT_TIER1,
      build: process.env.RESULT_BUILD,
      tier2: process.env.RESULT_TIER2,
      tier3: process.env.RESULT_TIER3,
      tier4: process.env.RESULT_TIER4,
    },
  });

  const summary = result.passed
    ? result.authoritative
      ? 'Authoritative exact-head qualification passed.'
      : 'Draft PR focused checks passed; not merge-authoritative.'
    : result.failures.join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Merge Gate\n\n${result.passed ? 'PASS' : 'FAIL'}\n\n${summary}\n`,
    );
  }
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  console.error('Merge Gate verification failed:', error);
  process.exitCode = 1;
}
