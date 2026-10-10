import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

const SAVE_KEY = 'unicorn-valley.save';

async function openJustGames(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await waitForScene(page, 'TitleScene');
  await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await waitForScene(page, 'JustGamesScene');
}

async function launchJustGamesVariant(
  page: Page,
  gameId: string,
  variantId: string,
  sceneKey: string,
  readyObjectName: string,
): Promise<void> {
  await clickNamedObject(page, 'JustGamesScene', `just-games-card:${gameId}`);
  await waitForNamedObject(page, 'JustGamesScene', `just-games-variant:${variantId}`);
  await clickNamedObject(page, 'JustGamesScene', `just-games-variant:${variantId}`);
  await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
  await waitForScene(page, sceneKey);
  await waitForNamedObject(page, sceneKey, readyObjectName);
  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();
}

test.describe('ENG-WP1.2 current-contract reproduction', () => {
  test('Just Games Rainbow Run launches sandboxed and Escape returns to Just Games', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await openJustGames(page);
    await launchJustGamesVariant(
      page,
      'rainbow-run-racing',
      'race-course:crystal-brook-crystal-cascade',
      'RaceScene',
      'race-assistance-control',
    );

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(snapshot.activeScenes).not.toContain('RaceScene');
  });

  test('Just Games Firefly Lantern launches sandboxed and returns after the activity is ready', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await openJustGames(page);
    await launchJustGamesVariant(
      page,
      'firefly-lantern',
      'multicolour',
      'FireflyLanternScene',
      'firefly-lantern-ui',
    );

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(snapshot.activeScenes).not.toContain('FireflyLanternScene');
  });

  test('Story House current illustration switch changes and remembers the selected set', async ({
    page,
  }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await openDiagnostics(page);
    await waitForScene(page, 'TitleScene');
    await clickNamedObject(page, 'TitleScene', 'title-menu-story-house');

    await expect(page.locator('.story-reader-overlay')).toBeVisible();
    await page.locator('.story-library-book[data-story-id="the-hare-and-the-tortoise"]').click();

    const switcher = page.locator('.story-reader-illustration-switch');
    await expect(switcher).toBeVisible();

    const modern = switcher.getByRole('button', { name: 'Modern', exact: true });
    const classic = switcher.getByRole('button', { name: 'Classic', exact: true });
    await expect(modern).toHaveAttribute('aria-pressed', 'true');

    await classic.click();
    await expect(classic).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.story-reader-paper')).toHaveAttribute(
      'data-story-illustration-set-id',
      'classic',
    );

    await page.getByRole('button', { name: '← Library' }).click();
    await page.locator('.story-library-book[data-story-id="the-hare-and-the-tortoise"]').click();

    const reopenedSwitcher = page.locator('.story-reader-illustration-switch');
    await expect(
      reopenedSwitcher.getByRole('button', { name: 'Classic', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('Race exits to the Rainbow Run Hub once the race scene is ready', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/?scene=race&diagnostics=1');
    await waitForScene(page, 'RaceScene');
    await waitForNamedObject(page, 'RaceScene', 'race-assistance-control');

    await page.keyboard.press('Escape');
    await waitForScene(page, 'RainbowRunEntryScene');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(snapshot.activeScenes).toContain('RainbowRunEntryScene');
    expect(snapshot.activeScenes).not.toContain('RaceScene');
  });
});
