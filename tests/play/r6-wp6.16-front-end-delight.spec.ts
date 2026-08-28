import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  alpha: number;
  visible: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
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

test('creator receives authored delight layers without obscuring the existing interface', async ({
  page,
}) => {
  await page.goto('/?scene=creator&diagnostics=1');
  await waitForObject(page, 'UnicornCreatorScene', 'creator-delight:preview-halo');

  const scene = (await snapshot(page)).scenes.find(({ key }) => key === 'UnicornCreatorScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }

  expect(namedObject(scene, 'creator-delight:preview-halo').visible).toBe(true);
  expect(namedObject(scene, 'creator-delight:background-ribbon').visible).toBe(true);
  expect(scene.objects.filter(({ name }) => name.startsWith('creator-delight:mote-'))).toHaveLength(
    5,
  );
  expect(namedObject(scene, 'creator-action-confirm-new').visible).toBe(true);

  await page.screenshot({ path: 'playtest-artifacts/screenshots/wp6.16-creator-delight.png' });
});

test('creator delight layers stay static when Reduced Motion is enabled', async ({ page }) => {
  await page.goto('/?scene=creator&diagnostics=1');
  await page.evaluate(() => {
    localStorage.setItem(
      'unicorn-valley:accessibility-settings:v1',
      JSON.stringify({ reducedMotion: true, highVisibilityInteractions: false }),
    );
  });
  await page.reload();
  await waitForObject(page, 'UnicornCreatorScene', 'creator-delight:mote-0');

  const firstScene = (await snapshot(page)).scenes.find(({ key }) => key === 'UnicornCreatorScene');
  expect(firstScene).toBeTruthy();
  if (!firstScene) {
    return;
  }
  const firstMote = namedObject(firstScene, 'creator-delight:mote-0');
  const firstHalo = namedObject(firstScene, 'creator-delight:preview-halo');

  await page.waitForTimeout(900);

  const secondScene = (await snapshot(page)).scenes.find(
    ({ key }) => key === 'UnicornCreatorScene',
  );
  expect(secondScene).toBeTruthy();
  if (!secondScene) {
    return;
  }
  const secondMote = namedObject(secondScene, 'creator-delight:mote-0');
  const secondHalo = namedObject(secondScene, 'creator-delight:preview-halo');

  expect(secondMote.x).toBeCloseTo(firstMote.x, 4);
  expect(secondMote.y).toBeCloseTo(firstMote.y, 4);
  expect(secondMote.alpha).toBeCloseTo(firstMote.alpha, 4);
  expect(secondHalo.alpha).toBeCloseTo(firstHalo.alpha, 4);
});
