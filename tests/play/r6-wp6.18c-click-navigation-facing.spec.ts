import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  flipX: boolean;
  playerFacing: string | null;
  authoritativeFacing: string | null;
}

interface DiagnosticScene {
  key: string;
  camera: {
    scrollX: number;
    scrollY: number;
  };
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

function getScene(value: DiagnosticSnapshot): DiagnosticScene {
  const scene = value.scenes.find((candidate) => candidate.key === 'MoonflowerGladeScene');
  if (!scene) {
    throw new Error('Moonflower Glade diagnostics are missing.');
  }
  return scene;
}

function getPlayer(scene: DiagnosticScene): DiagnosticObject {
  const player = scene.objects.find((object) => object.name === 'world-player-unicorn');
  if (!player) {
    throw new Error('Player unicorn diagnostics are missing.');
  }
  return player;
}

async function logicalClick(page: Page, logicalX: number, logicalY: number): Promise<void> {
  const value = await snapshot(page);
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (logicalX / value.width) * bounds.width,
    bounds.y + (logicalY / value.height) * bounds.height,
  );
}

test('backwards click navigation keeps authoritative facing stable until direction changes', async ({
  page,
}) => {
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForScene(page, 'MoonflowerGladeScene');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(260);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(100);

  let value = await snapshot(page);
  let scene = getScene(value);
  let player = getPlayer(scene);
  expect(player.playerFacing).toBe('right');
  expect(player.authoritativeFacing).toBe('right');
  expect(player.flipX).toBe(false);

  const startingX = player.x;
  const screenX = player.x - scene.camera.scrollX;
  const screenY = player.y - scene.camera.scrollY;
  await logicalClick(page, Math.max(120, screenX - 280), screenY);

  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const glade = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((candidate) => candidate.key === 'MoonflowerGladeScene');
    const currentPlayer = glade?.objects.find((object) => object.name === 'world-player-unicorn');
    return currentPlayer?.playerFacing === 'left' && currentPlayer.authoritativeFacing === 'left';
  });

  const samples: DiagnosticObject[] = [];
  for (let index = 0; index < 8; index += 1) {
    await page.waitForTimeout(55);
    value = await snapshot(page);
    scene = getScene(value);
    samples.push(getPlayer(scene));
  }

  expect(samples.at(-1)?.x ?? startingX).toBeLessThan(startingX - 70);
  for (const sample of samples) {
    expect(sample.playerFacing).toBe('left');
    expect(sample.authoritativeFacing).toBe('left');
    expect(sample.flipX).toBe(true);
  }

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(80);

  value = await snapshot(page);
  player = getPlayer(getScene(value));
  expect(player.playerFacing).toBe('right');
  expect(player.authoritativeFacing).toBe('right');
  expect(player.flipX).toBe(false);
});
