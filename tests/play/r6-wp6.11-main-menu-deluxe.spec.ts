import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';
const ACCESSIBILITY_KEY = 'unicorn-valley:accessibility-settings:v1';

interface DiagnosticObject {
  name: string;
  text: string | null;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
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

function createStoredSave(name: string): Record<string, unknown> {
  const timestamp = '2026-08-26T20:00:00.000Z';
  return {
    schemaVersion: 2,
    createdAt: timestamp,
    lastSavedAt: timestamp,
    profile: {
      name,
      appearance: { bodyColour: 'mint' },
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

function visibleTitleText(snapshot: DiagnosticSnapshot): string[] {
  return (
    snapshot.scenes
      .find((scene) => scene.key === 'TitleScene')
      ?.objects.filter((object) => object.visible && object.text !== null)
      .map((object) => object.text as string) ?? []
  );
}

test('new players get a clean front door without irrelevant returning-player actions', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  const snapshot = await getSnapshot(page);
  const visibleText = visibleTitleText(snapshot);
  expect(visibleText).toContain('Unicorn Valley');
  expect(visibleText).toContain('New Game');
  expect(visibleText).toContain('Settings');
  expect(visibleText).not.toContain('Continue');
  expect(visibleText).not.toContain('My Unicorn');

  await tapTitleText(page, 'New Game');
  await waitForScene(page, 'UnicornCreatorScene');
});

test('returning players get one-tap Continue plus protected New Game and My Unicorn', async ({
  page,
}) => {
  const save = createStoredSave('Starlight');
  await page.addInitScript(
    ({ saveKey, storedSave }) => window.localStorage.setItem(saveKey, JSON.stringify(storedSave)),
    { saveKey: SAVE_KEY, storedSave: save },
  );

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  const visibleText = visibleTitleText(await getSnapshot(page));
  expect(visibleText).toContain('Continue');
  expect(visibleText).toContain('New Game');
  expect(visibleText).toContain('My Unicorn');
  expect(visibleText).toContain('Settings');

  await tapTitleText(page, 'Continue');
  await waitForScene(page, 'CottageInteriorScene');
});

test('front-door settings expose persistent accessibility preferences', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await tapTitleText(page, 'Settings');
  expect(visibleTitleText(await getSnapshot(page))).toContain('Reduced motion: Off');

  await tapTitleText(page, 'Reduced motion: Off');
  expect(visibleTitleText(await getSnapshot(page))).toContain('Reduced motion: On');
  const stored = await page.evaluate((key) => window.localStorage.getItem(key), ACCESSIBILITY_KEY);
  expect(JSON.parse(stored ?? '{}')).toMatchObject({ reducedMotion: true });

  await tapTitleText(page, 'Done');
  expect(visibleTitleText(await getSnapshot(page))).not.toContain('Reduced motion: On');
});

test.describe('phone portrait title controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('essential menu and settings actions stay physically readable and touch-sized', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await waitForScene(page, 'TitleScene');

    const portraitControls = page.locator('[data-title-portrait-controls="true"]');
    await expect(portraitControls).toBeVisible();

    const newGame = page.locator('[data-title-action="title-menu-new-game"]');
    const settings = page.locator('[data-title-action="title-menu-settings"]');
    for (const target of [newGame, settings]) {
      await expect(target).toBeVisible();
      const bounds = await target.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(54);
      expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(240);
    }

    const canvas = await page.locator('canvas').boundingBox();
    const controls = await portraitControls.boundingBox();
    expect(canvas).not.toBeNull();
    expect(controls).not.toBeNull();
    expect(canvas?.y ?? 0).toBeLessThanOrEqual(1);
    expect((controls?.y ?? 0) + (controls?.height ?? 0)).toBeLessThanOrEqual(844);
    expect(controls?.y ?? 0).toBeGreaterThanOrEqual((canvas?.y ?? 0) + (canvas?.height ?? 0));

    await settings.click();
    const settingTargets = page.locator('.title-portrait-settings [data-title-action]');
    await expect(
      page.locator('[data-title-action="title-setting-fullscreen"]'),
    ).toBeVisible();
    await expect(settingTargets.first()).toBeVisible();
    const settingCount = await settingTargets.count();
    expect(settingCount).toBe(8);
    for (let index = 0; index < settingCount; index += 1) {
      const bounds = await settingTargets.nth(index).boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(54);
    }

    await page.locator('[data-title-action="title-settings-done"]').click();
    await newGame.click();
    await waitForScene(page, 'UnicornCreatorScene');
    await expect(portraitControls).toBeHidden();
  });
});
