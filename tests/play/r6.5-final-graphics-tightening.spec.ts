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

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  scenes: DiagnosticScene[];
}

interface DiagnosticApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string): void;
}

type DiagnosticWindow = typeof window & {
  __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticApi;
};

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const diagnosticWindow = window as DiagnosticWindow;
    return Boolean(diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__);
  });
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnosticWindow = window as DiagnosticWindow;
    diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key);
  }, sceneKey);
}

async function waitForObject(page: Page, sceneKey: string, objectName: string): Promise<void> {
  await page.waitForFunction(
    ({ expectedScene, expectedName }) => {
      const diagnosticWindow = window as DiagnosticWindow;
      const snapshot = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
      return snapshot?.scenes
        .find((scene) => scene.key === expectedScene)
        ?.objects.some((object) => object.name === expectedName);
    },
    { expectedScene: sceneKey, expectedName: objectName },
  );
}

async function getSceneObjects(page: Page, sceneKey: string): Promise<DiagnosticObject[]> {
  return page.evaluate((key) => {
    const diagnosticWindow = window as DiagnosticWindow;
    const snapshot = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
    return snapshot?.scenes.find((scene) => scene.key === key)?.objects ?? [];
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
    objects.find((object) => object.name === 'r6-region-gateway-art:whispering-woods:light-shafts')
      ?.visible,
  ).toBe(false);
  expect(
    objects.some((object) => object.name === 'exploration-path-polish' && object.visible),
  ).toBe(true);

  const largeBackdropCircles = objects.filter(
    (object) => object.type === 'Arc' && object.depth === 1 && object.displayWidth > 1200,
  );
  expect(largeBackdropCircles.length).toBeGreaterThanOrEqual(3);
  expect(Math.max(...largeBackdropCircles.map((object) => object.alpha))).toBeLessThanOrEqual(0.15);
});

test('Crystal Brook owns one continuous filled water system without legacy replacement layers', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await startScene(page, 'CrystalBrookScene');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:main-path');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:watercourse-outer');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:race-bridge');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:reflection-feeder');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:reflection-pool-outer');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:upstream-cascade');
  await waitForObject(page, 'CrystalBrookScene', 'final-graphics-tightening:crystal-brook-anchor');

  const objects = await getSceneObjects(page, 'CrystalBrookScene');
  for (const name of [
    'crystal-brook:main-path',
    'crystal-brook:race-bridge',
    'crystal-brook:reflection-feeder',
    'crystal-brook:watercourse-outer',
    'crystal-brook:watercourse-inner',
    'crystal-brook:watercourse-deep',
    'crystal-brook:reflection-inlet',
    'crystal-brook:reflection-pool-outer',
    'crystal-brook:upstream-cascade',
  ]) {
    expect(objects.some((object) => object.name === name && object.visible)).toBe(true);
  }

  expect(
    objects.some((object) => object.name === 'final-graphics-tightening:crystal-brook-stream'),
  ).toBe(false);
  expect(
    objects.some((object) => object.name === 'exploration-path-polish' && object.visible),
  ).toBe(false);
  expect(objects.some((object) => object.name === 'brook-depth:waterfall-mist-landmark')).toBe(
    false,
  );
  expect(objects.some((object) => object.name === 'brook-depth:reflection-pool-landmark')).toBe(
    false,
  );
  expect(
    objects.some((object) => object.name === 'r6-region-gateway-art:crystal-brook:cascade-upgrade'),
  ).toBe(false);

  const largeBackdropCircles = objects.filter(
    (object) => object.type === 'Arc' && object.depth === 1 && object.displayWidth > 1200,
  );
  expect(largeBackdropCircles.length).toBeGreaterThanOrEqual(3);
  expect(Math.max(...largeBackdropCircles.map((object) => object.alpha))).toBeLessThanOrEqual(0.16);
});

test('Nova tutorial race uses the unified modern Nova presentation', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);
  await startScene(page, 'NovaTutorialRaceScene');
  await waitForObject(page, 'NovaTutorialRaceScene', 'nova-modern-racer');

  const objects = await getSceneObjects(page, 'NovaTutorialRaceScene');
  expect(objects.some((object) => object.name === 'nova-modern-racer' && object.visible)).toBe(
    true,
  );
  expect(objects.some((object) => object.name === 'nova-canonical-racer' && object.visible)).toBe(
    false,
  );
});
