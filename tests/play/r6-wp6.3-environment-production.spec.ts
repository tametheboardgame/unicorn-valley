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

const REGIONS = [
  {
    route: 'glade',
    sceneKey: 'MoonflowerGladeScene',
    environment: 'moonflower-glade',
    layers: ['background', 'signature', 'foreground', 'ambient'],
  },
  {
    route: 'village',
    sceneKey: 'SunbeamVillageScene',
    environment: 'sunbeam-village',
    layers: ['background', 'signature', 'foreground', 'ambient'],
  },
  {
    route: 'meadow',
    sceneKey: 'RainbowMeadowScene',
    environment: 'rainbow-meadow',
    layers: ['background', 'signature', 'foreground', 'ambient'],
  },
  {
    route: 'brook',
    sceneKey: 'CrystalBrookScene',
    environment: 'crystal-brook',
    layers: ['background', 'signature', 'foreground', 'ambient'],
  },
  {
    route: 'woods',
    sceneKey: 'WhisperingWoodsScene',
    environment: 'whispering-woods',
    layers: ['background', 'signature', 'foreground', 'ambient'],
  },
  {
    route: 'race',
    sceneKey: 'RaceScene',
    environment: 'rainbow-run',
    layers: ['background', 'signature', 'ambient'],
  },
] as const;

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

async function waitForObject(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<void> {
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

async function waitForPlayerTravel(page: Page, startX: number, distance: number): Promise<void> {
  await page.waitForFunction(
    ({ originX, requiredDistance }) => {
      const diagnostics = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): DiagnosticSnapshot };
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const player = diagnostics
        ?.snapshot()
        .scenes.find(({ key }) => key === 'MoonflowerGladeScene')
        ?.objects.find(
          ({ name, textureKey }) =>
            name === 'world-player-unicorn' || textureKey?.startsWith('player-unicorn-'),
        );
      return Boolean(player && player.x - originX > requiredDistance);
    },
    { originX: startX, requiredDistance: distance },
    { timeout: 4000 },
  );
}

function playerObject(scene: DiagnosticScene): DiagnosticObject {
  const player = scene.objects.find(
    (object) =>
      object.name === 'world-player-unicorn' || object.textureKey?.startsWith('player-unicorn-'),
  );
  if (!player) {
    throw new Error('Missing world player diagnostic object.');
  }
  return player;
}

test(
  'production environment layers give every main region a distinct non-interactive visual pass',
  async ({ page }) => {
    for (const region of REGIONS) {
      await page.goto(`/?scene=${region.route}&diagnostics=1`);
      await waitForScene(page, region.sceneKey);
      await waitForObject(
        page,
        region.sceneKey,
        `environment-production:${region.environment}:anchor`,
      );

      const scene = (await snapshot(page)).scenes.find(({ key }) => key === region.sceneKey);
      expect(scene).toBeTruthy();
      if (!scene) {
        continue;
      }

      for (const layer of region.layers) {
        const object = scene.objects.find(
          ({ name }) => name === `environment-production:${region.environment}:${layer}`,
        );
        expect(object, `${region.environment} should expose its ${layer} layer`).toBeTruthy();
        expect(object?.interactive).toBe(false);
      }
    }
  },
);

test('environment production scenery leaves established open-ground traversal intact', async ({
  page,
}) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');
  await waitForObject(
    page,
    'MoonflowerGladeScene',
    'environment-production:moonflower-glade:anchor',
  );

  let scene = (await snapshot(page)).scenes.find(({ key }) => key === 'MoonflowerGladeScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }
  const before = playerObject(scene);

  await page.keyboard.down('ArrowRight');
  try {
    await waitForPlayerTravel(page, before.x, 55);
  } finally {
    await page.keyboard.up('ArrowRight');
  }

  scene = (await snapshot(page)).scenes.find(({ key }) => key === 'MoonflowerGladeScene');
  expect(scene).toBeTruthy();
  if (!scene) {
    return;
  }
  const after = playerObject(scene);
  expect(after.x - before.x).toBeGreaterThan(55);
});
