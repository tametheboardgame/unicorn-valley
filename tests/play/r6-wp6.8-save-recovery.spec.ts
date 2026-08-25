import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';
const BACKUP_KEY = 'unicorn-valley.save.backup';

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: Array<{
    key: string;
    objects: Array<{ text: string | null; visible: boolean }>;
  }>;
}

function createStoredSave(name: string, schemaVersion = 2): Record<string, unknown> {
  const timestamp = '2026-08-21T08:00:00.000Z';
  return {
    schemaVersion,
    createdAt: timestamp,
    lastSavedAt: timestamp,
    profile: {
      name,
      appearance: { bodyColour: 'mint' },
      currentLocationId: 'moonflower-cottage',
      unlockedAbilityIds: ['ability:rainbow-jump'],
    },
    inventory: {
      itemQuantities: { 'currency:shimmer': 18 },
      ownedCosmeticIds: ['item:star-hairclip'],
      ownedDecorationIds: [],
      specialItemIds: [],
    },
    relationships: { byCharacterId: {} },
    quests: { byQuestId: {} },
    world: {
      flags: {},
      discoveredZoneIds: ['moonflower-glade'],
      changedObjectIds: [],
      uniqueDiscoveryIds: [],
    },
    home: { ownedFurnitureIds: [], furnitureBySlot: {}, gardenFlags: {} },
    activities: { racesById: {}, miniGameRecords: {} },
    collections: { discoveryIds: [], memoryIds: [] },
  };
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function titleHasContinue(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
    };
    const title = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'TitleScene');
    return Boolean(title?.objects.some((object) => object.visible && object.text === 'Continue'));
  });
}

test('corrupt primary save recovers from the last-known-good browser backup', async ({ page }) => {
  const backup = createStoredSave('Starlight');
  await page.addInitScript(
    ({ saveKey, backupKey, backupSave }) => {
      window.localStorage.setItem(saveKey, '{broken-primary');
      window.localStorage.setItem(backupKey, JSON.stringify(backupSave));
    },
    { saveKey: SAVE_KEY, backupKey: BACKUP_KEY, backupSave: backup },
  );

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  expect(await titleHasContinue(page)).toBe(true);
  const repaired = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'),
    SAVE_KEY,
  );
  expect(repaired.profile.name).toBe('Starlight');
  expect(repaired.schemaVersion).toBe(2);
});

test('schema-v1 browser save is backed up before automatic migration to v2', async ({ page }) => {
  const historical = createStoredSave('Moonbeam', 1);
  await page.addInitScript(
    ({ saveKey, backupKey, historicalSave }) => {
      window.localStorage.setItem(saveKey, JSON.stringify(historicalSave));
      window.localStorage.removeItem(backupKey);
    },
    { saveKey: SAVE_KEY, backupKey: BACKUP_KEY, historicalSave: historical },
  );

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  const stored = await page.evaluate(
    ({ saveKey, backupKey }) => ({
      primary: JSON.parse(window.localStorage.getItem(saveKey) ?? '{}'),
      backup: JSON.parse(window.localStorage.getItem(backupKey) ?? '{}'),
    }),
    { saveKey: SAVE_KEY, backupKey: BACKUP_KEY },
  );

  expect(stored.primary.schemaVersion).toBe(2);
  expect(stored.primary.profile.name).toBe('Moonbeam');
  expect(stored.backup.schemaVersion).toBe(1);
  expect(stored.backup.profile.name).toBe('Moonbeam');
});
