import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  primePondLeapMissTiming,
  primePondLeapTiming,
  startScene,
  waitForNamedObject,
} from '../support/browserDiagnostics';

function pondObject(snapshot: Awaited<ReturnType<typeof getDiagnosticSnapshot>>, name: string) {
  return snapshot.scenes
    .find((scene) => scene.key === 'PondLeapActivityScene')
    ?.objects.find((object) => object.name === name);
}

async function openPondLeap(page: Page, data?: object): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await startScene(page, 'PondLeapActivityScene', data);
  await waitForNamedObject(page, 'PondLeapActivityScene', 'pond-leap:leap');
}

async function openPondLeapFromJustGames(
  page: Page,
  variant: 'classic' | 'practice' | 'ripple-rush',
): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await waitForNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await clickNamedObject(page, 'TitleScene', 'title-menu-just-games');
  await waitForNamedObject(page, 'JustGamesScene', 'just-games-card:pond-leap');
  await clickNamedObject(page, 'JustGamesScene', 'just-games-card:pond-leap');
  await clickNamedObject(page, 'JustGamesScene', `just-games-variant:${variant}`);
  await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
  await waitForNamedObject(page, 'PondLeapActivityScene', 'pond-leap:leap');
}

test.describe('MG-WP7 Pond Leap', () => {
  test('defaults to Sunny Steps Standard and cycles course without leaving the scene', async ({
    page,
  }) => {
    await openPondLeap(page);

    let snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Classic Crossing · Sunny Steps · Standard',
    );
    expect(pondObject(snapshot, 'pond-leap:course-route:sunny-steps')?.effectiveVisible).toBe(true);
    expect(pondObject(snapshot, 'pond-leap:next-pad')?.effectiveVisible).toBe(true);

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:course');

    snapshot = await getDiagnosticSnapshot(page);
    expect(snapshot.activeScenes).toContain('PondLeapActivityScene');
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Classic Crossing · Reed Weave · Standard',
    );
    expect(pondObject(snapshot, 'pond-leap:course-route:reed-weave')?.effectiveVisible).toBe(true);
    expect(pondObject(snapshot, 'pond-leap:course-accent:reeds')?.effectiveVisible).toBe(true);
    expect(pondObject(snapshot, 'pond-leap:frog')?.x).toBe(190);
    expect(pondObject(snapshot, 'pond-leap:frog')?.y).toBe(338);
  });

  test('cycles help through visible timing profiles', async ({ page }) => {
    await openPondLeap(page);

    let snapshot = await getDiagnosticSnapshot(page);
    const standardWidth = pondObject(snapshot, 'pond-leap:timing-zone')?.displayWidth ?? 0;
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain('Standard');

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:help');

    snapshot = await getDiagnosticSnapshot(page);
    const quickWidth = pondObject(snapshot, 'pond-leap:timing-zone')?.displayWidth ?? 0;
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain('Quick');
    expect(quickWidth).toBeLessThan(standardWidth);

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:help');

    snapshot = await getDiagnosticSnapshot(page);
    const relaxedWidth = pondObject(snapshot, 'pond-leap:timing-zone')?.displayWidth ?? 0;
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain('Relaxed');
    expect(relaxedWidth).toBeGreaterThan(standardWidth);
  });

  test('Practice Pond runs safe attempts and tracks a visible streak', async ({ page }) => {
    await openPondLeap(page, { mode: 'practice' });

    let snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Practice Pond · Sunny Steps · Relaxed · Attempt 1/10',
    );

    await primePondLeapTiming(page);
    await page.keyboard.press('Space');

    await expect
      .poll(async () => {
        const current = await getDiagnosticSnapshot(page);
        return pondObject(current, 'pond-leap:progress')?.text ?? '';
      })
      .toContain('Attempt 2/10 · Streak 1 · Best 1');

    snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:instructions')?.text).toContain('Practice 10 leaps');
  });

  test('Ripple Rush uses Quick timing and ends on the third splash', async ({ page }) => {
    await openPondLeap(page, { mode: 'ripple-rush' });

    let snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Ripple Rush · Sunny Steps · Quick · Hops 0/8 · Splashes 0/3',
    );

    for (let splash = 1; splash <= 3; splash += 1) {
      await primePondLeapMissTiming(page);
      await page.keyboard.press('Space');

      if (splash < 3) {
        await expect
          .poll(async () => {
            const current = await getDiagnosticSnapshot(page);
            return pondObject(current, 'pond-leap:progress')?.text ?? '';
          })
          .toContain(`Splashes ${splash}/3`);
      }
    }

    await waitForNamedObject(page, 'PondLeapActivityScene', 'pond-leap:completion');
    for (const name of ['play-again', 'change-course', 'result-modes', 'back-to-meadow']) {
      await waitForNamedObject(page, 'PondLeapActivityScene', `pond-leap:${name}`);
    }

    snapshot = await getDiagnosticSnapshot(page);
    const scene = snapshot.scenes.find(({ key }) => key === 'PondLeapActivityScene');
    expect(
      scene?.objects.some(
        ({ text, effectiveVisible }) =>
          effectiveVisible && text?.includes('RIPPLE RUSH OVER') === true,
      ),
    ).toBe(true);
  });

  test('Modes opens in-scene and switches Classic to Practice without leaving Pond Leap', async ({
    page,
  }) => {
    await openPondLeap(page);

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:mode');
    await waitForNamedObject(page, 'PondLeapActivityScene', 'pond-leap:mode-menu-title');
    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:mode-practice');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(snapshot.activeScenes).toContain('PondLeapActivityScene');
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Practice Pond · Sunny Steps · Relaxed',
    );
    expect(pondObject(snapshot, 'pond-leap:mode-menu')?.effectiveVisible ?? false).toBe(false);
  });

  test('touch and keyboard use the same successful leap path', async ({ page }) => {
    await openPondLeap(page);

    await primePondLeapTiming(page);
    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:leap');

    await expect
      .poll(async () => {
        const current = await getDiagnosticSnapshot(page);
        return pondObject(current, 'pond-leap:frog')?.x ?? 0;
      })
      .toBe(360);

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:restart');
    await primePondLeapTiming(page);
    await page.keyboard.press('Enter');

    await expect
      .poll(async () => {
        const current = await getDiagnosticSnapshot(page);
        return pondObject(current, 'pond-leap:frog')?.x ?? 0;
      })
      .toBe(360);
  });

  test('a splash keeps the frog on the same pad and quickly unlocks a retry', async ({ page }) => {
    await openPondLeap(page);

    await primePondLeapMissTiming(page);
    await page.keyboard.press('Space');

    let snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:frog')?.x).toBe(190);

    await expect
      .poll(
        async () => {
          try {
            await primePondLeapTiming(page);
            return true;
          } catch {
            return false;
          }
        },
        { timeout: 6_000 },
      )
      .toBe(true);
    await page.keyboard.press('Space');

    await expect
      .poll(async () => {
        const current = await getDiagnosticSnapshot(page);
        return pondObject(current, 'pond-leap:frog')?.x ?? 0;
      })
      .toBe(360);

    snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain('Pad 2/5');
  });

  test('primary controls keep child-sized touch targets', async ({ page }) => {
    await openPondLeap(page);

    const snapshot = await getDiagnosticSnapshot(page);
    for (const name of ['leap', 'restart', 'course', 'mode', 'help', 'back']) {
      const control = pondObject(snapshot, `pond-leap:${name}`);
      expect(control?.displayHeight ?? 0).toBeGreaterThanOrEqual(48);
      expect(control?.displayWidth ?? 0).toBeGreaterThanOrEqual(48);
    }

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:mode');
    const menu = await getDiagnosticSnapshot(page);
    for (const name of ['mode-classic', 'mode-practice', 'mode-ripple-rush', 'mode-menu-close']) {
      expect(pondObject(menu, `pond-leap:${name}`)?.displayHeight ?? 0).toBeGreaterThanOrEqual(48);
    }
  });

  test('keeps the 16:9 activity canvas contained in a portrait tablet viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await openPondLeap(page, { mode: 'practice' });

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

    const snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:timing-zone')?.effectiveVisible).toBe(true);
    expect(pondObject(snapshot, 'pond-leap:leap')?.effectiveVisible).toBe(true);
  });

  test('Just Games launches each Pond Leap mode through the canonical scene', async ({ page }) => {
    await openPondLeapFromJustGames(page, 'ripple-rush');

    let snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Ripple Rush · Sunny Steps · Quick',
    );

    await page.keyboard.press('Escape');
    await waitForNamedObject(page, 'JustGamesScene', 'just-games-card:pond-leap');

    await clickNamedObject(page, 'JustGamesScene', 'just-games-card:pond-leap');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-variant:practice');
    await clickNamedObject(page, 'JustGamesScene', 'just-games-play');
    await waitForNamedObject(page, 'PondLeapActivityScene', 'pond-leap:leap');

    snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Practice Pond · Sunny Steps · Relaxed',
    );
  });
});
