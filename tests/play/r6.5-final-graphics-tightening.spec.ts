import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  x: number;
  y: number;
  displayWidth: number;
  depth: number;
  alpha: number;
  visible: boolean;
}

interface DiagnosticSnapshot {
  scenes: Array<{
    key: string;
    objects: DiagnosticObject[];
  }>;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean((window as any).__UNICORN_VALLEY_DIAGNOSTICS__));
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    (window as any).__UNICORN_VALLEY_DIAGNOSTICS__.startScene(key);
  }, sceneKey);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedScene, expectedName }) => {
      const snapshot = (window as any).__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
      return snapshot?.scenes
        .find((scene: any) => scene.key === expectedScene)
        ?.objects.some((object: any) => object.name === expectedName);
    },
    { expectedScene: sceneKey, expectedName: objectName },
  );
}

async function getSceneObjects(page: Page, sceneKey: string): Promise<DiagnosticObject[]> {
  return page.evaluate((key) => {
    const snapshot = (window as any).__UNICORN_VALLEY_DIAGNOSTICS__.snapshot() as DiagnosticSnapshot;
    return snapshot.scenes.find((scene) => scene.key === key)?.objects ?? [];
  }, sceneKey);
}

test('Whispering Woods uses one connected entrance path and one light-shaft treatment', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await startScene(page, 'WhisperingWoodsScene');
  await waitForObject(
    page,
    'WhisperingWoodsScene',
    'final-graphics-tightening:whispering-woods-anchor',
  );

  const objects = await getSceneObjects(page, 'WhisperingWoodsScene');
  expect(
    objects.find((object) => object.name === 'r6-region-gateway-art:woods-entry-trail:path')
      ?.visible,
  ).toBe(false);
  expect(
    objects.find(
      (object) => object.name === 'r6-region-gateway-art:whispering-woods:light-shafts',
    )?.visible,
  ).toBe(false);
  expect(objects.some((object) => object.name === 'exploration-path-polish' && object.visible)).toBe(
    true,
  );

  const largeBackdropCircles = objects.filter(
    (object) => object.type === 'Arc' && object.depth === 1 && object.displayWidth > 1200,
  );
  expect(largeBackdropCircles.length).toBeGreaterThanOrEqual(3);
  expect(Math.max(...largeBackdropCircles.map((object) => object.alpha))).toBeLessThanOrEqual(0.15);
});

test('Crystal Brook replaces sharp stream joins with one rounded stream treatment', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await startScene(page, 'CrystalBrookScene');
  await waitForObject(
    page,
    'CrystalBrookScene',
    'final-graphics-tightening:crystal-brook-anchor',
  );

  const objects = await getSceneObjects(page, 'CrystalBrookScene');
  expect(
    objects.some(
      (object) => object.name === 'final-graphics-tightening:crystal-brook-stream' && object.visible,
    ),
  ).toBe(true);
  expect(
    objects.some(
      (object) => object.type === 'Graphics' && object.name === '' && object.depth === 3 && object.visible,
    ),
  ).toBe(false);

  const largeBackdropCircles = objects.filter(
    (object) => object.type === 'Arc' && object.depth === 1 && object.displayWidth > 1200,
  );
  expect(largeBackdropCircles.length).toBeGreaterThanOrEqual(3);
  expect(Math.max(...largeBackdropCircles.map((object) => object.alpha))).toBeLessThanOrEqual(0.16);
});
