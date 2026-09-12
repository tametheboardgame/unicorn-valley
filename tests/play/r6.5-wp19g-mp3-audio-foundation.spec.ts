import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  text: string | null;
  x: number;
  y: number;
  visible: boolean;
  interactive: boolean;
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

const AUDIO_STORAGE_KEY = 'unicorn-valley:audio-settings:v1';

async function diagnostics(page: Page): Promise<BrowserDiagnosticsApi> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
  return page.evaluate(() => {
    const value = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!value) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return value;
  });
}

async function sceneSnapshot(page: Page, sceneKey: string): Promise<DiagnosticSceneSnapshot> {
  return page.evaluate((key) => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find(({ key: candidate }) => candidate === key);
    if (!scene) {
      throw new Error(`Missing ${key}.`);
    }
    return scene;
  }, sceneKey);
}

async function openSettings(page: Page): Promise<void> {
  await page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    api?.startScene('MoonflowerGladeScene');
  });
  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('MoonflowerGladeScene') === true;
  });
  const scene = await sceneSnapshot(page, 'MoonflowerGladeScene');
  const button = scene.objects.find(
    ({ name, visible, interactive }) =>
      name === 'exploration-shell-settings-nav-button' && visible && interactive,
  );
  if (!button) {
    throw new Error('Missing Settings navigation button.');
  }
  await page.mouse.click(button.x, button.y);
  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('SettingsScene') === true;
  });
}

function findObject(scene: DiagnosticSceneSnapshot, name: string): DiagnosticObjectSnapshot {
  const object = scene.objects.find((candidate) => candidate.name === name);
  if (!object) {
    throw new Error(`Missing ${name}.`);
  }
  return object;
}

test.describe('R6.5-WP19G MP3 audio foundation', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('serves the authored MP3 fixture and exposes persistent channel controls', async ({
    page,
    request,
  }) => {
    test.setTimeout(75_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const mp3 = await request.get('/audio/sfx/ui-soft-chime.mp3');
    expect(mp3.ok()).toBe(true);
    expect((await mp3.body()).byteLength).toBeGreaterThan(1000);

    await page.goto('/?diagnostics=1');
    await diagnostics(page);
    await openSettings(page);

    let settings = await sceneSnapshot(page, 'SettingsScene');
    expect(findObject(settings, 'settings-section-sound').text).toBe('Sound');
    expect(findObject(settings, 'settings-section-music').text).toBe('Music');
    expect(findObject(settings, 'settings-section-sound-effects').text).toBe('Sound effects');
    expect(findObject(settings, 'settings-row-master-volume-label').text).toContain('62%');

    const master = findObject(settings, 'settings-row-master-volume');
    expect(master.visible && master.interactive).toBe(true);
    await page.mouse.click(master.x, master.y);
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const raw = localStorage.getItem(key);
          return raw ? (JSON.parse(raw) as { masterVolume?: number }).masterVolume : null;
        }, AUDIO_STORAGE_KEY),
      )
      .toBe(0.7);

    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 550);
    await page.waitForTimeout(150);
    settings = await sceneSnapshot(page, 'SettingsScene');

    expect(findObject(settings, 'settings-row-music-track-label').text).toContain('Scene theme');
    expect(findObject(settings, 'settings-row-music-track-label').text).toContain('add MP3s');
    expect(findObject(settings, 'settings-row-music-volume-label').text).toContain('Music level:');
    expect(findObject(settings, 'settings-row-ambience-volume-label').text).toContain(
      'Ambience level:',
    );

    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(150);
    settings = await sceneSnapshot(page, 'SettingsScene');
    expect(findObject(settings, 'settings-row-sfx-label').text).toContain('Effects:');
    expect(findObject(settings, 'settings-row-sfx-volume-label').text).toContain('Effects level:');
    expect(errors).toEqual([]);
  });
});
