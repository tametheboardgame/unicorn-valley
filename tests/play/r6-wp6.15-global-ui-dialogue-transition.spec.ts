import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  textureKey: string | null;
  alpha: number;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
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
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
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

function namedObject(scene: DiagnosticScene, name: string): DiagnosticObject {
  const object = scene.objects.find((candidate) => candidate.name === name);
  if (!object) {
    throw new Error(`Missing diagnostic object: ${name}`);
  }
  return object;
}

test('core story dialogue uses the canonical production portrait and explicit advance guidance', async ({
  page,
}) => {
  await page.goto('/?scene=lumi-story&diagnostics=1');
  await waitForScene(page, 'LumiStoryScene');
  await waitForObject(page, 'LumiStoryScene', 'dialogue-production-portrait-lumi');

  const scene = (await snapshot(page)).scenes.find(({ key }) => key === 'LumiStoryScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }

  const portrait = namedObject(scene, 'dialogue-production-portrait-lumi');
  expect(portrait.visible).toBe(true);
  expect(portrait.textureKey).toBe('core-npc-production:lumi:happy');
  expect(namedObject(scene, 'dialogue-production-portrait-fallback').visible).toBe(false);
  expect(namedObject(scene, 'dialogue-production-mode-hint').visible).toBe(true);
  expect(namedObject(scene, 'dialogue-production-advance-indicator').visible).toBe(true);
  expect(namedObject(scene, 'dialogue-production-continue').interactive).toBe(true);

  await page.screenshot({ path: 'playtest-artifacts/screenshots/wp6.15-lumi-dialogue.png' });
});

test('non-core speakers retain a readable portrait fallback', async ({ page }) => {
  await page.goto('/?scene=ripple-story&diagnostics=1');
  await waitForScene(page, 'RippleStoryScene');
  await waitForObject(page, 'RippleStoryScene', 'dialogue-production-portrait-fallback');

  const scene = (await snapshot(page)).scenes.find(({ key }) => key === 'RippleStoryScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }

  expect(namedObject(scene, 'dialogue-production-portrait-fallback').visible).toBe(true);
  expect(scene.objects.some(({ name }) => name.startsWith('dialogue-production-portrait-ripple'))).toBe(
    false,
  );
});

test('Reduced Motion leaves production UI decoration static', async ({ page }) => {
  await page.goto('/?scene=inventory&diagnostics=1');
  await page.evaluate(() => {
    localStorage.setItem(
      'unicorn-valley:accessibility-settings:v1',
      JSON.stringify({ reducedMotion: true, highVisibilityInteractions: false }),
    );
  });
  await page.reload();
  await waitForScene(page, 'InventoryScene');
  await waitForObject(page, 'InventoryScene', 'ui-production:InventoryScene:sparkle');

  const firstScene = (await snapshot(page)).scenes.find(({ key }) => key === 'InventoryScene');
  expect(firstScene).toBeTruthy();
  if (!firstScene) {
    return;
  }
  const firstAlpha = namedObject(firstScene, 'ui-production:InventoryScene:sparkle').alpha;

  await page.waitForTimeout(800);

  const secondScene = (await snapshot(page)).scenes.find(({ key }) => key === 'InventoryScene');
  expect(secondScene).toBeTruthy();
  if (!secondScene) {
    return;
  }
  const secondAlpha = namedObject(secondScene, 'ui-production:InventoryScene:sparkle').alpha;

  expect(firstAlpha).toBeCloseTo(0.78, 4);
  expect(secondAlpha).toBeCloseTo(firstAlpha, 4);
});
