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

async function waitForGoodTiming(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const snapshot = await getDiagnosticSnapshot(page);
      const marker = rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-marker');
      const zone = rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-success-zone');
      if (!marker?.effectiveVisible || !zone?.effectiveVisible) return false;
      const left = zone.x - zone.displayWidth / 2;
      const right = zone.x + zone.displayWidth / 2;
      return marker.x >= left && marker.x <= right;
    })
    .toBe(true);
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

  test('Practice assistance changes the active throw window without animating on the hub', async ({
    page,
  }) => {
    await openRainbowDiscFromJustGames(page, 'practice');

    let snapshot = await getDiagnosticSnapshot(page);
    expect(
      rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-marker')?.effectiveVisible,
    ).toBe(false);
    expect(
      rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-success-zone')?.effectiveVisible,
    ).toBe(false);

    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-assistance-gentle',
    );
    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-target-range',
    );

    snapshot = await getDiagnosticSnapshot(page);
    expect(rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-difficulty')?.text).toContain(
      'Gentle',
    );
    const gentleWidth =
      rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-success-zone')?.displayWidth ?? 0;

    await page.keyboard.press('Escape');
    await waitForScene(page, 'JustGamesScene');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:rainbow-disc');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:practice');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForScene(page, 'RainbowDiscActivityScene');

    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-assistance-challenge',
    );
    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:practice-target-range',
    );

    snapshot = await getDiagnosticSnapshot(page);
    expect(rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-difficulty')?.text).toContain(
      'Challenge',
    );
    const challengeWidth =
      rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-success-zone')?.displayWidth ??
      999;

    expect(challengeWidth).toBeLessThan(gentleWidth);
  });

  test('timing waits for play and shifts position and width between throws', async ({ page }) => {
    await openRainbowDiscFromJustGames(page, 'match');

    let snapshot = await getDiagnosticSnapshot(page);
    expect(
      rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-marker')?.effectiveVisible,
    ).toBe(false);
    expect(
      rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-success-zone')?.effectiveVisible,
    ).toBe(false);

    await clickNamedObject(
      page,
      'RainbowDiscActivityScene',
      'rainbow-disc-activity:match-assistance-standard',
    );
    await waitForNamedObject(page, 'RainbowDiscActivityScene', 'rainbow-disc-activity:thrower');

    snapshot = await getDiagnosticSnapshot(page);
    const firstZone = rainbowDiscObject(snapshot, 'rainbow-disc-activity:timing-success-zone');
    expect(firstZone?.effectiveVisible).toBe(true);
    if (!firstZone) throw new Error('First timing window is unavailable.');

    await waitForGoodTiming(page);
    await page.keyboard.press('Space');

    await expect
      .poll(async () => {
        const next = await getDiagnosticSnapshot(page);
        const zone = rainbowDiscObject(next, 'rainbow-disc-activity:timing-success-zone');
        if (!zone?.effectiveVisible) return false;
        return (
          Math.abs(zone.x - firstZone.x) > 1 ||
          Math.abs(zone.displayWidth - firstZone.displayWidth) > 1
        );
      })
      .toBe(true);
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
