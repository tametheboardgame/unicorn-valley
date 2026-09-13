import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'unicorn-valley.save';

interface DiagnosticObject {
  name: string;
  text: string | null;
  visible: boolean;
  effectiveVisible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: Array<{
    key: string;
    objects: DiagnosticObject[];
  }>;
}

function createStoredSave(): Record<string, unknown> {
  const timestamp = '2026-09-13T18:00:00.000Z';
  return {
    schemaVersion: 2,
    createdAt: timestamp,
    lastSavedAt: timestamp,
    profile: {
      name: 'Starlight',
      appearance: { bodyColour: 'mint' },
      currentLocationId: 'location:moonflower-glade',
      unlockedAbilityIds: [],
    },
    inventory: {
      itemQuantities: {},
      ownedCosmeticIds: [],
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

async function openTitle(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('TitleScene') === true;
  });
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Browser diagnostics are unavailable.');
    return api.snapshot();
  });
}

function titleObject(current: DiagnosticSnapshot, name: string): DiagnosticObject | undefined {
  return current.scenes
    .find((scene) => scene.key === 'TitleScene')
    ?.objects.find((object) => object.name === name);
}

function actionSpan(current: DiagnosticSnapshot, names: readonly string[]): number {
  const actionYs = names.map((name) => titleObject(current, name)?.y ?? Number.NaN);
  expect(actionYs.every(Number.isFinite)).toBe(true);
  return Math.max(...actionYs) - Math.min(...actionYs);
}

async function seedReturningSave(page: Page): Promise<void> {
  const save = createStoredSave();
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: SAVE_KEY, value: save },
  );
}

test.describe('R6.5-WP19H0.5 home screen polish', () => {
  test('desktop fresh-player card is compact, generated-only and layered with ambient sparkles', async ({
    page,
  }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTitle(page);
    await page.waitForFunction(() => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const title = api?.snapshot().scenes.find((scene) => scene.key === 'TitleScene');
      return (
        title?.objects.some((object) => object.name === 'title-generated-logo') === true &&
        title.objects.some((object) => object.name === 'title-generated-sparkles')
      );
    });

    const current = await snapshot(page);
    expect(titleObject(current, 'title-menu-panel')).toBeDefined();
    expect(titleObject(current, 'title-menu-new-game')?.interactive).toBe(true);
    expect(titleObject(current, 'title-menu-settings')?.interactive).toBe(true);
    expect(
      actionSpan(current, ['title-menu-new-game', 'title-menu-settings']),
    ).toBeGreaterThanOrEqual(70);
    expect(actionSpan(current, ['title-menu-new-game', 'title-menu-settings'])).toBeLessThan(100);
    expect(titleObject(current, 'title-menu-continue')).toBeUndefined();
    expect(titleObject(current, 'title-menu-my-unicorn')).toBeUndefined();
    expect(titleObject(current, 'title-settings-panel')).toBeUndefined();
    expect(
      current.scenes
        .find((scene) => scene.key === 'TitleScene')
        ?.objects.some((object) => object.name.startsWith('title-art:')),
    ).toBe(false);

    await page.screenshot({
      path: test.info().outputPath('wp19h0.5-home-desktop-fresh.png'),
      fullPage: true,
    });
  });

  test('desktop returning-player card expands only as much as its four actions require', async ({
    page,
  }) => {
    await seedReturningSave(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTitle(page);

    const current = await snapshot(page);
    expect(titleObject(current, 'title-menu-panel')).toBeDefined();
    const actionNames = [
      'title-menu-continue',
      'title-menu-new-game',
      'title-menu-my-unicorn',
      'title-menu-settings',
    ] as const;
    expect(actionSpan(current, actionNames)).toBeGreaterThanOrEqual(210);
    expect(actionSpan(current, actionNames)).toBeLessThan(230);
    for (const name of actionNames) {
      expect(titleObject(current, name)?.interactive, `${name} interactive`).toBe(true);
    }

    const status = titleObject(current, 'title-menu-status');
    const lastAction = titleObject(current, 'title-menu-settings');
    expect((status?.y ?? 0) - (lastAction?.y ?? 0)).toBeGreaterThan(50);

    await page.screenshot({
      path: test.info().outputPath('wp19h0.5-home-desktop-returning.png'),
      fullPage: true,
    });
  });

  test.describe('touch portrait', () => {
    test.use({ viewport: { width: 768, height: 1024 }, hasTouch: true });

    test('tablet portrait keeps the scenic art, real logo and intrinsic action card inside safe bounds', async ({
      page,
    }) => {
      await page.addInitScript(() => window.localStorage.clear());
      await openTitle(page);

      const controls = page.locator('[data-title-portrait-controls="true"]');
      const logo = page.locator('[data-title-portrait-brand="true"]');
      const card = controls.locator('.title-portrait-card');
      await expect(controls).toBeVisible();
      await expect(logo).toBeVisible();
      await expect(card).toBeVisible();

      const controlsBounds = await controls.boundingBox();
      const cardBounds = await card.boundingBox();
      expect(controlsBounds).not.toBeNull();
      expect(cardBounds).not.toBeNull();
      expect(controlsBounds?.height ?? 0).toBeGreaterThanOrEqual(1020);
      expect(cardBounds?.width ?? 999).toBeLessThanOrEqual(490);
      expect((cardBounds?.y ?? 0) + (cardBounds?.height ?? 0)).toBeLessThanOrEqual(1024);

      for (const action of ['title-menu-new-game', 'title-menu-settings']) {
        const button = page.locator(`[data-title-action="${action}"]`);
        const bounds = await button.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(58);
      }

      await page.screenshot({
        path: test.info().outputPath('wp19h0.5-home-tablet-portrait.png'),
        fullPage: true,
      });
    });
  });

  test.describe('touch landscape', () => {
    test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

    test('phone landscape uses the same polished touch composition with 48px actions', async ({
      page,
    }) => {
      await seedReturningSave(page);
      await openTitle(page);

      const controls = page.locator('[data-title-portrait-controls="true"]');
      await expect(controls).toBeVisible();
      const backgroundImage = await controls.evaluate(
        (element) => getComputedStyle(element).backgroundImage,
      );
      expect(backgroundImage).toContain('/assets/title/wp19f-title-landscape.webp');

      const card = controls.locator('.title-portrait-card');
      const cardBounds = await card.boundingBox();
      expect(cardBounds).not.toBeNull();
      expect((cardBounds?.y ?? 0) + (cardBounds?.height ?? 0)).toBeLessThanOrEqual(390);

      for (const action of [
        'title-menu-continue',
        'title-menu-new-game',
        'title-menu-my-unicorn',
        'title-menu-settings',
      ]) {
        const button = page.locator(`[data-title-action="${action}"]`);
        await expect(button).toBeVisible();
        const bounds = await button.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(48);
      }

      await page.screenshot({
        path: test.info().outputPath('wp19h0.5-home-phone-landscape.png'),
        fullPage: true,
      });
    });
  });

  test.describe('reduced motion', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test('touch title removes logo and sparkle animation when reduced motion is requested', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openTitle(page);

      const logo = page.locator('[data-title-portrait-brand="true"]');
      const sparkle = page.locator('.title-portrait-sparkle').first();
      await expect(logo).toBeVisible();
      await expect(sparkle).toBeVisible();
      await expect(logo).toHaveCSS('animation-name', 'none');
      await expect(sparkle).toHaveCSS('animation-name', 'none');
    });
  });
});
