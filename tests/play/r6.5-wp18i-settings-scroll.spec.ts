import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  text: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function startSettings(page: Page): Promise<void> {
  await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    diagnostics.startScene('SettingsScene');
  });
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes('SettingsScene') === true;
  });
  await page.waitForTimeout(300);
}

async function getSettings(page: Page): Promise<DiagnosticSceneSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics
      ?.snapshot()
      .scenes.find((candidate) => candidate.key === 'SettingsScene');
    if (!scene) {
      throw new Error('Missing SettingsScene.');
    }
    return scene;
  });
}

function objectByName(scene: DiagnosticSceneSnapshot, name: string): DiagnosticObjectSnapshot {
  const object = scene.objects.find((candidate) => candidate.name === name);
  if (!object) {
    throw new Error(`Missing ${name}.`);
  }
  return object;
}

function assertVisibleRowsStayInViewport(scene: DiagnosticSceneSnapshot): void {
  const visibleLabels = scene.objects.filter(
    ({ name, visible }) => name.startsWith('settings-row-') && name.endsWith('-label') && visible,
  );
  expect(visibleLabels.length).toBeGreaterThan(0);
  for (const label of visibleLabels) {
    expect(label.y, `${label.name} above viewport`).toBeGreaterThanOrEqual(145);
    expect(label.y, `${label.name} below viewport`).toBeLessThanOrEqual(565);
  }
}

test.describe('R6.5-WP18I sectioned scrollable Settings', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: true });

  test('groups settings, clips the scroll viewport and keeps Done fixed', async ({ page }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startSettings(page);

    const before = await getSettings(page);
    const mutedBefore = objectByName(before, 'settings-row-muted-label');
    const musicBefore = objectByName(before, 'settings-row-music-label');
    const timeBefore = objectByName(before, 'settings-row-time-of-day-label');
    const thumbBefore = objectByName(before, 'settings-scrollbar-thumb');
    const doneBefore = objectByName(before, 'settings-done-label');

    expect(objectByName(before, 'settings-section-sound').text).toBe('Sound');
    expect(objectByName(before, 'settings-section-accessibility').text).toBe('Accessibility');
    expect(objectByName(before, 'settings-section-display-world').text).toBe('Display & World');
    expect(objectByName(before, 'settings-viewport-top-guard').visible).toBe(true);
    expect(objectByName(before, 'settings-viewport-bottom-guard').visible).toBe(true);
    expect(musicBefore.y - mutedBefore.y).toBeGreaterThanOrEqual(68);
    expect(timeBefore.y).toBeGreaterThan(590);
    expect(objectByName(before, 'settings-row-weather-label').text).toContain('Weather:');
    expect(timeBefore.text).toContain('Time of day:');
    expect(objectByName(before, 'settings-scrollbar-track').visible).toBe(true);
    expect(thumbBefore.visible).toBe(true);
    assertVisibleRowsStayInViewport(before);

    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(180);

    const afterWheel = await getSettings(page);
    const mutedAfterWheel = objectByName(afterWheel, 'settings-row-muted-label');
    const timeAfterWheel = objectByName(afterWheel, 'settings-row-time-of-day-label');
    const thumbAfterWheel = objectByName(afterWheel, 'settings-scrollbar-thumb');
    const doneAfterWheel = objectByName(afterWheel, 'settings-done-label');

    expect(mutedAfterWheel.y).toBeLessThan(mutedBefore.y);
    expect(timeAfterWheel.y).toBeLessThan(timeBefore.y);
    expect(timeAfterWheel.y).toBeLessThanOrEqual(565);
    expect(thumbAfterWheel.y).toBeGreaterThan(thumbBefore.y);
    expect(doneAfterWheel.y).toBe(doneBefore.y);
    assertVisibleRowsStayInViewport(afterWheel);

    const timeAfterWheelY = timeAfterWheel.y;
    await page.mouse.move(640, 430);
    await page.mouse.down();
    await page.mouse.move(640, 300, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(120);

    const afterDrag = await getSettings(page);
    expect(objectByName(afterDrag, 'settings-row-time-of-day-label').y).toBeLessThanOrEqual(
      timeAfterWheelY,
    );
    expect(objectByName(afterDrag, 'settings-done-label').y).toBe(doneBefore.y);
    assertVisibleRowsStayInViewport(afterDrag);
  });
});
