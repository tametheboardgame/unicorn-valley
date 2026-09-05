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

interface DiagnosticSceneHealthSnapshot {
  key: string;
  lifecycleState: 'active' | 'paused' | 'sleeping' | 'visible' | 'inactive';
  objectCount: number;
  timerCount: number | null;
  tweenCount: number | null;
}

interface BrowserDiagnosticHealthSnapshot {
  heartbeatAgeMs: number;
  lastFrameMs: number;
  recentFrameCount: number;
  recentLongFrameCount: number;
  worstRecentFrameMs: number;
  scenes: DiagnosticSceneHealthSnapshot[];
  lastInteraction: unknown;
  lastError: unknown;
  rendererContextLost: boolean;
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
  health: BrowserDiagnosticHealthSnapshot;
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

async function waitForRegisteredScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().health.scenes.some((scene) => scene.key === expected) === true;
  }, sceneKey);
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

async function sceneHealth(page: Page, sceneKey: string): Promise<DiagnosticSceneHealthSnapshot> {
  const health = (await snapshot(page)).health.scenes.find((scene) => scene.key === sceneKey);
  if (!health) {
    throw new Error(`No lifecycle health snapshot is available for ${sceneKey}.`);
  }
  return health;
}

async function assertHealthyRuntime(page: Page): Promise<void> {
  const health = (await snapshot(page)).health;
  expect(health.lastError, 'Freeze diagnostics must not record a runtime error').toBeNull();
  expect(health.rendererContextLost, 'Renderer context must remain available').toBe(false);
  expect(health.heartbeatAgeMs, 'The Phaser frame heartbeat must remain live').toBeLessThan(2_000);
  expect(
    health.recentFrameCount,
    'Freeze diagnostics should retain bounded frame samples',
  ).toBeGreaterThan(0);
}

function assertStableCounts(
  samples: readonly DiagnosticSceneHealthSnapshot[],
  sceneKey: string,
): void {
  expect(samples.length).toBeGreaterThan(1);
  const objectCounts = samples.map((sample) => sample.objectCount);
  expect(
    Math.max(...objectCounts) - Math.min(...objectCounts),
    `${sceneKey} object count should not grow across lifecycle cycles`,
  ).toBeLessThanOrEqual(3);

  const timerCounts = samples
    .map((sample) => sample.timerCount)
    .filter((count): count is number => count !== null);
  if (timerCounts.length > 1) {
    expect(
      Math.max(...timerCounts) - Math.min(...timerCounts),
      `${sceneKey} timer count should remain bounded`,
    ).toBeLessThanOrEqual(1);
  }

  const tweenCounts = samples
    .map((sample) => sample.tweenCount)
    .filter((count): count is number => count !== null);
  if (tweenCounts.length > 1) {
    expect(
      Math.max(...tweenCounts) - Math.min(...tweenCounts),
      `${sceneKey} tween count should remain bounded`,
    ).toBeLessThanOrEqual(1);
  }
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

async function seedRetiredInventoryItem(page: Page): Promise<void> {
  await page.evaluate(() => {
    const storageKey = 'unicorn-valley.save';
    const candidateKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key === storageKey || key?.startsWith(`${storageKey}.schema.`)) {
        candidateKeys.push(key);
      }
    }

    let mutatedRecords = 0;
    for (const key of candidateKeys) {
      const rawSave = localStorage.getItem(key);
      if (!rawSave) {
        continue;
      }
      const save = JSON.parse(rawSave) as {
        inventory?: { itemQuantities?: Record<string, number> };
      };
      if (!save.inventory?.itemQuantities) {
        continue;
      }
      save.inventory.itemQuantities['item:retired-from-old-build'] = 1;
      localStorage.setItem(key, JSON.stringify(save));
      mutatedRecords += 1;
    }

    if (mutatedRecords === 0) {
      throw new Error(
        'Expected Starlight Beach to create a current save before stale-item seeding.',
      );
    }
  });
}

test.describe
  .serial('R6.5-WP18B freeze and lifecycle regressions', () => {
    test('Starlight Beach survives repeated real Bag open/close cycles', async ({ page }) => {
      test.setTimeout(120_000);
      const browserErrors: string[] = [];
      const healthSamples: DiagnosticSceneHealthSnapshot[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));

      await page.goto('/?scene=beach&diagnostics=1');
      await waitForScene(page, 'StarlightBeachScene');
      await resetPerformance(page);

      for (let cycle = 0; cycle < 10; cycle += 1) {
        await openAndCloseBag(page, 'StarlightBeachScene');
        const current = await snapshot(page);
        expect(current.activeScenes).toContain('StarlightBeachScene');
        expect(current.activeScenes).not.toContain('InventoryScene');
        healthSamples.push(await sceneHealth(page, 'StarlightBeachScene'));
      }

      await assertResponsiveMovement(page, 'StarlightBeachScene');
      await page.waitForTimeout(450);
      expect((await performanceSnapshot(page)).sampleCount).toBeGreaterThan(0);
      assertStableCounts(healthSamples, 'StarlightBeachScene');
      await assertHealthyRuntime(page);
      expect(browserErrors, 'Starlight Beach Bag cycling must not throw runtime errors').toEqual(
        [],
      );
    });

    test('Starlight Beach Bag tolerates a retired item ID from a long-running save', async ({
      page,
    }) => {
      test.setTimeout(45_000);
      const browserErrors: string[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));

      await page.goto('/?scene=beach&diagnostics=1');
      await waitForScene(page, 'StarlightBeachScene');
      await seedRetiredInventoryItem(page);
      await page.reload();
      await waitForScene(page, 'StarlightBeachScene');

      await openAndCloseBag(page, 'StarlightBeachScene');
      await assertResponsiveMovement(page, 'StarlightBeachScene');
      await assertHealthyRuntime(page);
      expect(browserErrors, 'A stale inventory ID must not break the real Beach Bag flow').toEqual(
        [],
      );
    });

    test('Hollow Tree Nook remains playable across repeated Bag and re-entry cycles', async ({
      page,
    }) => {
      test.setTimeout(120_000);
      const browserErrors: string[] = [];
      const healthSamples: DiagnosticSceneHealthSnapshot[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));

      await page.goto('/?scene=glade&diagnostics=1');
      await waitForScene(page, 'MoonflowerGladeScene');
      await waitForRegisteredScene(page, 'HollowTreeNookScene');

      for (let cycle = 0; cycle < 8; cycle += 1) {
        await startScene(page, 'HollowTreeNookScene');
        await waitForScene(page, 'HollowTreeNookScene');
        await openAndCloseBag(page, 'HollowTreeNookScene');
        await assertResponsiveMovement(page, 'HollowTreeNookScene');
        healthSamples.push(await sceneHealth(page, 'HollowTreeNookScene'));

        await page.keyboard.press('Escape');
        await waitForScene(page, 'MoonflowerGladeScene');
      }

      assertStableCounts(healthSamples, 'HollowTreeNookScene');
      await assertHealthyRuntime(page);
      expect(
        browserErrors,
        'Hollow Tree Nook lifecycle cycling must not throw runtime errors',
      ).toEqual([]);
    });

    test('Twinkle & Thread survives repeated shop, Bag and resume cycles', async ({ page }) => {
      test.setTimeout(120_000);
      const browserErrors: string[] = [];
      const healthSamples: DiagnosticSceneHealthSnapshot[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));

      await page.goto('/?scene=village&diagnostics=1');
      await waitForScene(page, 'SunbeamVillageScene');
      await waitForRegisteredScene(page, 'VillageInteriorScene');
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
        healthSamples.push(await sceneHealth(page, 'VillageInteriorScene'));
      }

      assertStableCounts(healthSamples, 'VillageInteriorScene');
      await assertHealthyRuntime(page);
      await logicalClick(page, 170, 674);
      await waitForScene(page, 'SunbeamVillageScene');
      expect(
        browserErrors,
        'Twinkle & Thread lifecycle cycling must not throw runtime errors',
      ).toEqual([]);
    });
  });
