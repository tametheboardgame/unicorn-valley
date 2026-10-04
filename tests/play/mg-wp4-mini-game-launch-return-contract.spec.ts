import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

const SAVE_KEY = 'unicorn-valley.save';

interface JustGamesLaunchReturnCase {
  gameId: string;
  sceneKey: string;
  variantId?: string;
  readyObjectName?: string;
}

const JUST_GAMES_LAUNCH_RETURN_CASES: readonly JustGamesLaunchReturnCase[] = [
  {
    gameId: 'rainbow-run-racing',
    variantId: 'race-course:crystal-brook-crystal-cascade',
    sceneKey: 'RaceScene',
  },
  { gameId: 'rainbow-disc', variantId: 'practice', sceneKey: 'RainbowDiscActivityScene' },
  { gameId: 'sunbeam-chess', sceneKey: 'ChessPlazaActivityScene' },
  {
    gameId: 'wobbly-cake',
    sceneKey: 'MapleBakingActivityScene',
    readyObjectName: 'h3-r2-baking-stage:recipe',
  },
  { gameId: 'firefly-lantern', variantId: 'multicolour', sceneKey: 'FireflyLanternScene' },
  { gameId: 'pond-leap', sceneKey: 'PondLeapActivityScene' },
  { gameId: 'coral-beachcombing', sceneKey: 'CoralBeachcombingActivityScene' },
];

async function openJustGames(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await waitForScene(page, 'TitleScene');
  await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await waitForScene(page, 'JustGamesScene');
}

async function assertJustGamesLaunchReturnContract(
  page: Page,
  entry: JustGamesLaunchReturnCase,
): Promise<void> {
  await clickNamedObject(page, 'JustGamesScene', `just-games-card:${entry.gameId}`);

  if (entry.variantId) {
    await waitForNamedObject(page, 'JustGamesScene', `just-games-variant:${entry.variantId}`);
    await clickNamedObject(page, 'JustGamesScene', `just-games-variant:${entry.variantId}`);
  }

  await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
  await waitForScene(page, entry.sceneKey);
  if (entry.readyObjectName) {
    await waitForNamedObject(page, entry.sceneKey, entry.readyObjectName);
  }

  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();

  await page.keyboard.press('Escape');
  await waitForScene(page, 'JustGamesScene');

  const snapshot = await getDiagnosticSnapshot(page);
  expect(snapshot.activeScenes).not.toContain(entry.sceneKey);
}

test.describe('MG-WP4 reusable Just Games launch/return contract', () => {
  for (const entry of JUST_GAMES_LAUNCH_RETURN_CASES) {
    test(`${entry.gameId} launches sandboxed and returns through the shared contract`, async ({
      page,
    }) => {
      await openJustGames(page);
      await assertJustGamesLaunchReturnContract(page, entry);
    });
  }
});
