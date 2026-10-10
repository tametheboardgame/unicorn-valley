import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  active: boolean;
  interactive: boolean;
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: Array<{ key: string; objects: DiagnosticObject[] }>;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, payload }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: {
            startScene(scene: string, data?: object): void;
          };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.startScene(key, payload);
    },
    { key: sceneKey, payload: data },
  );
  await waitForScene(page, sceneKey);
  await page.waitForTimeout(260);
}

async function findObject(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<DiagnosticObject | null> {
  return page.evaluate(
    ({ key, name }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return (
        diagnostics
          ?.snapshot()
          .scenes.find((scene) => scene.key === key)
          ?.objects.find((object) => object.name === name) ?? null
      );
    },
    { key: sceneKey, name: objectName },
  );
}

async function expectWorldIdentity(
  page: Page,
  sceneKey: string,
  id: 'pip' | 'willow' | 'marigold' | 'pebble' | 'nova' | 'lumi',
): Promise<void> {
  const objectName = id === 'nova' ? 'core-npc:nova:race-hub' : `core-npc:${id}:world`;
  await expect
    .poll(async () => (await findObject(page, sceneKey, objectName))?.visible ?? false, {
      timeout: 6_000,
    })
    .toBe(true);

  const npc = await findObject(page, sceneKey, objectName);
  expect(npc, `${id} overworld sprite should exist`).toBeTruthy();
  expect(npc?.visible).toBe(true);
  expect(npc?.active).toBe(true);
  expect(npc?.textureKey).toMatch(
    new RegExp(
      id === 'nova'
        ? '^nova-modern:'
        : id === 'willow' || id === 'marigold' || id === 'pebble'
          ? `^village-core-resident:${id}:`
          : `^core-npc-production:${id}:`,
    ),
  );
  expect(npc?.displayWidth ?? 0).toBeGreaterThan(70);
  expect(npc?.displayHeight ?? 0).toBeGreaterThan(55);
}

async function seedRevealedStarwell(page: Page, picnicReady = false): Promise<void> {
  await page.addInitScript(({ picnicReady }) => {
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
      quests: {
        byQuestId: picnicReady
          ? {
              'quest:maple-wobbly-cake-plan': {
                status: 'completed',
                currentStepId: null,
                completedAt: timestamp,
              },
            }
          : {},
      },
      world: {
        flags: {
          ...(picnicReady
            ? {
                'flag:marigold-picnic-ready': true,
                'flag:marigold-picnic-theme-sunshine': true,
              }
            : {}),
          'flag:r5-woods-starwell-revealed': true,
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
    const serialisedSave = JSON.stringify(save);
    window.localStorage.setItem('unicorn-valley.save', serialisedSave);
    window.localStorage.setItem('unicorn-valley.save.schema.2', serialisedSave);
  }, { picnicReady });
}

async function seedUnintroducedPip(page: Page): Promise<void> {
  await page.addInitScript(() => {
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
          'flag:r5-woods-starwell-revealed': true,
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
    const serialisedSave = JSON.stringify(save);
    window.localStorage.setItem('unicorn-valley.save', serialisedSave);
    window.localStorage.setItem('unicorn-valley.save.schema.2', serialisedSave);
  });
}
test.describe('R6-WP6.2 core NPC production art', () => {
  test('Pip stays absent before the authored arrival trigger and appears only after introduction begins', async ({
    page,
  }) => {
    await seedUnintroducedPip(page);
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');

    await page.waitForTimeout(350);
    expect(await findObject(page, 'MoonflowerGladeScene', 'core-npc:pip:world')).toBeNull();

    await page.evaluate(() => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: {
            snapshot(): DiagnosticSnapshot;
            setArcadeSpritePosition(
              sceneKey: string,
              objectName: string,
              x: number,
              y: number,
            ): void;
          };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      const player = diagnostics
        .snapshot()
        .scenes.find((scene) => scene.key === 'MoonflowerGladeScene')
        ?.objects.find((object) => object.name === 'world-player-unicorn');
      if (!player) {
        throw new Error('Moonflower Glade player is unavailable.');
      }
      diagnostics.setArcadeSpritePosition(
        'MoonflowerGladeScene',
        'world-player-unicorn',
        810,
        player.y,
      );
    });

    await expect
      .poll(
        async () =>
          (await findObject(page, 'MoonflowerGladeScene', 'core-npc:pip:world'))?.visible ?? false,
        { timeout: 6_000 },
      )
      .toBe(true);
  });

  test('all six core characters keep canonical production identities in their active world scenes', async ({
    page,
  }) => {
    await seedRevealedStarwell(page);
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');
    await expectWorldIdentity(page, 'MoonflowerGladeScene', 'pip');

    await startScene(page, 'SunbeamVillageScene');
    await expectWorldIdentity(page, 'SunbeamVillageScene', 'willow');
    await expectWorldIdentity(page, 'SunbeamVillageScene', 'marigold');
    await expectWorldIdentity(page, 'SunbeamVillageScene', 'pebble');

    await startScene(page, 'RainbowRunEntryScene');
    await expectWorldIdentity(page, 'RainbowRunEntryScene', 'nova');

    await startScene(page, 'RainbowMeadowScene');
    expect(await findObject(page, 'RainbowMeadowScene', 'core-npc:nova:world')).toBeNull();
    expect(await findObject(page, 'RainbowMeadowScene', 'core-npc:nova:picnic')).toBeNull();

    await startScene(page, 'WhisperingWoodsScene');
    await expectWorldIdentity(page, 'WhisperingWoodsScene', 'lumi');
  });

  test('production identities replace the main overworld placeholders', async ({ page }) => {
    await seedRevealedStarwell(page);
    await page.goto('/?scene=glade&diagnostics=1');
    await waitForScene(page, 'MoonflowerGladeScene');
    await page.waitForTimeout(300);

    const pip = await findObject(page, 'MoonflowerGladeScene', 'core-npc:pip:world');
    expect(pip?.visible).toBe(true);
    expect(pip?.textureKey).toBe('core-npc-production:pip:neutral');

    await startScene(page, 'SunbeamVillageScene');
    for (const id of ['willow', 'marigold', 'pebble'] as const) {
      const npc = await findObject(page, 'SunbeamVillageScene', `core-npc:${id}:world`);
      expect(npc, `${id} overworld sprite should exist`).toBeTruthy();
      expect(npc?.visible).toBe(true);
      expect(npc?.displayWidth ?? 0).toBeGreaterThan(90);
    }

    await startScene(page, 'RainbowRunEntryScene');
    const nova = await findObject(page, 'RainbowRunEntryScene', 'core-npc:nova:race-hub');
    expect(nova?.visible).toBe(true);
    expect(nova?.textureKey).toBe('nova-modern:idle');

    await startScene(page, 'RainbowMeadowScene');
    expect(await findObject(page, 'RainbowMeadowScene', 'core-npc:nova:world')).toBeNull();
    expect(await findObject(page, 'RainbowMeadowScene', 'nova-canonical-world')).toBeNull();
  });

  test('Nova and Marigold use their canonical picnic identities after the picnic unlock', async ({
    page,
  }) => {
    await seedRevealedStarwell(page, true);
    await page.goto('/?scene=meadow&diagnostics=1');
    await waitForScene(page, 'RainbowMeadowScene');

    await expect
      .poll(async () =>
        (await findObject(page, 'RainbowMeadowScene', 'core-npc:nova:picnic'))?.visible ?? false,
      )
      .toBe(true);
    await expect
      .poll(async () =>
        (await findObject(page, 'RainbowMeadowScene', 'core-npc:marigold:picnic'))?.visible ?? false,
      )
      .toBe(true);
    const nova = await findObject(page, 'RainbowMeadowScene', 'core-npc:nova:picnic');
    const marigold = await findObject(page, 'RainbowMeadowScene', 'core-npc:marigold:picnic');
    expect(nova?.textureKey).toBe('nova-modern:idle');
    expect(marigold?.textureKey).toMatch(/^village-core-resident:marigold:/);
    expect(await findObject(page, 'RainbowMeadowScene', 'core-npc:nova:world')).toBeNull();

    await startScene(page, 'RainbowRunEntryScene');
    expect(await findObject(page, 'RainbowRunEntryScene', 'core-npc:nova:race-hub')).toBeNull();
  });
});
