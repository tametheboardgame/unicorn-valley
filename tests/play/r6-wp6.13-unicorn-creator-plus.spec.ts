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

async function seedSave(page: Page): Promise<void> {
  const timestamp = '2026-08-27T14:00:00.000Z';
  const save = {
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
      },
      currentLocationId: 'location:moonflower-cottage-interior',
      unlockedAbilityIds: ['ability:rainbow-jump'],
    },
    inventory: {
      itemQuantities: { 'currency:shimmer': 42 },
      ownedCosmeticIds: [],
      ownedDecorationIds: [],
      specialItemIds: [],
    },
    relationships: { byCharacterId: {} },
    quests: { byQuestId: {} },
    world: {
      flags: {},
      discoveredZoneIds: [],
      changedObjectIds: [],
      uniqueDiscoveryIds: [],
    },
    home: { ownedFurnitureIds: [], furnitureBySlot: {}, gardenFlags: {} },
    activities: { racesById: {}, miniGameRecords: {} },
    collections: { discoveryIds: [], memoryIds: [] },
  };
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

test('Creator Plus exposes richer categories and accepts gameplay-key letters in names', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'New Game');
  await waitForScene(page, 'UnicornCreatorScene');

  const text = creatorText(await getSnapshot(page));
  expect(text).toContain('COLOURS');
  expect(text).toContain('HAIR & TAIL');
  expect(text).toContain('MAGIC DETAILS');
  expect(text).toContain('LIVE PREVIEW');

  await tapObject(page, 'UnicornCreatorScene', 'creator-bodyColour-peach');
  const nameInput = page.locator('.unicorn-name-input');
  await nameInput.fill('Essie Star');
  await expect(nameInput).toHaveValue('Essie Star');

  await tapObject(page, 'UnicornCreatorScene', 'creator-action-confirm-new');
  await waitForScene(page, 'MoonflowerGladeScene');
  const stored = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'),
    SAVE_KEY,
  );
  expect(stored.profile.name).toBe('Essie Star');
  expect(stored.profile.appearance.bodyColour).toBe('peach');
});

test('existing unicorn can save new Creator Plus styles without resetting adventure state', async ({
  page,
}) => {
  await seedSave(page);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'My Unicorn');
  await waitForScene(page, 'UnicornCreatorScene');

  await tapObject(page, 'UnicornCreatorScene', 'creator-bodyColour-buttercup');
  await tapObject(page, 'UnicornCreatorScene', 'creator-maneStyle-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-maneStyle-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-tailStyle-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-tailStyle-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-hornStyle-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-hornStyle-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-marking-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-marking-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-marking-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-accessory-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-accessory-next');
  await tapObject(page, 'UnicornCreatorScene', 'creator-action-save-changes');
  await waitForScene(page, 'TitleScene');

  const stored = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'),
    SAVE_KEY,
  );
  expect(stored.profile.appearance).toMatchObject({
    bodyColour: 'buttercup',
    maneStyle: 'braid',
    tailStyle: 'braid',
    hornStyle: 'crystal',
    marking: 'sparkles',
    accessory: 'crown',
  });
  expect(stored.profile.currentLocationId).toBe('location:moonflower-cottage-interior');
  expect(stored.profile.unlockedAbilityIds).toEqual(['ability:rainbow-jump']);
  expect(stored.inventory.itemQuantities['currency:shimmer']).toBe(42);
});

test('Default Look changes appearance only and Restore Saved recovers the complete profile', async ({
  page,
}) => {
  await seedSave(page);
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'My Unicorn');
  await waitForScene(page, 'UnicornCreatorScene');

  const input = page.locator('.unicorn-name-input');
  await input.fill('Moonlight');
  await tapObject(page, 'UnicornCreatorScene', 'creator-action-default');
  await expect(input).toHaveValue('Moonlight');
  expect(creatorText(await getSnapshot(page))).toContain('Soft Waves');

  await tapObject(page, 'UnicornCreatorScene', 'creator-action-restore-saved');
  await expect(input).toHaveValue('Starlight');
  const restoredText = creatorText(await getSnapshot(page));
  expect(restoredText).toContain('Fluffy');
  expect(restoredText).toContain('Little Bow');
});
