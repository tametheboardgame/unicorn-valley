import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  text: string | null;
  x: number;
  y: number;
  interactive: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, payload }) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key, payload);
    },
    { key: sceneKey, payload: data },
  );
  await waitForScene(page, sceneKey);
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const value = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
    if (!value) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return value;
  });
}

function sceneFrom(value: DiagnosticSnapshot, sceneKey: string): DiagnosticScene {
  const scene = value.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostics for ${sceneKey}.`);
  }
  return scene;
}

async function clickLogicalText(page: Page, text: string): Promise<void> {
  const value = await snapshot(page);
  const scene = value.scenes.find((candidate) =>
    candidate.objects.some((object) => object.text === text),
  );
  const object = scene?.objects.find((candidate) => candidate.text === text);
  const bounds = await page.locator('canvas').boundingBox();
  if (!object || !bounds) {
    throw new Error(`Cannot click text ${text}.`);
  }

  await page.mouse.click(
    bounds.x + (object.x / value.width) * bounds.width,
    bounds.y + (object.y / value.height) * bounds.height,
  );
}

test('Sunbeam Village shops read as authored open storefronts', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'SunbeamVillageScene');

  const village = sceneFrom(await snapshot(page), 'SunbeamVillageScene');
  for (const shopId of ['bakery', 'accessory-shop', 'library']) {
    expect(
      village.objects.some((object) => object.name === `village-shopfront:${shopId}:wall`),
    ).toBe(true);
    expect(
      village.objects.some((object) => object.name === `village-shopfront:${shopId}:door`),
    ).toBe(true);
    expect(
      village.objects.some((object) => object.name === `village-shopfront:${shopId}:sign`),
    ).toBe(true);
    expect(
      village.objects.some((object) => object.name === `village-shopfront:${shopId}:identity`),
    ).toBe(true);
  }
});

test('all three village buildings have distinct usable interiors', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');

  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'bakery',
    returnScene: 'SunbeamVillageScene',
  });
  let interior = sceneFrom(await snapshot(page), 'VillageInteriorScene');
  expect(
    interior.objects.some((object) => object.name === 'village-interior:bakery:room-shell'),
  ).toBe(true);
  expect(
    interior.objects.some((object) => object.name === 'village-interior:bakery:counter'),
  ).toBe(true);

  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'library',
    returnScene: 'SunbeamVillageScene',
  });
  interior = sceneFrom(await snapshot(page), 'VillageInteriorScene');
  expect(
    interior.objects.some((object) => object.name === 'village-interior:library:room-shell'),
  ).toBe(true);
  expect(
    interior.objects.some((object) => object.name === 'village-interior:library:story-table'),
  ).toBe(true);

  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'accessory-shop',
    returnScene: 'SunbeamVillageScene',
  });
  interior = sceneFrom(await snapshot(page), 'VillageInteriorScene');
  expect(
    interior.objects.some((object) => object.name === 'village-interior:accessory-shop:room-shell'),
  ).toBe(true);
  expect(
    interior.objects.some((object) => object.name === 'village-interior:accessory-shop:counter'),
  ).toBe(true);
});

test('Twinkle & Thread opens the real shop and interiors return safely to the village', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await waitForScene(page, 'TitleScene');
  await startScene(page, 'VillageInteriorScene', {
    interiorId: 'accessory-shop',
    returnScene: 'SunbeamVillageScene',
  });

  await page.evaluate(() => {
    const diagnostics = (window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    }).__UNICORN_VALLEY_DIAGNOSTICS__;
    diagnostics?.setArcadeSpritePosition('VillageInteriorScene', 'world-player-unicorn', 1080, 520);
  });
  await page.keyboard.press('Enter');

  await expect
    .poll(async () =>
      sceneFrom(await snapshot(page), 'VillageInteriorScene').objects.some(
        (object) => object.name === 'twinkle-shop-title',
      ),
    )
    .toBe(true);

  await clickLogicalText(page, 'Back to the boutique');
  await expect
    .poll(async () =>
      sceneFrom(await snapshot(page), 'VillageInteriorScene').objects.some(
        (object) => object.name === 'twinkle-shop-title',
      ),
    )
    .toBe(false);

  await page.evaluate(() => {
    const diagnostics = (window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    }).__UNICORN_VALLEY_DIAGNOSTICS__;
    diagnostics?.setArcadeSpritePosition('VillageInteriorScene', 'world-player-unicorn', 750, 900);
  });
  await page.keyboard.press('Enter');
  await waitForScene(page, 'SunbeamVillageScene');
  expect((await snapshot(page)).activeScenes).toContain('SunbeamVillageScene');
});
