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
    snapshot = await getDiagnosticSnapshot(page);
    const scene = snapshot.scenes.find(({ key }) => key === 'PondLeapActivityScene');
    expect(
      scene?.objects.some(
        ({ text, effectiveVisible }) =>
          effectiveVisible && text?.includes('RIPPLE RUSH OVER') === true,
      ),
    ).toBe(true);
  });

  test('Mode control switches Classic to Practice without leaving Pond Leap', async ({ page }) => {
    await openPondLeap(page);

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:mode');

    const snapshot = await getDiagnosticSnapshot(page);
    expect(snapshot.activeScenes).toContain('PondLeapActivityScene');
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain(
      'Practice Pond · Sunny Steps · Relaxed',
    );
  });
});
