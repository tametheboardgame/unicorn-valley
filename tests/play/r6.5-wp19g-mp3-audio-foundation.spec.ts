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

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
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
  if (!button) throw new Error('Missing Settings navigation button.');
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
  if (!object) throw new Error(`Missing ${name}.`);
  return object;
}

test.describe('R6.5-WP19G MP3 audio foundation', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('serves authored MP3s and exposes persistent music mode and slider controls', async ({
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
    await waitForDiagnostics(page);
    await openSettings(page);

    let settings = await sceneSnapshot(page, 'SettingsScene');
    expect(findObject(settings, 'settings-section-sound').text).toBe('Sound');
    expect(findObject(settings, 'settings-section-music').text).toBe('Music');
    expect(findObject(settings, 'settings-section-sound-effects').text).toBe('Sound effects');
    expect(findObject(settings, 'settings-row-music-label').text).toContain('Scene music');

    const master = page.locator('input[aria-label="All sound"]');
    await expect(master).toBeVisible();
    await master.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '0.7';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
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
    expect(findObject(settings, 'settings-row-music-track-label').text).toContain(
      'follows each area',
    );

    const mode = findObject(settings, 'settings-row-music');
    await page.mouse.click(mode.x, mode.y);
    await expect(page.locator('select[aria-label="Chosen music track"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Music volume"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Ambience volume"]')).toBeVisible();

    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(150);
    await expect(page.locator('input[aria-label="Effects volume"]')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
