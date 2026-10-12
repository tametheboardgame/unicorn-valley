import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BROWSER_GROUPS,
  CONTRACT_LIFECYCLE,
  OWNERSHIP_MAP,
  UNIT_GROUPS,
  matchesGlob,
} from './verificationOwnership.mjs';

const VALID_STATES = new Set(['active', 'retired', 'replaced', 'quarantined']);
const BROWSER_SPEC = /^tests\/play\/.+\.spec\.ts$/;
const UNIT_SPEC = /^src\/.+\.test\.[cm]?[jt]sx?$/;

function unique(items) {
  return [...new Set(items)].sort();
}

export function enumerateFiles(root, subdirectory) {
  const results = [];
  const walk = (directory) => {
    for (const item of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = [directory, item.name].join('/');
      if (item.isDirectory()) walk(path);
      else if (item.isFile()) results.push(path);
    }
  };
  walk(subdirectory);
  return results.sort();
}

export function configSpecPaths(source) {
  const match = source.match(/\btestMatch:\s*\[([\s\S]*?)\]/);
  if (!match) throw new Error('Explicit testMatch list not found in Playwright configuration');
  return unique(
    [...match[1].matchAll(/['"](?:\*\*\/)?([^'"/]+\.spec\.ts)['"]/g)].map(
      (item) => 'tests/play/' + item[1],
    ),
  );
}

/** Derive contract inventory from existing selection rules; never use it to skip tests. */
export function buildContractInventory({
  browserSpecs,
  unitSpecs,
  smokeSpecs = [],
  compatibilitySpecs = [],
  legacyUnowned = [],
  browserGroups = BROWSER_GROUPS,
  unitGroups = UNIT_GROUPS,
  ownershipRules = OWNERSHIP_MAP,
  lifecycle = CONTRACT_LIFECYCLE,
  asOf = new Date().toISOString().slice(0, 10),
}) {
  const errors = [];
  const warnings = [];
  const addIssue = (collection, code, path, detail) => {
    collection.push({ code, path, detail });
  };
  const browserFiles = unique(browserSpecs);
  const unitFiles = unique(unitSpecs);
  const activeFiles = new Set([...browserFiles, ...unitFiles]);
  const browserOwners = new Map(browserFiles.map((path) => [path, []]));
  const ownedBrowserPaths = new Set();

  for (const [group, references] of Object.entries(browserGroups)) {
    for (const path of references) {
      if (!BROWSER_SPEC.test(path) || !browserOwners.has(path)) {
        addIssue(
          errors,
          'MISSING_BROWSER_REFERENCE',
          path,
          'Referenced by ownership group ' + group,
        );
        continue;
      }
      ownedBrowserPaths.add(path);
      browserOwners.get(path).push(group);
    }
  }
  for (const rule of ownershipRules) {
    for (const group of rule.browserGroups) {
      if (!(group in browserGroups)) {
        addIssue(errors, 'UNKNOWN_BROWSER_GROUP', rule.id, group);
      }
    }
    for (const group of rule.unitGroups) {
      if (!(group in unitGroups)) addIssue(errors, 'UNKNOWN_UNIT_GROUP', rule.id, group);
    }
  }

  for (const [label, paths] of [
    ['smoke', smokeSpecs],
    ['compatibility', compatibilitySpecs],
  ]) {
    for (const path of paths) {
      if (!browserOwners.has(path)) {
        addIssue(
          errors,
          'MISSING_PROFILE_REFERENCE',
          path,
          label + ' config references missing spec',
        );
      }
    }
  }

  const legacy = new Set(legacyUnowned);
  const unownedBrowser = browserFiles.filter((path) => !ownedBrowserPaths.has(path));
  const currentUnowned = new Set(unownedBrowser);
  for (const path of unownedBrowser) {
    addIssue(
      legacy.has(path) ? warnings : errors,
      legacy.has(path) ? 'LEGACY_UNOWNED_BROWSER' : 'NEW_UNOWNED_BROWSER',
      path,
      'No existing BROWSER_GROUPS entry owns this spec; full Chromium still executes it',
    );
  }
  for (const path of legacy) {
    if (!currentUnowned.has(path)) {
      addIssue(
        errors,
        'STALE_UNOWNED_BASELINE',
        path,
        'Remove stale debt entry after mapping or deletion',
      );
    }
  }

  for (const [path, record] of Object.entries(lifecycle)) {
    if (!VALID_STATES.has(record.status)) {
      addIssue(errors, 'INVALID_CONTRACT_STATUS', path, String(record.status));
    }
    if (['retired', 'replaced'].includes(record.status)) {
      if (!record.reason || !record.replacedBy) {
        addIssue(errors, 'UNJUSTIFIED_RETIREMENT', path, 'A reason and replacement are required');
      }
      if (record.replacedBy && !activeFiles.has(record.replacedBy)) {
        addIssue(errors, 'MISSING_REPLACEMENT', path, String(record.replacedBy));
      }
      if (activeFiles.has(path)) {
        addIssue(errors, 'RETIRED_CONTRACT_STILL_ACTIVE', path, record.status);
      }
    } else if (!activeFiles.has(path)) {
      addIssue(errors, 'MISSING_LIFECYCLE_CONTRACT', path, 'Declared contract file is absent');
    }
    if (record.status === 'quarantined') {
      if (!record.reason || !/^\d{4}-\d{2}-\d{2}$/.test(record.expiresOn ?? '')) {
        addIssue(errors, 'INVALID_QUARANTINE', path, 'Reason and ISO expiry required');
      } else if (record.expiresOn < asOf) {
        addIssue(errors, 'EXPIRED_QUARANTINE', path, record.expiresOn);
      }
    }
  }

  const contracts = [...browserFiles, ...unitFiles].map((path) => {
    const kind = BROWSER_SPEC.test(path) ? 'browser' : 'unit';
    const owners =
      kind === 'browser'
        ? unique(browserOwners.get(path))
        : unique(
            ownershipRules
              .filter((rule) => rule.sourceGlobs.some((glob) => matchesGlob(path, glob)))
              .map((rule) => rule.id),
          );
    const metadata = lifecycle[path] ?? {};
    if (owners.length === 0 && kind === 'unit') {
      addIssue(warnings, 'UNOWNED_UNIT', path, 'Unit test has no matching source ownership rule');
    }
    return {
      id: kind + ':' + path,
      path,
      kind,
      owners,
      status: metadata.status ?? 'active',
      intent: metadata.intent ?? null,
      reviewedOn: metadata.reviewedOn ?? null,
      reviewedIn: metadata.reviewedIn ?? null,
      smoke: smokeSpecs.includes(path),
      compatibility: compatibilitySpecs.includes(path),
      lifecycleReviewed: Boolean(metadata.reviewedOn && metadata.intent),
    };
  });

  const summary = {
    browser: browserFiles.length,
    unit: unitFiles.length,
    mappedBrowser: browserFiles.length - unownedBrowser.length,
    unownedBrowser: unownedBrowser.length,
    unownedUnit: warnings.filter((x) => x.code === 'UNOWNED_UNIT').length,
    smokeFiles: unique(smokeSpecs).length,
    compatibilityFiles: unique(compatibilitySpecs).length,
    lifecycleReviewed: contracts.filter((x) => x.lifecycleReviewed).length,
    hardErrors: errors.length,
    warnings: warnings.length,
  };
  return {
    schemaVersion: 1,
    asOf,
    summary,
    contracts,
    historicalContracts: Object.entries(lifecycle)
      .filter(([, data]) => ['retired', 'replaced'].includes(data.status))
      .map(([path, data]) => ({ id: 'historical:' + path, path, ...data })),
    errors,
    warnings,
  };
}

export function inspectContractInventory(root = process.cwd(), asOf) {
  const paths = enumerateFiles(root, 'tests/play');
  const files = enumerateFiles(root, 'src');
  const baseline = JSON.parse(
    readFileSync(join(root, 'scripts/verification/contractInventoryBaseline.json'), 'utf8'),
  );
  return buildContractInventory({
    browserSpecs: paths.filter((path) => BROWSER_SPEC.test(path)),
    unitSpecs: files.filter((path) => UNIT_SPEC.test(path)),
    smokeSpecs: configSpecPaths(readFileSync(join(root, 'playwright.smoke.config.ts'), 'utf8')),
    compatibilitySpecs: configSpecPaths(
      readFileSync(join(root, 'playwright.compat.config.ts'), 'utf8'),
    ),
    legacyUnowned: baseline.unownedBrowserSpecs,
    asOf,
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = inspectContractInventory();
  const output = process.argv.find((arg) => arg.startsWith('--output='))?.slice(9);
  if (output) writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log('Contract inventory: ' + JSON.stringify(report.summary));
  for (const issue of report.errors) console.error('ERROR ' + issue.code + ': ' + issue.path);
  console.log('Legacy ownership debt: ' + report.summary.unownedBrowser + ' browser specs');
  if (report.errors.length) process.exitCode = 1;
}
