import { appendFileSync } from 'node:fs';
import { evaluateMergeGate } from './mergeGatePolicy.mjs';
import { evaluateMergeFreshness } from './mergeFreshnessPolicy.mjs';

const flag = (name) => process.env[name] === 'true';
const event = process.env.GITHUB_EVENT_NAME ?? '';
const plannedHead = process.env.PLAN_HEAD ?? '';
const isPR = event === 'pull_request' || Number(process.env.PR_NUMBER) > 0;

async function github(path) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error('GitHub merge lookup needs repo and token.');
  const response = await fetch('https://api.github.com/repos/' + repo + '/' + path, {
    headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('GitHub merge lookup failed: HTTP ' + response.status);
  return response.json();
}

async function getCurrentHead() {
  if (!isPR) return plannedHead;
  const number = process.env.PR_NUMBER;
  if (!number) throw new Error('Missing PR number for exact-head lookup.');
  const pr = await github('pulls/' + number);
  return pr.head?.sha ?? null;
}

try {
  const requireAuthoritative = event !== 'pull_request' || process.env.PR_DRAFT === 'false';
  const currentHead = await getCurrentHead();
  let freshness = { passed: true, failures: [] };
  if (isPR && requireAuthoritative) {
    const pr = await github('pulls/' + process.env.PR_NUMBER);
    const liveMain = await github('git/ref/heads/main');
    const mainSha = liveMain.object?.sha;
    const comparison = await github('compare/' + mainSha + '...' + pr.head.sha);
    freshness = evaluateMergeFreshness({
      targetBranch: pr.base?.ref,
      liveMainSha: mainSha,
      candidateHeadSha: pr.head.sha,
      comparison,
    });
    const recheckedMain = await github('git/ref/heads/main');
    if (mainSha !== recheckedMain.object?.sha) {
      freshness.passed = false;
      freshness.failures.push('Main changed while checking freshness; rerun against current main.');
    }
    console.log('ENG-WP2.5 freshness: main=' + mainSha + ', PR=' + pr.head.sha + ', compare=' + comparison.status);
  }
  const result = evaluateMergeGate({
    planResult: process.env.PLAN_RESULT,
    changeClass: process.env.PLAN_CLASS,
    plannedHead,
    currentHead,
    requireAuthoritative,
    required: {
      tier0: true,
      tier1: flag('RUN_UNIT'),
      build: flag('RUN_BUILD'),
      tier2: flag('RUN_TIER2'),
      smoke: flag('RUN_TIER3'),
      tier3: flag('RUN_TIER3'),
      tier4: flag('RUN_TIER4'),
    },
    outcomes: {
      tier0: process.env.RESULT_TIER0,
      tier1: process.env.RESULT_TIER1,
      build: process.env.RESULT_BUILD,
      tier2: process.env.RESULT_TIER2,
      smoke: process.env.RESULT_SMOKE,
      tier3: process.env.RESULT_TIER3,
      tier4: process.env.RESULT_TIER4,
    },
  });

  if (!freshness.passed) {
    result.failures.push(...freshness.failures);
    result.passed = false;
  }
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
