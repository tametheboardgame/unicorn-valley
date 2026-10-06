import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  waitForNamedObject,
  waitForScene,
} from '../support/browserDiagnostics';

async function openRainbowDiscFromJustGames(
  page: Page,
  variant: 'match' | 'practice',
): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await waitForScene(page, 'TitleScene');
  await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await waitForScene(page, 'JustGamesScene');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-card:rainbow-disc');
  await clickNamedObject(page, 'JustGamesScene', `just-games-variant:${variant}`);
  await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
  await waitForScene(page, 'RainbowDiscActivityScene');
}

function rainbowDiscObject(
  snapshot: Awaited<ReturnType<typeof getDiagnosticSnapshot>>,
  name: string,
) {
  return snapshot.scenes
    .find((scene) => scene.key === 'RainbowDiscActivityScene')
    ?.objects.find((object) => object.name === name);
}

test.describe('MG-WP6 Rainbow Disc integration', () => {
  test('Just Games Match opens assistance setup and returns to the catalogue', async ({ page }) => {
    await openRainbowDiscFromJustGames(page, 'match');

    await waitForNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:match-assistance-standard',
    );
    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:match-assistance-standard',
    );
    await waitForNamedObject(page, 'RainbowDiscActivityScene', 'rainbow-disc-activity:thrower');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(rainbowDiscObject(snapshot, 'rainbow-disc-activity:scoreline')?.text).toContain(
      'First to 2',
    );

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');
  });

  test('Just Games Practice opens the drill hub and returns to the catalogue', async ({ page }) => {
    await openRainbowDiscFromJustGames(page, 'practice');

    for (const name of [
      'rainbow-disc-activity:practice-target-range',
      'rainbow-disc-activity:practice-passing-drill',
      'rainbow-disc-activity:practice-rainbow-streak',
    ]) {
      await waitForNamedObject(page, 'RainbowDiscActivityScene', name);
    }

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');
  });

  test('Practice assistance visibly changes the timing window without changing drill access', async ({
    page,
  }) => {
    await openRainbowDiscFromJustGames(page, 'practice');

    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-assistance-gentle',
    );

    await expect
      .poll(async () => {
        const snapshot = await getDiagnosticSnapshot(page);
        return rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-difficulty')?.text;
      })
      .toContain('Gentle');

    const gentle = await getDiagnosticSnapshot(page);
    const gentleWidth =
      rainbowDiscObject(gentle, 'rainbow-disc-activity:timing-success-zone')?.displayWidth ?? 0;

    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-assistance-challenge',
    );

    await expect
      .poll(async () => {
        const snapshot = await getDiagnosticSnapshot(page);
        return rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-difficulty')?.text;
      })
      .toContain('Challenge');

    const challenge = await getDiagnosticSnapshot(page);
    const challengeWidth =
      rainbowDiscObject(challenge, 'rainbow-disc-activity:timing-success-zone')?.displayWidth ??
      999;

    expect(challengeWidth).toBeLessThan(gentleWidth);
    await waitForNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-rainbow-streak',
    );
  });

  test('Match setup and Practice hub are keyboard navigable', async ({ page }) => {
    await openRainbowDiscFromJustGames(page, 'match');

    await page.keyboard.press('2');
    await waitForNamedObject(page, 'RainbowDiscActivityScene', 'rainbow-disc-activity:thrower');

    let snapshot = await getDiagnosticSnapshot(page);
    expect(rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-difficulty')?.text).toContain(
      'Standard',
    );

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:rainbow-disc');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:practice');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForScene(page, 'RainbowDiscActivityScene');

    await page.keyboard.press('3');
    await waitForNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-targets',
    );

    snapshot = await getDiagnosticSnapshot(page);
    const scene = snapshot.scenes.find(({ key }) => key === 'RainbowDiscActivityScene');
    expect(
      scene?.objects.some(
        ({ text, effectiveVisible }) => effectiveVisible && text?.startsWith('★ ') === true,
      ),
    ).toBe(true);
  });

  test('keeps the 16:9 activity canvas contained in a portrait tablet viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await openRainbowDiscFromJustGames(page, 'practice');

    await waitForNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-menu-title',
    );

    const box = await page.locator('canvas').boundingBox();
    expect(box).not.toBeNull();
    if (!box) throw new Error('Game canvas is unavailable.');

    expect(box.width).toBeLessThanOrEqual(768);
    expect(box.height).toBeLessThanOrEqual(1024);
    expect(box.width / box.height).toBeCloseTo(16 / 9, 1);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
