import { expect, test, type Page } from '@playwright/test';
import {
  clickNamedObject,
  getDiagnosticSnapshot,
  openDiagnostics,
  startScene,
  waitForNamedObject,
} from '../support/browserDiagnostics';

function pondObject(
  snapshot: Awaited<ReturnType<typeof getDiagnosticSnapshot>>,
  name: string,
) {
  return snapshot.scenes
    .find((scene) => scene.key === 'PondLeapActivityScene')
    ?.objects.find((object) => object.name === name);
}

async function openPondLeap(page: Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await openDiagnostics(page);
  await startScene(page, 'PondLeapActivityScene');
  await waitForNamedObject(page, 'PondLeapActivityScene', 'pond-leap:leap');
}

test.describe('MG-WP7 Pond Leap Classic Crossing', () => {
  test('defaults to Sunny Steps Standard and cycles course without leaving the scene', async ({
    page,
  }) => {
    await openPondLeap(page);

    let snapshot = await getDiagnosticSnapshot(page);
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain('Sunny Steps · Standard');
    expect(pondObject(snapshot, 'pond-leap:course-route:sunny-steps')?.effectiveVisible).toBe(true);
    expect(pondObject(snapshot, 'pond-leap:next-pad')?.effectiveVisible).toBe(true);

    await clickNamedObject(page, 'PondLeapActivityScene', 'pond-leap:course');

    snapshot = await getDiagnosticSnapshot(page);
    expect(snapshot.activeScenes).toContain('PondLeapActivityScene');
    expect(pondObject(snapshot, 'pond-leap:progress')?.text).toContain('Reed Weave · Standard');
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
});
