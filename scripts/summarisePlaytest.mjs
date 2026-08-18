import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const reportPath = 'playtest-artifacts/playtest-report.json';

if (!existsSync(reportPath)) {
  console.log('Automated playtest did not produce a report.');
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const findings = report.scenarios.flatMap((scenario) =>
  scenario.findings.map((finding) => ({ ...finding, scenario: scenario.scenario })),
);

const lines = [
  '## Automated playtest',
  '',
  `Scenarios: **${report.scenarios.length}** | Errors: **${report.errorCount}** | Warnings: **${report.warningCount}** | Suggestions: **${report.suggestionCount}**`,
  '',
];

if (findings.length === 0) {
  lines.push('No automated visual or gameplay findings were reported.');
} else {
  lines.push('### Findings', '');
  for (const finding of findings) {
    const icon = finding.severity === 'error' ? '❌' : finding.severity === 'warning' ? '⚠️' : '💡';
    lines.push(
      `- ${icon} **${finding.severity.toUpperCase()} · ${finding.scene} · ${finding.scenario}:** ${finding.message}`,
    );
  }
}

const summary = `${lines.join('\n')}\n`;
console.log(summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
