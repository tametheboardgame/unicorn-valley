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
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:ice-bridge:north-crossing');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:ice-bridge:east-crossing');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:crystal-cup-spur');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:treasure:crystal-north-bank');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:treasure:shell-reed-bank');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:ripple:unicorn');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:reflection-feeder');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:path:crystal-grotto-approach');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:path:crystal-grotto');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:reflection-pool-outer');
  await waitForObject(page, 'CrystalBrookScene', 'crystal-brook:upstream-cascade');
  await waitForObject(
    page,
    'CrystalBrookScene',
    'r6-region-gateway-art:crystal-brook:east-woodland',
  );
  await waitForObject(
    page,
    'CrystalBrookScene',
    'r6-region-gateway-art:crystal-brook:woods-path-exit',
  );
  await waitForObject(page, 'CrystalBrookScene', 'final-graphics-tightening:crystal-brook-anchor');

  const objects = await getSceneObjects(page, 'CrystalBrookScene');
  for (const name of [
    'crystal-brook:main-path',
    'crystal-brook:ice-bridge:north-crossing',
    'crystal-brook:ice-bridge:east-crossing',
    'crystal-brook:crystal-cup-spur',
    'crystal-brook:reflection-feeder',
    'crystal-brook:watercourse-outer',
    'crystal-brook:watercourse-inner',
    'crystal-brook:watercourse-deep',
    'crystal-brook:reflection-pool-outer',
    'crystal-brook:upstream-cascade',
    'r6-region-gateway-art:crystal-brook:east-woodland',
    'r6-region-gateway-art:crystal-brook:woods-path-exit',
  ]) {
    expect(objects.some((object) => object.name === name && object.visible)).toBe(true);
  }

  expect(
    objects.some((object) => object.name === 'final-graphics-tightening:crystal-brook-stream'),
  ).toBe(false);
  expect(
    objects.some((object) => object.name === 'exploration-path-polish' && object.visible),
  ).toBe(false);
  expect(
    objects.some((object) => object.name === 'r6-wp6.18ij:crystal-cascade:path' && object.visible),
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
  expect(
    objects.some(
      (object) =>
        object.name === 'r6-region-gateway-art:brook-woods:woodland-threshold' && object.visible,
    ),
  ).toBe(false);
  expect(objects.some((object) => object.name === 'brook-depth:cascade-memory')).toBe(false);

  // H6.7A grounds former floating emoji rewards and renders Ripple through
  // the canonical unicorn texture rather than legacy ellipse-body art.
  for (const id of [
    'crystal-north-bank',
    'crystal-stepping-bend',
    'shell-reed-bank',
    'shell-lower-pool',
  ]) {
    expect(objects.some(({ name }) => name === `crystal-brook:treasure:${id}`)).toBe(true);
  }
  expect(objects.some(({ name }) => name === 'crystal-brook:ripple:unicorn')).toBe(true);
  expect(objects.some(({ name }) => name === 'crystal-brook:secret-route:prism-inlay')).toBe(true);

  // H6.5A retires the old giant colour blobs and all competing crystal/cave producers.
  const giantBackdropCircles = objects.filter(
    (object) => object.type === 'Arc' && object.depth === 1 && object.displayWidth > 1200,
  );
  expect(giantBackdropCircles).toHaveLength(0);
  expect(
    objects.filter(({ name }) => name.startsWith('crystal-brook:crystal-grove:')),
  ).toHaveLength(10);
  expect(objects.some(({ name }) => name === 'crystal-brook:grotto:authored-arch')).toBe(true);
  expect(objects.some(({ name }) => name === 'crystal-brook:crystal-district-floors')).toBe(true);
  const feederDepth = objects.find(({ name }) => name === 'crystal-brook:reflection-feeder')?.depth;
  const riverDepth = objects.find(({ name }) => name === 'crystal-brook:watercourse-outer')?.depth;
  expect(feederDepth).toBeDefined();
  expect(riverDepth).toBeDefined();
  expect(feederDepth ?? 100).toBeLessThan(riverDepth ?? 0);
  for (const index of [0, 1, 2]) {
    expect(
      objects.some(({ name }) => name === `crystal-brook:reflection-stepping-stone:${index}`),
    ).toBe(true);
  }
  expect(objects.some(({ name }) => name.includes('wp18f-world-experience:crystal-cluster'))).toBe(
    false,
  );
  expect(objects.some(({ name }) => name.includes('prism-grotto-rock'))).toBe(false);
  expect(objects.some(({ name }) => name.includes('crystal-brook:production-upgrade'))).toBe(false);
  const trunks = objects.find(
    ({ name }) => name === 'r6-region-gateway-art:crystal-brook:east-woodland-trunks',
  );
  const canopy = objects.find(
    ({ name }) => name === 'r6-region-gateway-art:crystal-brook:east-woodland',
  );
  const eastRock = objects.find(
    (object) =>
      object.name.startsWith('crystal-brook:boundary:rock:') && object.x >= 3310 && object.y >= 250,
  );
  expect(trunks).toBeDefined();
  expect(canopy).toBeDefined();
  expect(eastRock).toBeDefined();
  expect(trunks?.depth ?? 999).toBeLessThan(eastRock?.depth ?? 0);
  expect(eastRock?.depth ?? 999).toBeLessThan(canopy?.depth ?? 0);
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
