import { expect, test, type Page } from '@playwright/test';

const ACCESSIBILITY_KEY = 'unicorn-valley:accessibility-settings:v1';
const AUDIO_KEY = 'unicorn-valley:audio-settings:v1';

interface DiagnosticObject {
  name: string;
  text: string | null;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface DiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: Array<{
    key: string;
    objects: DiagnosticObject[];
  }>;
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expected) === true;
  }, sceneKey);
}

async function waitForSceneGone(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expected) === false;
  }, sceneKey);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedScene, expectedName }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      return (
        diagnostics
          ?.snapshot()
          .scenes.find(({ key }) => key === expectedScene)
          ?.objects.some(({ name }) => name === expectedName) === true
      );
    },
    { expectedScene: sceneKey, expectedName: objectName },
  );
}

async function tapObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const current = await snapshot(page);
  const target = current.scenes
    .find((scene) => scene.key === sceneKey)
    ?.objects.find(
      (object) => object.name === objectName && object.visible && object.interactive,
    );
  if (!target) {
    throw new Error(`Missing interactive ${sceneKey} object: ${objectName}`);
  }

  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (target.x / current.width) * bounds.width,
    bounds.y + (target.y / current.height) * bounds.height,
  );
}

async function tapTitleText(page: Page, text: string): Promise<void> {
  const current = await snapshot(page);
  const target = current.scenes
    .find((scene) => scene.key === 'TitleScene')
    ?.objects.find((object) => object.visible && object.interactive && object.text === text);
  if (!target) {
    throw new Error(`Missing interactive TitleScene text: ${text}`);
  }

  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (target.x / current.width) * bounds.width,
    bounds.y + (target.y / current.height) * bounds.height,
  );
}

function sceneText(current: DiagnosticSnapshot, sceneKey: string): string[] {
  return (
    current.scenes
      .find((scene) => scene.key === sceneKey)
      ?.objects.filter((object) => object.visible && object.text)
      .map((object) => object.text as string) ?? []
  );
}

test('title settings gain fullscreen and keyboard selection while preferences persist', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'Settings');
  await waitForObject(page, 'TitleScene', 'title-setting-fullscreen');

  let text = sceneText(await snapshot(page), 'TitleScene');
  expect(text.some((value) => value.startsWith('Fullscreen: '))).toBe(true);

  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => sceneText(await snapshot(page), 'TitleScene'))
    .toContain('Reduced motion: On');

  const storedAccessibility = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    ACCESSIBILITY_KEY,
  );
  expect(JSON.parse(storedAccessibility ?? '{}')).toMatchObject({ reducedMotion: true });

  await page.keyboard.press('Escape');
  await page.reload();
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'Settings');
  await waitForObject(page, 'TitleScene', 'title-setting-fullscreen');
  text = sceneText(await snapshot(page), 'TitleScene');
  expect(text).toContain('Reduced motion: On');
});

test('exploration can pause into the full settings screen and return with persisted choices', async ({
  page,
}) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');
  await tapObject(page, 'MoonflowerGladeScene', 'exploration-shell-sound-button');
  await tapObject(page, 'MoonflowerGladeScene', 'exploration-shell-settings-button');
  await waitForScene(page, 'SettingsScene');

  let current = await snapshot(page);
  const settings = current.scenes.find((scene) => scene.key === 'SettingsScene');
  expect(settings).toBeTruthy();
  for (const name of [
    'settings-row-muted',
    'settings-row-music',
    'settings-row-ambience',
    'settings-row-sfx',
    'settings-row-reduced-motion',
    'settings-row-high-visibility',
    'settings-row-fullscreen',
    'settings-done',
  ]) {
    const target = settings?.objects.find((object) => object.name === name);
    expect(target?.interactive, `${name} should be interactive`).toBe(true);
    expect(target?.displayHeight ?? 0, `${name} should be child-sized`).toBeGreaterThanOrEqual(64);
  }

  await tapObject(page, 'SettingsScene', 'settings-row-music');
  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');

  await expect
    .poll(async () => sceneText(await snapshot(page), 'SettingsScene'))
    .toContain('High visibility: On');
  expect(sceneText(await snapshot(page), 'SettingsScene')).toContain('Music: Off');

  const [storedAudio, storedAccessibility] = await page.evaluate(
    ([audioKey, accessibilityKey]) => [
      window.localStorage.getItem(audioKey),
      window.localStorage.getItem(accessibilityKey),
    ],
    [AUDIO_KEY, ACCESSIBILITY_KEY],
  );
  expect(JSON.parse(storedAudio ?? '{}')).toMatchObject({ musicEnabled: false });
  expect(JSON.parse(storedAccessibility ?? '{}')).toMatchObject({
    highVisibilityInteractions: true,
  });

  await page.keyboard.press('Escape');
  await waitForSceneGone(page, 'SettingsScene');
  await waitForScene(page, 'MoonflowerGladeScene');

  await page.reload();
  await waitForScene(page, 'MoonflowerGladeScene');
  await tapObject(page, 'MoonflowerGladeScene', 'exploration-shell-sound-button');
  await tapObject(page, 'MoonflowerGladeScene', 'exploration-shell-settings-button');
  await waitForScene(page, 'SettingsScene');
  current = await snapshot(page);
  expect(sceneText(current, 'SettingsScene')).toContain('Music: Off');
  expect(sceneText(current, 'SettingsScene')).toContain('High visibility: On');
});
