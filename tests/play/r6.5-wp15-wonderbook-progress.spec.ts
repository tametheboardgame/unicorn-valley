import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
}

async function seedWonderbookProgress(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const timestamp = '2026-09-05T07:30:00.000Z';
    localStorage.setItem(
      'unicorn-valley.save',
      JSON.stringify({
        schemaVersion: 2,
        createdAt: timestamp,
        lastSavedAt: timestamp,
        profile: {
          name: 'Star',
          appearance: {},
          currentLocationId: 'moonflower-cottage',
          unlockedAbilityIds: [],
        },
        inventory: {
          itemQuantities: {},
          ownedCosmeticIds: [],
          ownedDecorationIds: [],
          specialItemIds: [],
        },
        relationships: {
          byCharacterId: {
            'character:pip': {
              friendshipPoints: 18,
              flags: [],
            },
          },
        },
        quests: { byQuestId: {} },
        world: {
          flags: {},
          discoveredZoneIds: [],
          changedObjectIds: ['wp13-persistent:shore-starwell-lantern'],
          uniqueDiscoveryIds: [],
        },
        home: {
          ownedFurnitureIds: [],
          furnitureBySlot: {},
          gardenFlags: {},
        },
        activities: {
          racesById: {
            'race-course:rainbow-meadow-petal-parade': {
              bestTimeMs: 81234,
              ribbonIds: ['item:petal-parade-finisher-ribbon'],
            },
          },
          miniGameRecords: {
            'minigame:maple-baking-table': 2,
            'minigame:coral-beachcombing': 1,
          },
        },
        collections: {
          discoveryIds: [
            'discovery:moonflower-glade',
            'discovery:sunshine-sprinkle-cake',
            'discovery:tidepool-star-notebook-page',
            'discovery:petal-parade-ribbons',
          ],
          memoryIds: ['memory:r65-wp14-maple-baking-first-completion'],
        },
      }),
    );
  });
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function startWonderbook(page: Page): Promise<void> {
  await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are not installed.');
    }
    diagnostics.startScene('WonderbookScene', { returnScene: 'MoonflowerGladeScene' });
  });
  await waitForObject(page, 'wonderbook-section-friends');
}

async function waitForObject(page: Page, objectName: string): Promise<void> {
  await page.waitForFunction((name) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics
      ?.snapshot()
      .scenes.find((candidate) => candidate.key === 'WonderbookScene');
    return scene?.objects.some((object) => object.name === name && object.visible) ?? false;
  }, objectName);
}

async function visibleTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics
      ?.snapshot()
      .scenes.find((candidate) => candidate.key === 'WonderbookScene');
    return (
      scene?.objects
        .filter((object) => object.visible && object.text)
        .map((object) => object.text as string) ?? []
    );
  });
}

test('WP15 Wonderbook surfaces friends, places, races and gentle long-term goals', async ({
  page,
}) => {
  await seedWonderbookProgress(page);
  await waitForDiagnostics(page);
  await startWonderbook(page);
  const canvas = page.locator('canvas');

  await canvas.click({ position: { x: 450, y: 154 } });
  await waitForObject(page, 'wonderbook-sticker:character:pip');
  let texts = await visibleTexts(page);
  expect(texts).toContain('Pip');
  expect(texts).toContain('Good Friend');
  expect(texts).toContain('Someone to meet...');

  await canvas.click({ position: { x: 640, y: 154 } });
  await waitForObject(page, 'wonderbook-sticker:region:sunbeam-village');
  texts = await visibleTexts(page);
  expect(texts).toContain('Sunbeam Village');
  expect(texts.some((text) => text.includes('Cake styles 2 of 3'))).toBe(true);

  await canvas.click({ position: { x: 1140, y: 608 } });
  await waitForObject(page, 'wonderbook-sticker:region:starlight-beach');
  texts = await visibleTexts(page);
  expect(texts).toContain('Starlight Beach');
  expect(texts.some((text) => text.includes('Beach notebook 1 of 3'))).toBe(true);

  await canvas.click({ position: { x: 830, y: 154 } });
  await waitForObject(page, 'wonderbook-sticker:race-course:rainbow-meadow-petal-parade');
  texts = await visibleTexts(page);
  expect(texts).toContain('Petal Parade');
  expect(texts).toContain('Course finished ✨');

  await canvas.click({ position: { x: 1020, y: 154 } });
  await waitForObject(page, 'wonderbook-sticker:goal:valley-explorer');
  texts = await visibleTexts(page);
  expect(texts).toContain('Valley Explorer');
  expect(texts).toContain('Friendship Garden');
  expect(texts).toContain('Ribbon Journey');
  expect(texts).toContain('Curiosity Cabinet');
  expect(texts.some((text) => text.includes('never chores'))).toBe(true);
});

test('WP15 keeps the discovery secret filter and mystery presentation', async ({ page }) => {
  await seedWonderbookProgress(page);
  await waitForDiagnostics(page);
  await startWonderbook(page);
  const canvas = page.locator('canvas');

  await canvas.click({ position: { x: 260, y: 154 } });
  await waitForObject(page, 'wonderbook-tab-secrets');
  await canvas.click({ position: { x: 1030, y: 198 } });

  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics
      ?.snapshot()
      .scenes.find((candidate) => candidate.key === 'WonderbookScene');
    return (
      scene?.objects.some((object) => object.visible && object.text === 'A mystery...') ?? false
    );
  });

  const texts = await visibleTexts(page);
  expect(texts).toContain('A mystery...');
  expect(texts.some((text) => text.includes('Secret'))).toBe(true);
});
