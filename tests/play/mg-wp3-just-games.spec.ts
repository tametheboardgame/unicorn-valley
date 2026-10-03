import { expect, test } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

const SAVE_KEY = 'unicorn-valley.save';

const CATALOGUE_IDS = [
  'rainbow-run-racing',
  'rainbow-disc',
  'sunbeam-chess',
  'wobbly-cake',
  'firefly-lantern',
  'pond-leap',
  'coral-beachcombing',
] as const;

test.describe('MG-WP3 Just Games catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await openDiagnostics(page);
    await waitForScene(page, 'TitleScene');
  });

  test('opens from the title and exposes every catalogue-visible game without creating a save', async ({
    page,
  }) => {
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    for (const id of CATALOGUE_IDS) {
      await waitForNamedObject(page, 'JustGamesScene', `just-games-card:${id}`);
    }

    const storedSave = await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);
    expect(storedSave).toBeNull();
  });

  test('launches a no-variant game in sandbox and returns to the catalogue', async ({ page }) => {
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:sunbeam-chess');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForScene(page, 'ChessPlazaActivityScene');

    expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');
    expect((await getDiagnosticSnapshot(page)).activeScenes).not.toContain(
      'ChessPlazaActivityScene',
    );
  });

  test('launches a selected Rainbow Disc variant and returns to Just Games', async ({ page }) => {
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:rainbow-disc');
    await waitForNamedObject(page, 'JustGamesScene', 'just-games-variant:practice');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:practice');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForScene(page, 'RainbowDiscActivityScene');

    expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');
  });

  test('every current catalogue family launches in sandbox and returns to Just Games', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    const cases = [
      {
        gameId: 'rainbow-run-racing',
        variantId: 'race-course:crystal-brook-crystal-cascade',
        sceneKey: 'RaceScene',
      },
      { gameId: 'rainbow-disc', variantId: 'practice', sceneKey: 'RainbowDiscActivityScene' },
      { gameId: 'sunbeam-chess', sceneKey: 'ChessPlazaActivityScene' },
      { gameId: 'wobbly-cake', sceneKey: 'MapleBakingActivityScene' },
      { gameId: 'firefly-lantern', variantId: 'multicolour', sceneKey: 'FireflyLanternScene' },
      { gameId: 'pond-leap', sceneKey: 'PondLeapActivityScene' },
      { gameId: 'coral-beachcombing', sceneKey: 'CoralBeachcombingActivityScene' },
    ] as const;

    for (const entry of cases) {
      await clickNamedObject(page, 'JustGamesScene', `just-games-card:${entry.gameId}`);
      if ('variantId' in entry) {
        await waitForNamedObject(page, 'JustGamesScene', `just-games-variant:${entry.variantId}`);
        await clickNamedObject(page, 'JustGamesScene', `just-games-variant:${entry.variantId}`);
      }
      await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
      await waitForScene(page, entry.sceneKey);

      expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();

      await page.keyboard.press('Escape');
      await waitForScene(page, 'JustGamesScene');
    }
  });

  test('Escape from Just Games returns to the title', async ({ page }) => {
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    await page.keyboard.press('Escape');
    await waitForScene(page, 'TitleScene');
  });
});
