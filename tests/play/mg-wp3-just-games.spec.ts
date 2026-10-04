import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

const SAVE_KEY = 'unicorn-valley.save';

async function movePointerToNamedObject(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<void> {
  const snapshot = await getDiagnosticSnapshot(page);
  const object = snapshot.scenes
    .find((scene) => scene.key === sceneKey)
    ?.objects.find(
      (candidate) => candidate.name === objectName && candidate.visible && candidate.interactive,
    );
  if (!object) {
    throw new Error(`Interactive ${sceneKey}/${objectName} is not visible.`);
  }

  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }

  await page.mouse.move(
    bounds.x + (object.x / snapshot.width) * bounds.width,
    bounds.y + (object.y / snapshot.height) * bounds.height,
  );
}

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

  test('click locks the selected game while hover remains preview-only', async ({ page }) => {
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:coral-beachcombing');

    const selectedTitle = () =>
      getDiagnosticSnapshot(page).then(
        (snapshot) =>
          snapshot.scenes
            .find((scene) => scene.key === 'JustGamesScene')
            ?.objects.find((object) => object.name === 'just-games-selected-title')?.text ?? null,
      );

    expect(await selectedTitle()).toBe('Coral Beachcombing');

    await movePointerToNamedObject(page, 'JustGamesScene', 'just-games-card:rainbow-run-racing');

    expect(await selectedTitle()).toBe('Coral Beachcombing');
  });

  test('race variants use a multi-row non-overlapping grid', async ({ page }) => {
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:rainbow-run-racing');

    const snapshot = await getDiagnosticSnapshot(page);
    const variants =
      snapshot.scenes
        .find((scene) => scene.key === 'JustGamesScene')
        ?.objects.filter((object) => object.name.startsWith('just-games-variant:race-course:')) ??
      [];

    expect(variants).toHaveLength(5);
    expect(new Set(variants.map((variant) => `${variant.x}:${variant.y}`)).size).toBe(5);

    const rows = new Map<number, number>();
    for (const variant of variants) {
      rows.set(variant.y, (rows.get(variant.y) ?? 0) + 1);
    }

    expect(rows.size).toBe(3);
    expect(Math.max(...rows.values())).toBeLessThanOrEqual(2);
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

  test('Escape from Just Games returns to the title', async ({ page }) => {
    await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
    await waitForScene(page, 'JustGamesScene');

    await page.keyboard.press('Escape');
    await waitForScene(page, 'TitleScene');
  });
});
