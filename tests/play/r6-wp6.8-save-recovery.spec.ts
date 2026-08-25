import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';
const BACKUP_KEY = 'unicorn-valley.save.backup';

interface DiagnosticObject {
  text: string | null;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
}

interface DiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: Array<{
    key: string;
    objects: DiagnosticObject[];
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

async function getSnapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
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
  const snapshot = await getSnapshot(page);
  const title = snapshot.scenes.find((scene) => scene.key === 'TitleScene');
  return Boolean(title?.objects.some((object) => object.visible && object.text === 'Continue'));
}

async function tapTitleText(page: Page, text: string): Promise<void> {
  const snapshot = await getSnapshot(page);
  const title = snapshot.scenes.find((scene) => scene.key === 'TitleScene');
  const target = title?.objects.find(
    (object) => object.visible && object.interactive && object.text === text,
  );
  if (!target) {
    throw new Error(`Missing interactive TitleScene text: ${text}`);
  }

  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }

  await page.mouse.click(
    bounds.x + (target.x / snapshot.width) * bounds.width,
    bounds.y + (target.y / snapshot.height) * bounds.height,
  );
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

test('Start over requires confirmation and clears both save copies only after the second tap', async ({
  page,
}) => {
  const current = createStoredSave('Starlight');
  const backup = createStoredSave('Moonbeam');
  const serialisedCurrent = JSON.stringify(current);
  const serialisedBackup = JSON.stringify(backup);
  await page.addInitScript(
    ({ saveKey, backupKey, primarySave, backupSave }) => {
      window.localStorage.setItem(saveKey, primarySave);
      window.localStorage.setItem(backupKey, backupSave);
    },
    {
      saveKey: SAVE_KEY,
      backupKey: BACKUP_KEY,
      primarySave: serialisedCurrent,
      backupSave: serialisedBackup,
    },
  );

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'Start over');
  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBe(
    serialisedCurrent,
  );
  expect(await page.evaluate((key) => window.localStorage.getItem(key), BACKUP_KEY)).toBe(
    serialisedBackup,
  );

  await tapTitleText(page, 'Tap again to start over');
  await waitForScene(page, 'UnicornCreatorScene');

  const resetState = await page.evaluate(
    ({ saveKey, backupKey }) => ({
      primary: JSON.parse(window.localStorage.getItem(saveKey) ?? '{}'),
      backup: window.localStorage.getItem(backupKey),
    }),
    { saveKey: SAVE_KEY, backupKey: BACKUP_KEY },
  );
  expect(resetState.primary.profile.name).toBeNull();
  expect(resetState.backup).toBeNull();
});
