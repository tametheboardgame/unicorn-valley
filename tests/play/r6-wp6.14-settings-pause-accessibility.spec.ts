import { expect, type Page, test } from '@playwright/test';

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
          ?.objects.some(
            ({ name, visible, interactive }) => name === expectedName && visible && interactive,
          ) === true
      );
    },
    { expectedScene: sceneKey, expectedName: objectName },
  );
}

async function moveSelectionUntilVisible(
  page: Page,
  sceneKey: string,
  objectName: string,
  maxSteps = 16,
): Promise<void> {
  for (let step = 0; step <= maxSteps; step += 1) {
    const current = await snapshot(page);
    const object = current.scenes
      .find((scene) => scene.key === sceneKey)
      ?.objects.find((candidate) => candidate.name === objectName);
    if (object?.visible && object.interactive) {
      return;
    }
    await page.keyboard.press('ArrowDown');
  }
  throw new Error(`${objectName} did not become visible and interactive.`);
}

async function tapObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  const current = await snapshot(page);
  const target = current.scenes
    .find((scene) => scene.key === sceneKey)
    ?.objects.find((object) => object.name === objectName && object.visible && object.interactive);
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

test('title launches canonical settings with fullscreen and persistent accessibility choices', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'Settings');
  await waitForScene(page, 'SettingsScene');
  await waitForObject(page, 'SettingsScene', 'settings-row-fullscreen');

  let current = await snapshot(page);
  expect(current.activeScenes).not.toContain('TitleScene');
  expect(
    current.scenes
      .find((scene) => scene.key === 'TitleScene')
      ?.objects.some((object) => object.name === 'title-setting-fullscreen') ?? false,
  ).toBe(false);

  await moveSelectionUntilVisible(page, 'SettingsScene', 'settings-row-reduced-motion');
  await tapObject(page, 'SettingsScene', 'settings-row-reduced-motion');
  await expect
    .poll(async () => sceneText(await snapshot(page), 'SettingsScene'))
    .toContain('Reduced motion: On');

  const storedAccessibility = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    ACCESSIBILITY_KEY,
  );
  expect(JSON.parse(storedAccessibility ?? '{}')).toMatchObject({ reducedMotion: true });

  await moveSelectionUntilVisible(page, 'SettingsScene', 'settings-row-fullscreen');
  current = await snapshot(page);
  expect(
    sceneText(current, 'SettingsScene').some((value) => value.startsWith('Fullscreen: ')),
  ).toBe(true);

  await page.keyboard.press('Escape');
  await waitForScene(page, 'TitleScene');
  await page.reload();
  await waitForScene(page, 'TitleScene');
  await tapTitleText(page, 'Settings');
  await waitForScene(page, 'SettingsScene');
  await moveSelectionUntilVisible(page, 'SettingsScene', 'settings-row-reduced-motion');
  expect(sceneText(await snapshot(page), 'SettingsScene')).toContain('Reduced motion: On');
});

test('exploration can pause into the full settings screen and return with persisted choices', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');
  await waitForObject(
    page,
    'ExplorationHudOverlayScene',
    'exploration-hud-overlay-settings-nav-button',
  );
  await tapObject(
    page,
    'ExplorationHudOverlayScene',
    'exploration-hud-overlay-settings-nav-button',
  );
  await waitForScene(page, 'SettingsScene');

  let current = await snapshot(page);
  const settings = current.scenes.find((scene) => scene.key === 'SettingsScene');
  expect(settings).toBeTruthy();
  for (const name of ['settings-row-muted', 'settings-row-music', 'settings-done']) {
    const target = settings?.objects.find((object) => object.name === name);
    expect(target?.interactive, `${name} should be interactive`).toBe(true);
    expect(target?.displayHeight ?? 0, `${name} should be child-sized`).toBeGreaterThanOrEqual(64);
  }

  await tapObject(page, 'SettingsScene', 'settings-row-music');

  // WP19H replaced the old canvas music-track row with the conditional DOM
  // picker, so there is one fewer canvas focus step before Accessibility.
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('ArrowDown');
  }
  current = await snapshot(page);
  let scrolledSettings = current.scenes.find((scene) => scene.key === 'SettingsScene');
  const reducedMotion = scrolledSettings?.objects.find(
    (object) => object.name === 'settings-row-reduced-motion',
  );
  expect(reducedMotion?.visible).toBe(true);
  expect(reducedMotion?.interactive).toBe(true);
  expect(reducedMotion?.displayHeight ?? 0).toBeGreaterThanOrEqual(64);

  await page.keyboard.press('ArrowDown');
  current = await snapshot(page);
  scrolledSettings = current.scenes.find((scene) => scene.key === 'SettingsScene');
  const highVisibility = scrolledSettings?.objects.find(
    (object) => object.name === 'settings-row-high-visibility',
  );
  expect(highVisibility?.visible).toBe(true);
  expect(highVisibility?.interactive).toBe(true);
  expect(highVisibility?.displayHeight ?? 0).toBeGreaterThanOrEqual(64);

  await page.keyboard.press('Enter');

  await expect
    .poll(async () => sceneText(await snapshot(page), 'SettingsScene'))
    .toContain('High visibility: On');

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
  await waitForObject(
    page,
    'ExplorationHudOverlayScene',
    'exploration-hud-overlay-settings-nav-button',
  );
  await tapObject(
    page,
    'ExplorationHudOverlayScene',
    'exploration-hud-overlay-settings-nav-button',
  );
  await waitForScene(page, 'SettingsScene');

  // Music is visible at the top on reopen; prove that persistence before
  // scrolling to the separately persisted accessibility row.
  current = await snapshot(page);
  expect(sceneText(current, 'SettingsScene')).toContain('Music: Chosen track');
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('ArrowDown');
  }
  current = await snapshot(page);
  expect(sceneText(current, 'SettingsScene')).toContain('High visibility: On');
});
