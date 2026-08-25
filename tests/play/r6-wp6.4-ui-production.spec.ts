import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  textureKey: string | null;
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

test('production storybook shell is present on the core modal UI scenes', async ({ page }) => {
  for (const [route, sceneKey] of [
    ['inventory', 'InventoryScene'],
    ['shop', 'ShopScene'],
    ['wonderbook', 'WonderbookScene'],
  ] as const) {
    await page.goto(`/?scene=${route}&diagnostics=1`);
    await waitForScene(page, sceneKey);
    await waitForObject(page, sceneKey, `ui-production:${sceneKey}:anchor`);
    const scene = (await snapshot(page)).scenes.find(({ key }) => key === sceneKey);
    expect(scene).toBeTruthy();
    expect(scene?.objects.some(({ name }) => name === `ui-production:${sceneKey}:ornaments`)).toBe(
      true,
    );
    await page.screenshot({ path: `playtest-artifacts/screenshots/wp6.4-${route}.png` });
  }
});

test('Wonderbook production tabs remain large interactive navigation controls', async ({
  page,
}) => {
  await page.goto('/?scene=wonderbook&diagnostics=1');
  await waitForScene(page, 'WonderbookScene');
  await waitForObject(page, 'WonderbookScene', 'wonderbook-tab-secrets');

  let scene = (await snapshot(page)).scenes.find(({ key }) => key === 'WonderbookScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }

  const allTab = namedObject(scene, 'wonderbook-tab-all');
  const secretsTab = namedObject(scene, 'wonderbook-tab-secrets');
  expect(allTab.interactive).toBe(true);
  expect(secretsTab.interactive).toBe(true);
  expect(Math.abs(secretsTab.x - allTab.x)).toBeGreaterThan(150);

  await page.mouse.click(secretsTab.x, secretsTab.y);
  await page.waitForTimeout(300);
  scene = (await snapshot(page)).scenes.find(({ key }) => key === 'WonderbookScene');
  expect(scene).toBeTruthy();
  expect(scene?.objects.some(({ name }) => name === 'wonderbook-page-content')).toBe(true);
});

test('dialogue and sound settings expose explicit production interaction states', async ({
  page,
}) => {
  await page.goto('/?scene=lumi-story&diagnostics=1');
  await waitForScene(page, 'LumiStoryScene');
  await waitForObject(page, 'LumiStoryScene', 'dialogue-production-panel');
  let scene = (await snapshot(page)).scenes.find(({ key }) => key === 'LumiStoryScene');
  expect(scene).toBeTruthy();
  if (scene) {
    expect(namedObject(scene, 'dialogue-production-continue').interactive).toBe(true);
  }

  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');
  await waitForObject(page, 'MoonflowerGladeScene', 'audio-setting-muted');
  scene = (await snapshot(page)).scenes.find(({ key }) => key === 'MoonflowerGladeScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }

  for (const name of [
    'audio-setting-muted',
    'audio-setting-music',
    'audio-setting-ambience',
    'audio-setting-sfx',
  ]) {
    expect(namedObject(scene, name).interactive).toBe(true);
  }
});
