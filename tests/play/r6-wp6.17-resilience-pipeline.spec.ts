import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';
const BACKUP_KEY = 'unicorn-valley.save.backup';
const ACCESSIBILITY_KEY = 'unicorn-valley:accessibility-settings:v1';
const AUDIO_KEY = 'unicorn-valley:audio-settings:v1';

interface DiagnosticObject {
  name: string;
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

interface BrowserFailureAudit {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  httpErrors: string[];
}

function installBrowserFailureAudit(page: Page): BrowserFailureAudit {
  const audit: BrowserFailureAudit = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    httpErrors: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') {
      audit.consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    audit.pageErrors.push(error.message);
  });
  page.on('requestfailed', (request) => {
    audit.failedRequests.push(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`,
    );
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      audit.httpErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  return audit;
}

function expectBrowserFailureAuditClean(audit: BrowserFailureAudit): void {
  expect(audit.consoleErrors).toEqual([]);
  expect(audit.pageErrors).toEqual([]);
  expect(audit.failedRequests).toEqual([]);
  expect(audit.httpErrors).toEqual([]);
}

function createStoredSave(
  name: string,
  appearance: Record<string, string> = {},
): Record<string, unknown> {
  const timestamp = '2026-08-28T07:00:00.000Z';
  return {
    schemaVersion: 2,
    createdAt: timestamp,
    lastSavedAt: timestamp,
    profile: {
      name,
      appearance: {
        bodyColour: 'mint',
        eyeColour: 'green',
        maneStyle: 'fluffy',
        maneColour: 'aqua',
        tailStyle: 'curl',
        tailColour: 'plum',
        hornStyle: 'spiral',
        marking: 'heart',
        accessory: 'bow',
        ...appearance,
      },
      currentLocationId: 'location:moonflower-cottage-interior',
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

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
  }, sceneKey);
}

async function tapObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const current = await snapshot(page);
  const target = current.scenes
    .find((scene) => scene.key === sceneKey)
    ?.objects.find((object) => object.name === objectName && object.visible && object.interactive);
  if (!target) {
    throw new Error(`Missing interactive ${sceneKey} object: ${objectName}`);
  }

  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (target.x / current.width) * bounds.width,
    bounds.y + (target.y / current.height) * bounds.height,
  );
}

async function tapTitleText(page: Page, text: string): Promise<void> {
  const current = await snapshot(page);
  const target = current.scenes
    .find((scene) => scene.key === 'TitleScene')
    ?.objects.find((object) => object.visible && object.interactive && object.text === text);
  if (!target) {
    throw new Error(`Missing interactive TitleScene text: ${text}`);
  }

  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (target.x / current.width) * bounds.width,
    bounds.y + (target.y / current.height) * bounds.height,
  );
}

function sceneText(current: DiagnosticSnapshot, sceneKey: string): string[] {
  return (
    current.scenes
      .find((scene) => scene.key === sceneKey)
      ?.objects.filter((object) => object.visible && object.text)
      .map((object) => object.text as string) ?? []
  );
}

test('a corrupted profile record recovers from backup and keeps Continue usable', async ({
  page,
}) => {
  const failureAudit = installBrowserFailureAudit(page);
  const corruptPrimary = createStoredSave('Broken') as Record<string, unknown>;
  corruptPrimary.profile = {
    name: 42,
    appearance: null,
    currentLocationId: false,
    unlockedAbilityIds: 'not-an-array',
  };
  const backup = createStoredSave('Starlight');

  await page.addInitScript(
    ({ saveKey, backupKey, primarySave, backupSave }) => {
      window.localStorage.setItem(saveKey, JSON.stringify(primarySave));
      window.localStorage.setItem(backupKey, JSON.stringify(backupSave));
    },
    { saveKey: SAVE_KEY, backupKey: BACKUP_KEY, primarySave: corruptPrimary, backupSave: backup },
  );

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  expect(sceneText(await snapshot(page), 'TitleScene')).toContain('Continue');

  const repaired = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'),
    SAVE_KEY,
  );
  expect(repaired.profile.name).toBe('Starlight');

  await tapTitleText(page, 'Continue');
  await waitForScene(page, 'CottageInteriorScene');
  expectBrowserFailureAuditClean(failureAudit);
});

test('malformed settings and optional cosmetics cannot block Settings, Redesign or Continue', async ({
  page,
}) => {
  const failureAudit = installBrowserFailureAudit(page);
  const save = createStoredSave('Starlight', {
    bodyColour: 'missing-body',
    maneStyle: 'missing-mane',
    hornStyle: 'missing-horn',
    accessory: 'missing-accessory',
  });
  await page.addInitScript(
    ({ saveKey, audioKey, accessibilityKey, storedSave }) => {
      window.localStorage.setItem(saveKey, JSON.stringify(storedSave));
      window.localStorage.setItem(audioKey, '{broken-audio-settings');
      window.localStorage.setItem(accessibilityKey, '{broken-accessibility-settings');
    },
    {
      saveKey: SAVE_KEY,
      audioKey: AUDIO_KEY,
      accessibilityKey: ACCESSIBILITY_KEY,
      storedSave: save,
    },
  );

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  const titleText = sceneText(await snapshot(page), 'TitleScene');
  expect(titleText).toEqual(expect.arrayContaining(['Continue', 'My Unicorn', 'Settings']));

  await tapTitleText(page, 'Settings');
  const settingsText = sceneText(await snapshot(page), 'TitleScene');
  expect(settingsText).toContain('Music: On');
  expect(settingsText).toContain('Reduced motion: Off');
  await tapTitleText(page, 'Done');

  await tapTitleText(page, 'My Unicorn');
  await waitForScene(page, 'UnicornCreatorScene');
  const creatorText = sceneText(await snapshot(page), 'UnicornCreatorScene');
  expect(creatorText).toContain('Soft Waves');
  expect(creatorText).toContain('Classic');
  expect(creatorText).toContain('Flower Clip');
  await tapObject(page, 'UnicornCreatorScene', 'creator-action-cancel');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'Continue');
  await waitForScene(page, 'CottageInteriorScene');
  expectBrowserFailureAuditClean(failureAudit);
});

test('a new player can visit Settings and still route through New Game into the creator', async ({
  page,
}) => {
  const failureAudit = installBrowserFailureAudit(page);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'Settings');
  expect(sceneText(await snapshot(page), 'TitleScene')).toContain('Done');
  await tapTitleText(page, 'Done');

  await tapTitleText(page, 'New Game');
  await waitForScene(page, 'UnicornCreatorScene');
  expectBrowserFailureAuditClean(failureAudit);
});
