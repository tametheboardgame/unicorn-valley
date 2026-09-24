import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  textureKey: string | null;
  x: number;
  y: number;
  visible: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

async function seedIntroducedPip(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    const timestamp = new Date().toISOString();
    const save = {
      schemaVersion: 2,
      createdAt: timestamp,
      lastSavedAt: timestamp,
      profile: {
        name: null,
        appearance: {},
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
        flags: {
          'flag:pip-intro-appeared': true,
          'flag:pip-welcome-complete': true,
        },
        discoveredZoneIds: [],
        changedObjectIds: [],
        uniqueDiscoveryIds: [],
      },
      home: {
        ownedFurnitureIds: [],
        furnitureBySlot: {},
        gardenFlags: {},
      },
      activities: {
        racesById: {},
        miniGameRecords: {},
      },
      collections: {
        discoveryIds: [],
        memoryIds: [],
      },
    };
    const serialised = JSON.stringify(save);
    localStorage.setItem('unicorn-valley.save', serialised);
    localStorage.setItem('unicorn-valley.save.schema.2', serialised);
  });
}

async function getSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
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
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
  await page.waitForTimeout(250);
}

async function holdUntilScene(
  page: Page,
  key: 'ArrowLeft' | 'ArrowRight',
  sceneKey: string,
): Promise<void> {
  await page.keyboard.down(key);
  try {
    await waitForScene(page, sceneKey);
  } finally {
    await page.keyboard.up(key);
  }
  await page.waitForTimeout(180);
}

for (const [alias, sceneKey, minimumDetails] of [
  ['glade', 'MoonflowerGladeScene', 18],
  ['village', 'SunbeamVillageScene', 32],
  ['meadow', 'RainbowMeadowScene', 18],
] as const) {
  test(`${sceneKey} receives joined paths and scenic world gateways`, async ({ page }) => {
    await page.goto(`/?scene=${alias}&diagnostics=1`);
    await waitForScene(page, sceneKey);

    const snapshot = await getSnapshot(page);
    const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
    expect(scene).toBeTruthy();

    if (sceneKey === 'SunbeamVillageScene') {
      const names = new Set(
        scene?.objects.filter(({ visible }) => visible).map(({ name }) => name),
      );
      for (const requiredName of [
        'sunbeam-composition:path-network',
        'sunbeam-composition:gateway:moonflower-glade',
        'sunbeam-composition:gateway:rainbow-meadow',
      ]) {
        expect(
          names.has(requiredName),
          `Expected current H3 traversal object ${requiredName}`,
        ).toBe(true);
      }
      return;
    }

    const details =
      scene?.objects.filter(
        (object) => object.name === 'world-traversal-polish-detail' && object.visible,
      ) ?? [];
    expect(details.length).toBeGreaterThanOrEqual(minimumDetails);

    for (const detail of details) {
      expect(detail.scrollFactorX).toBe(1);
      expect(detail.scrollFactorY).toBe(1);
    }
  });
}

test('walking through the Village west gateway travels to the Glade and back without interact', async ({
  page,
}) => {
  // This test isolates traversal. Fresh-save Pip onboarding intentionally owns movement once the
  // player reaches the Glade, so seed the completed welcome rather than treating that modal as a
  // gateway failure.
  await seedIntroducedPip(page);
  await page.goto('/?scene=village&diagnostics=1');
  await waitForScene(page, 'SunbeamVillageScene');

  await holdUntilScene(page, 'ArrowLeft', 'MoonflowerGladeScene');
  await holdUntilScene(page, 'ArrowRight', 'SunbeamVillageScene');

  const snapshot = await getSnapshot(page);
  const village = snapshot.scenes.find((scene) => scene.key === 'SunbeamVillageScene');
  const player = village?.objects.find((object) => object.name === 'world-player-unicorn');
  expect(player).toBeTruthy();
  expect(player?.x).toBeGreaterThan(250);
  expect(player?.x).toBeLessThan(450);
});

test('walking through the Meadow west gateway travels to the Village and back without interact', async ({
  page,
}) => {
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForScene(page, 'RainbowMeadowScene');

  await holdUntilScene(page, 'ArrowLeft', 'SunbeamVillageScene');
  await holdUntilScene(page, 'ArrowRight', 'RainbowMeadowScene');

  const snapshot = await getSnapshot(page);
  const meadow = snapshot.scenes.find((scene) => scene.key === 'RainbowMeadowScene');
  const player = meadow?.objects.find((object) => object.name === 'world-player-unicorn');
  expect(player).toBeTruthy();
  expect(player?.x).toBeGreaterThan(250);
  expect(player?.x).toBeLessThan(450);
});

test('exploration movement produces subtle hoof-step detail while travelling', async ({ page }) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  await page.keyboard.down('ArrowRight');
  try {
    await page.waitForFunction(() => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
      };
      return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.some((scene) =>
          scene.objects.some((object) => object.name === 'world-movement-detail' && object.visible),
        );
    });
  } finally {
    await page.keyboard.up('ArrowRight');
  }
});
