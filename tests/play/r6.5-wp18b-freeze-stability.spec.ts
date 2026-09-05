import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  textureKey: string | null;
  x: number;
  y: number;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface FramePerformanceSnapshot {
  sampleCount: number;
  averageFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  longFrameCount: number;
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  performance(): FramePerformanceSnapshot;
  resetPerformance(): void;
  startScene(sceneKey: string, data?: object): void;
}

async function snapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.snapshot();
  });
}

async function resetPerformance(page: Page): Promise<void> {
  await page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    api.resetPerformance();
  });
}

async function performanceSnapshot(page: Page): Promise<FramePerformanceSnapshot> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.performance();
  });
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
  await page.waitForTimeout(120);
}

async function logicalClick(page: Page, logicalX: number, logicalY: number): Promise<void> {
  const current = await snapshot(page);
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (logicalX / current.width) * bounds.width,
    bounds.y + (logicalY / current.height) * bounds.height,
  );
}

async function clickNamedObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const current = await snapshot(page);
  const scene = current.scenes.find((candidate) => candidate.key === sceneKey);
  const object = scene?.objects.find((candidate) => candidate.name === objectName);
  if (!object) {
    throw new Error(`Could not find ${objectName} in ${sceneKey}.`);
  }
  await logicalClick(page, object.x, object.y);
}

async function playerPosition(page: Page, sceneKey: string): Promise<{ x: number; y: number }> {
  const current = await snapshot(page);
  const scene = current.scenes.find((candidate) => candidate.key === sceneKey);
  const player = scene?.objects.find((candidate) =>
    candidate.textureKey?.startsWith('player-unicorn-'),
  );
  if (!player) {
    throw new Error(`Could not find the player in ${sceneKey}.`);
  }
  return { x: player.x, y: player.y };
}

async function assertResponsiveMovement(page: Page, sceneKey: string): Promise<void> {
  const before = await playerPosition(page, sceneKey);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(320);
  await page.keyboard.up('ArrowRight');
  const after = await playerPosition(page, sceneKey);
  expect(
    Math.abs(after.x - before.x) + Math.abs(after.y - before.y),
    `${sceneKey} should still accept movement after modal cycling`,
  ).toBeGreaterThan(2);
}

async function openAndCloseBag(page: Page, returnScene: string): Promise<void> {
  await clickNamedObject(page, returnScene, 'exploration-shell-bag-button');
  await waitForScene(page, 'InventoryScene');
  expect((await snapshot(page)).activeScenes).toContain('InventoryScene');
  await clickNamedObject(page, 'InventoryScene', 'bag-close-button');
  await waitForScene(page, returnScene);
}

test.describe
  .serial('R6.5-WP18B freeze and lifecycle regressions', () => {
    test('Starlight Beach survives repeated real Bag open/close cycles', async ({ page }) => {
      test.setTimeout(60_000);
      const browserErrors: string[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));

      await page.goto('/?scene=beach&diagnostics=1');
      await waitForScene(page, 'StarlightBeachScene');
      await resetPerformance(page);

      for (let cycle = 0; cycle < 10; cycle += 1) {
        await openAndCloseBag(page, 'StarlightBeachScene');
        const current = await snapshot(page);
        expect(current.activeScenes).toContain('StarlightBeachScene');
        expect(current.activeScenes).not.toContain('InventoryScene');
      }

      await assertResponsiveMovement(page, 'StarlightBeachScene');
      await page.waitForTimeout(450);
      expect((await performanceSnapshot(page)).sampleCount).toBeGreaterThan(0);
      expect(browserErrors, 'Starlight Beach Bag cycling must not throw runtime errors').toEqual(
        [],
      );
    });

    test('Hollow Tree Nook remains playable across repeated Bag and re-entry cycles', async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const browserErrors: string[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));

      await page.goto('/?scene=glade&diagnostics=1');
      await waitForScene(page, 'MoonflowerGladeScene');

      for (let cycle = 0; cycle < 8; cycle += 1) {
        await startScene(page, 'HollowTreeNookScene');
        await waitForScene(page, 'HollowTreeNookScene');
        await openAndCloseBag(page, 'HollowTreeNookScene');
        await assertResponsiveMovement(page, 'HollowTreeNookScene');

        await page.keyboard.press('Escape');
        await waitForScene(page, 'MoonflowerGladeScene');
      }

      expect(
        browserErrors,
        'Hollow Tree Nook lifecycle cycling must not throw runtime errors',
      ).toEqual([]);
    });

    test('Twinkle & Thread survives repeated shop, Bag and resume cycles', async ({ page }) => {
      test.setTimeout(60_000);
      const browserErrors: string[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));

      await page.goto('/?scene=village&diagnostics=1');
      await waitForScene(page, 'SunbeamVillageScene');
      await startScene(page, 'VillageInteriorScene', {
        interiorId: 'accessory-shop',
        returnScene: 'SunbeamVillageScene',
      });
      await waitForScene(page, 'VillageInteriorScene');

      for (let cycle = 0; cycle < 8; cycle += 1) {
        await logicalClick(page, 470, 475);
        await waitForScene(page, 'ShopScene');

        await logicalClick(page, 495, 684);
        await waitForScene(page, 'InventoryScene');
        await clickNamedObject(page, 'InventoryScene', 'bag-close-button');
        await waitForScene(page, 'VillageInteriorScene');

        const current = await snapshot(page);
        expect(current.activeScenes).toContain('VillageInteriorScene');
        expect(current.activeScenes).not.toContain('ShopScene');
        expect(current.activeScenes).not.toContain('InventoryScene');
      }

      await logicalClick(page, 170, 674);
      await waitForScene(page, 'SunbeamVillageScene');
      expect(
        browserErrors,
        'Twinkle & Thread lifecycle cycling must not throw runtime errors',
      ).toEqual([]);
    });
  });
