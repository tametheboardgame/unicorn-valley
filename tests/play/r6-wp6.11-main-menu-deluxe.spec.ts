import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';

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

function titleActionSpan(snapshot: DiagnosticSnapshot, names: readonly string[]): number {
  const title = snapshot.scenes.find((scene) => scene.key === 'TitleScene');
  const actionYs = names.map(
    (name) => title?.objects.find((object) => object.name === name)?.y ?? Number.NaN,
  );
  expect(actionYs.every(Number.isFinite)).toBe(true);
  return Math.max(...actionYs) - Math.min(...actionYs);
}

test('new players get a compact front door without irrelevant returning-player actions', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  const snapshot = await getSnapshot(page);
  const visibleText = visibleTitleText(snapshot);
  expect(visibleText).toContain('Welcome to Unicorn Valley');
  expect(visibleText).toContain('New Game');
  expect(visibleText).toContain('Settings');
  expect(visibleText).not.toContain('Continue');
  expect(visibleText).not.toContain('My Unicorn');
  expect(
    titleActionSpan(snapshot, ['title-menu-new-game', 'title-menu-settings']),
  ).toBeGreaterThanOrEqual(70);
  expect(titleActionSpan(snapshot, ['title-menu-new-game', 'title-menu-settings'])).toBeLessThan(
    100,
  );

  await tapTitleText(page, 'New Game');
  await waitForScene(page, 'UnicornCreatorScene');
});

test('returning players get the expanded card, one-tap Continue and protected New Game', async ({
  page,
}) => {
  const save = createStoredSave('Starlight');
  await page.addInitScript(
    ({ saveKey, storedSave }) => window.localStorage.setItem(saveKey, JSON.stringify(storedSave)),
    { saveKey: SAVE_KEY, storedSave: save },
  );

  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  const snapshot = await getSnapshot(page);
  const visibleText = visibleTitleText(snapshot);
  expect(visibleText).toContain('Welcome back!');
  expect(visibleText).toContain('Continue');
  expect(visibleText).toContain('New Game');
  expect(visibleText).toContain('My Unicorn');
  expect(visibleText).toContain('Settings');
  expect(
    titleActionSpan(snapshot, [
      'title-menu-continue',
      'title-menu-new-game',
      'title-menu-my-unicorn',
      'title-menu-settings',
    ]),
  ).toBeGreaterThanOrEqual(210);
  expect(
    titleActionSpan(snapshot, [
      'title-menu-continue',
      'title-menu-new-game',
      'title-menu-my-unicorn',
      'title-menu-settings',
    ]),
  ).toBeLessThan(230);

  await tapTitleText(page, 'Continue');
  await waitForScene(page, 'CottageInteriorScene');
});

test('front-door Settings launches the same canonical SettingsScene as the game', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  const before = await getSnapshot(page);
  expect(
    before.scenes
      .find((scene) => scene.key === 'TitleScene')
      ?.objects.some((object) => object.name === 'title-settings-panel'),
  ).toBe(false);

  await tapTitleText(page, 'Settings');
  await waitForScene(page, 'SettingsScene');

  const opened = await getSnapshot(page);
  expect(opened.activeScenes).toContain('SettingsScene');
  expect(opened.activeScenes).not.toContain('TitleScene');
  expect(
    opened.scenes
      .find((scene) => scene.key === 'SettingsScene')
      ?.objects.some((object) => object.name === 'settings-panel'),
  ).toBe(true);

  await page.keyboard.press('Escape');
  await waitForScene(page, 'TitleScene');
  expect((await getSnapshot(page)).activeScenes).not.toContain('SettingsScene');
});

test.describe('phone portrait title controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('portrait is a full scenic composition with touch-sized actions and canonical Settings', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/?diagnostics=1');
    await waitForScene(page, 'TitleScene');

    const portraitControls = page.locator('[data-title-portrait-controls="true"]');
    await expect(portraitControls).toBeVisible();
    const logo = page.locator('[data-title-portrait-brand="true"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /unicorn-valley-logo\.webp$/);

    const newGame = page.locator('[data-title-action="title-menu-new-game"]');
    const settings = page.locator('[data-title-action="title-menu-settings"]');
    for (const target of [newGame, settings]) {
      await expect(target).toBeVisible();
      const bounds = await target.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(58);
      expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(240);
    }

    const controls = await portraitControls.boundingBox();
    expect(controls).not.toBeNull();
    expect(controls?.y ?? 999).toBeLessThanOrEqual(1);
    expect(controls?.height ?? 0).toBeGreaterThanOrEqual(840);
    await expect(page.locator('canvas')).toHaveCSS('pointer-events', 'none');

    await settings.click();
    await waitForScene(page, 'SettingsScene');
    await expect(portraitControls).toBeHidden();
    await expect(page.locator('canvas')).not.toHaveCSS('pointer-events', 'none');

    await page.keyboard.press('Escape');
    await waitForScene(page, 'TitleScene');
    await expect(portraitControls).toBeVisible();

    await newGame.click();
    await waitForScene(page, 'UnicornCreatorScene');
    await expect(portraitControls).toBeHidden();
  });
});
