import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';

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

function createRichSave(appearance: Record<string, string> = {}): Record<string, unknown> {
  const timestamp = '2026-08-27T08:00:00.000Z';
  return {
    schemaVersion: 2,
    createdAt: timestamp,
    lastSavedAt: timestamp,
    profile: {
      name: 'Starlight',
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
      itemQuantities: { 'currency:shimmer': 42, 'item:moonflower': 3 },
      ownedCosmeticIds: ['item:star-hairclip'],
      ownedDecorationIds: ['furniture:moon-lamp'],
      specialItemIds: ['item:pebble'],
    },
    relationships: {
      byCharacterId: {
        willow: { friendshipPoints: 18, flags: ['shared-picnic'] },
      },
    },
    quests: {
      byQuestId: {
        'quest:test': { status: 'active', currentStepId: 'step:2', completedAt: null },
      },
    },
    world: {
      flags: { 'world:test': true },
      discoveredZoneIds: ['moonflower-glade', 'crystal-brook'],
      changedObjectIds: ['object:test'],
      uniqueDiscoveryIds: ['discovery:test'],
    },
    home: {
      ownedFurnitureIds: ['furniture:moon-lamp'],
      furnitureBySlot: { shelf: 'furniture:moon-lamp' },
      gardenFlags: { watered: true },
    },
    activities: {
      racesById: {
        'race:rainbow-run': { bestTimeMs: 54_321, ribbonIds: ['ribbon:gold'] },
      },
      miniGameRecords: { 'activity:firefly': 7 },
    },
    collections: {
      discoveryIds: ['discovery:test'],
      memoryIds: ['memory:test'],
    },
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

async function tapObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const snapshot = await getSnapshot(page);
  const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
  const target = scene?.objects.find(
    (object) => object.name === objectName && object.visible && object.interactive,
  );
  if (!target) {
    throw new Error(`Missing interactive ${sceneKey} object: ${objectName}`);
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

async function seedSave(page: Page, save: Record<string, unknown>): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: SAVE_KEY, value: save },
  );
}

function creatorText(snapshot: DiagnosticSnapshot): string[] {
  return (
    snapshot.scenes
      .find((scene) => scene.key === 'UnicornCreatorScene')
      ?.objects.filter((object) => object.visible && object.text)
      .map((object) => object.text as string) ?? []
  );
}

test('My Unicorn edits only profile fields and preserves the whole adventure', async ({ page }) => {
  const original = createRichSave();
  await seedSave(page, original);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'My Unicorn');
  await waitForScene(page, 'UnicornCreatorScene');
  expect(creatorText(await getSnapshot(page))).toContain('Redesign Starlight');
  await expect(page.locator('.unicorn-name-input')).toHaveValue('Starlight');

  await page.locator('.unicorn-name-input').fill('Moonlight Star');
  await tapObject(page, 'UnicornCreatorScene', 'creator-bodyColour-pink');
  await tapObject(page, 'UnicornCreatorScene', 'creator-action-save-changes');
  await waitForScene(page, 'TitleScene');

  const stored = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'),
    SAVE_KEY,
  );
  const originalProfile = original.profile as Record<string, unknown>;
  expect(stored.profile.name).toBe('Moonlight Star');
  expect(stored.profile.appearance.bodyColour).toBe('pink');
  expect(stored.profile.currentLocationId).toBe(originalProfile.currentLocationId);
  expect(stored.profile.unlockedAbilityIds).toEqual(originalProfile.unlockedAbilityIds);
  for (const key of [
    'inventory',
    'relationships',
    'quests',
    'world',
    'home',
    'activities',
    'collections',
  ]) {
    expect(stored[key], `${key} changed during profile redesign`).toEqual(original[key]);
  }
});

test('Cancel leaves the persisted profile and adventure byte-for-byte untouched', async ({
  page,
}) => {
  const original = createRichSave();
  const originalSerialised = JSON.stringify(original);
  await seedSave(page, original);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'My Unicorn');
  await waitForScene(page, 'UnicornCreatorScene');
  await page.locator('.unicorn-name-input').fill('Changed Locally');
  await tapObject(page, 'UnicornCreatorScene', 'creator-bodyColour-pink');
  await tapObject(page, 'UnicornCreatorScene', 'creator-action-cancel');
  await waitForScene(page, 'TitleScene');

  const stored = await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);
  expect(stored).toBe(originalSerialised);
});

test('invalid cosmetic IDs fall back safely and never block My Unicorn or Continue', async ({
  page,
}) => {
  const save = createRichSave({
    bodyColour: 'impossible-colour',
    maneStyle: 'missing-mane',
    accessory: 'missing-accessory',
  });
  await seedSave(page, save);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'My Unicorn');
  await waitForScene(page, 'UnicornCreatorScene');
  const text = creatorText(await getSnapshot(page));
  expect(text).toContain('Redesign Starlight');
  expect(text).toContain('Soft Waves');
  expect(text).toContain('No Accessory');

  await tapObject(page, 'UnicornCreatorScene', 'creator-action-cancel');
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'Continue');
  await waitForScene(page, 'CottageInteriorScene');
});

test('New Game remains visibly destructive while My Unicorn is non-destructive', async ({
  page,
}) => {
  await seedSave(page, createRichSave());
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'New Game');
  await waitForScene(page, 'TitleScene');
  const snapshot = await getSnapshot(page);
  const titleText = snapshot.scenes
    .find((scene) => scene.key === 'TitleScene')
    ?.objects.filter((object) => object.visible && object.text)
    .map((object) => object.text as string);
  expect(titleText).toContain('Tap again to start over');
  expect(titleText).toContain('This replaces your current adventure. Tap again to be sure.');
  expect(titleText).toContain('My Unicorn');
});
