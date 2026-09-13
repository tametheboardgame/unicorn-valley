import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { classifyVerification } from './verificationPolicy.mjs';

const eventName = process.env.VERIFY_EVENT_NAME ?? process.env.GITHUB_EVENT_NAME ?? 'unknown';
const baseSha = process.env.VERIFY_BASE_SHA ?? '';
const headSha = process.env.VERIFY_HEAD_SHA ?? 'HEAD';
const manualFull = (process.env.VERIFY_FORCE_FULL ?? '').toLowerCase() === 'true';
const authoritativeEvent = eventName === 'push' || eventName === 'schedule' || eventName === 'workflow_dispatch';
const forceFull = manualFull || authoritativeEvent;

let changedFiles = [];
if (!forceFull && eventName === 'pull_request' && baseSha) {
  try {
    changedFiles = execFileSync('git', ['diff', '--name-only', `${baseSha}...${headSha}`], {
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  } catch (error) {
    console.warn(`Unable to resolve changed files: ${error.message}`);
  }
}

const plan = classifyVerification(changedFiles, {
  forceFull,
  reason: forceFull
    ? eventName === 'schedule'
      ? 'scheduled periodic full qualification'
      : eventName === 'push'
        ? 'main/push qualification'
        : 'manual full CI escape hatch'
    : null,
});

const report = {
  schemaVersion: 1,
  eventName,
  baseSha: baseSha || null,
  headSha,
  ...plan,
};

writeFileSync('verification-plan.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

const outputPath = process.env.GITHUB_OUTPUT;
if (outputPath) {
  const outputs = {
    change_class: plan.changeClass,
    tiers: plan.tiers.join(','),
    browser_group: plan.browserGroup,
    run_typecheck: String(plan.runTypecheck),
    run_unit: String(plan.runUnit),
    run_build: String(plan.runBuild),
    run_performance: String(plan.runPerformance),
    run_tier2: String(plan.runTier2),
    run_tier3: String(plan.runTier3),
    run_tier4: String(plan.runTier4),
    run_project_contract: String(plan.runProjectContract),
  };
  appendFileSync(outputPath, `${Object.entries(outputs).map(([key, value]) => `${key}=${value}`).join('\n')}\n`);
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const changed = plan.changedFiles.length
    ? plan.changedFiles.map((file) => `- \`${file}\``).join('\n')
    : '- none resolved (authoritative full run)';
  appendFileSync(
    summaryPath,
    [
      '## Verification selection',
      '',
      `- Change class: **${plan.changeClass}**`,
      `- Selected tiers: **${plan.tiers.join(', ')}**`,
      `- Browser group: **${plan.browserGroup}**`,
      `- Reason: ${plan.reason}`,
      '',
      '### Changed files',
      changed,
      '',
    ].join('\n'),
  );
}
