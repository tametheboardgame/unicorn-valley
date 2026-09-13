import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { buildVerificationSelection } from './verificationSelection.mjs';

const eventName = process.env.VERIFY_EVENT_NAME ?? process.env.GITHUB_EVENT_NAME ?? 'unknown';
const baseSha = process.env.VERIFY_BASE_SHA ?? '';
const headSha = process.env.VERIFY_HEAD_SHA ?? 'HEAD';
const manualFull = (process.env.VERIFY_FORCE_FULL ?? '').toLowerCase() === 'true';
const authoritativeEvent =
  eventName === 'push' || eventName === 'schedule' || eventName === 'workflow_dispatch';
const forceFull = manualFull || authoritativeEvent;

let mergeBaseSha = null;
let changedFiles = [];
if (!forceFull && eventName === 'pull_request' && baseSha) {
  try {
    mergeBaseSha = execFileSync('git', ['merge-base', baseSha, headSha], {
      encoding: 'utf8',
    }).trim();
    changedFiles = execFileSync('git', ['diff', '--name-only', `${mergeBaseSha}..${headSha}`], {
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  } catch (error) {
    console.warn(`Unable to resolve merge-base changed files: ${error.message}`);
  }
}

const plan = buildVerificationSelection(changedFiles, {
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
  schemaVersion: 2,
  eventName,
  baseSha: baseSha || null,
  mergeBaseSha,
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
    owners: plan.owners.join(','),
    unit_mode: plan.unitMode,
    unit_groups: plan.unitGroups.join(','),
    unit_filters: plan.unitFilters.join(' '),
    unit_related_files: plan.unitRelatedFiles.join(' '),
    unit_tests: plan.directUnitTests.join(' '),
    browser_group: plan.browserGroup,
    browser_groups: plan.browserGroups.join(','),
    browser_tests: plan.browserTests.join(' '),
    run_typecheck: String(plan.runTypecheck),
    run_unit: String(plan.runUnit),
    run_build: String(plan.runBuild),
    run_performance: String(plan.runPerformance),
    run_tier2: String(plan.runTier2),
    run_tier3: String(plan.runTier3),
    run_tier4: String(plan.runTier4),
    run_project_contract: String(plan.runProjectContract),
  };
  appendFileSync(
    outputPath,
    `${Object.entries(outputs)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`,
  );
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const changed = plan.changedFiles.length
    ? plan.changedFiles.map((file) => `- \`${file}\``).join('\n')
    : '- none resolved (authoritative full run)';
  const browserTests = plan.browserTests.length
    ? plan.browserTests.map((file) => `- \`${file}\``).join('\n')
    : '- full suite or none';
  const relatedFiles = plan.unitRelatedFiles.length
    ? plan.unitRelatedFiles.map((file) => `- \`${file}\``).join('\n')
    : '- none';
  appendFileSync(
    summaryPath,
    [
      '## Verification selection',
      '',
      `- Change class: **${plan.changeClass}**`,
      `- Selected tiers: **${plan.tiers.join(', ')}**`,
      `- Owners: **${plan.owners.join(', ') || 'none'}**`,
      `- Unit mode: **${plan.unitMode}**`,
      `- Unit groups: **${plan.unitGroups.join(', ') || 'none'}**`,
      `- Browser groups: **${plan.browserGroups.join(', ') || 'none'}**`,
      `- Reason: ${plan.reason}`,
      plan.ownershipEscalationReason
        ? `- Ownership escalation: ${plan.ownershipEscalationReason}`
        : null,
      '',
      '### Changed files',
      changed,
      '',
      '### Related unit source inputs',
      relatedFiles,
      '',
      '### Selected Tier 2 browser contracts',
      browserTests,
      '',
    ]
      .filter((line) => line !== null)
      .join('\n'),
  );
}
