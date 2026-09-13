import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  startScene,
  waitForNamedObject,
} from '../support/browserDiagnostics';

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

async function startWonderbook(page: Page): Promise<void> {
  await startScene(page, 'WonderbookScene', { returnScene: 'MoonflowerGladeScene' });
  await waitForNamedObject(page, 'WonderbookScene', 'wonderbook-section-friends');
}

async function visibleTexts(page: Page): Promise<string[]> {
  const snapshot = await getDiagnosticSnapshot(page);
  return (
    snapshot.scenes
      .find((scene) => scene.key === 'WonderbookScene')
      ?.objects.filter((object) => object.visible && object.text)
      .map((object) => object.text as string) ?? []
  );
}

test('WP15 Wonderbook surfaces friends, places, races and gentle long-term goals', async ({
  page,
}) => {
  await seedWonderbookProgress(page);
  await openDiagnostics(page);
  await startWonderbook(page);

  for (const section of ['friends', 'places', 'races', 'discoveries', 'goals']) {
    await waitForNamedObject(page, 'WonderbookScene', `wonderbook-section-${section}`);
  }

  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-section-friends');
  await waitForNamedObject(page, 'WonderbookScene', 'wonderbook-sticker:character:pip');
  let texts = await visibleTexts(page);
  expect(texts).toContain('Pip');
  expect(texts).toContain('Good Friend');
  expect(texts).toContain('Someone to meet...');

  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-section-places');
  await waitForNamedObject(page, 'WonderbookScene', 'wonderbook-sticker:region:sunbeam-village');
  texts = await visibleTexts(page);
  expect(texts).toContain('Sunbeam Village');
  expect(texts.some((text) => text.includes('Cake styles 2 of 3'))).toBe(true);

  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-next-page');
  await waitForNamedObject(page, 'WonderbookScene', 'wonderbook-sticker:region:starlight-beach');
  texts = await visibleTexts(page);
  expect(texts).toContain('Starlight Beach');
  expect(texts.some((text) => text.includes('Beach notebook 1 of 3'))).toBe(true);

  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-section-races');
  await waitForNamedObject(
    page,
    'WonderbookScene',
    'wonderbook-sticker:race-course:rainbow-meadow-petal-parade',
  );
  texts = await visibleTexts(page);
  expect(texts).toContain('Petal Parade');
  expect(texts).toContain('Course finished ✨');

  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-section-goals');
  await waitForNamedObject(page, 'WonderbookScene', 'wonderbook-sticker:goal:valley-explorer');
  texts = await visibleTexts(page);
  expect(texts).toContain('Valley Explorer');
  expect(texts).toContain('Friendship Garden');
  expect(texts).toContain('Ribbon Journey');
  expect(texts).toContain('Curiosity Cabinet');
  expect(texts.some((text) => text.includes('never chores'))).toBe(true);
});

test('WP15 keeps the discovery secret filter and mystery presentation', async ({ page }) => {
  await seedWonderbookProgress(page);
  await openDiagnostics(page);
  await startWonderbook(page);

  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-section-discoveries');
  await waitForNamedObject(page, 'WonderbookScene', 'wonderbook-tab-secrets');
  await clickNamedObject(page, 'WonderbookScene', 'wonderbook-tab-secrets');

  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: {
        snapshot(): {
          scenes: Array<{
            key: string;
            objects: Array<{ visible: boolean; text?: string | null }>;
          }>;
        };
      };
    };
    const scene = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
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
