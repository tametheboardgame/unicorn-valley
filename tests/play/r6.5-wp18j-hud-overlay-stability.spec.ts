import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  alpha: number;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface DiagnosticScene {
  key: string;
  camera: { scrollX: number; scrollY: number };
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: DiagnosticScene[];
  };
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function snapshot(page: Page): Promise<ReturnType<BrowserDiagnosticsApi['snapshot']>> {
  return page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are not installed.');
    }
    return api.snapshot();
  });
}

function sceneFrom(
  current: ReturnType<BrowserDiagnosticsApi['snapshot']>,
  key: string,
): DiagnosticScene {
  const scene = current.scenes.find((candidate) => candidate.key === key);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${key}.`);
  }
  return scene;
}

function overlayGeometry(objects: DiagnosticObject[]): Array<{
  name: string;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}> {
  const wanted = new Set([
    'exploration-hud-overlay-map-label',
    'exploration-hud-overlay-bag-label',
    'exploration-hud-overlay-book-label',
    'exploration-hud-overlay-settings-nav-label',
    'exploration-hud-overlay-shimmer-label',
    'exploration-hud-overlay-location-label',
  ]);
  return objects
    .filter(({ name }) => wanted.has(name))
    .map(({ name, x, y, displayWidth, displayHeight }) => ({
      name,
      x,
      y,
      displayWidth,
      displayHeight,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

test.use({ viewport: { width: 1180, height: 664 }, hasTouch: true });

test('exploration top HUD is isolated from smooth world-camera movement', async ({ page }) => {
  await page.goto('/?scene=glade&diagnostics=1', { waitUntil: 'networkidle' });

  await expect
    .poll(async () => {
      const current = await snapshot(page);
      return (
        current.activeScenes.includes('MoonflowerGladeScene') &&
        current.activeScenes.includes('ExplorationHudOverlayScene')
      );
    })
    .toBe(true);

  await expect
    .poll(async () => {
      const overlay = sceneFrom(await snapshot(page), 'ExplorationHudOverlayScene');
      return overlay.objects.some(
        ({ name, visible }) => name === 'exploration-hud-overlay-bag-label' && visible,
      );
    })
    .toBe(true);

  const before = await snapshot(page);
  const worldBefore = sceneFrom(before, 'MoonflowerGladeScene');
  const overlayBefore = sceneFrom(before, 'ExplorationHudOverlayScene');
  const geometryBefore = overlayGeometry(overlayBefore.objects);
  expect(geometryBefore).toHaveLength(6);

  for (const sourceName of [
    'exploration-shell-bag-label',
    'exploration-shell-shimmer-label',
    'exploration-location-title',
  ]) {
    const source = worldBefore.objects.find(({ name }) => name === sourceName);
    expect(source?.alpha ?? 1).toBeLessThanOrEqual(0.01);
  }

  const player = worldBefore.objects.find(({ name }) => name === 'world-player-unicorn');
  expect(player).toBeTruthy();
  const targetY = Math.min((player?.y ?? 800) + 420, 1600);

  await page.evaluate(
    ({ x, y }) => {
      const api = (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      api?.setArcadeSpritePosition('MoonflowerGladeScene', 'world-player-unicorn', x, y);
    },
    { x: player?.x ?? 1600, y: targetY },
  );

  await expect
    .poll(async () => {
      const world = sceneFrom(await snapshot(page), 'MoonflowerGladeScene');
      return Math.abs(world.camera.scrollY - worldBefore.camera.scrollY);
    })
    .toBeGreaterThan(20);

  const after = await snapshot(page);
  const geometryAfter = overlayGeometry(sceneFrom(after, 'ExplorationHudOverlayScene').objects);
  expect(geometryAfter).toEqual(geometryBefore);

  await page.screenshot({
    path: test.info().outputPath('wp18j-fixed-hud-overlay.png'),
    fullPage: true,
  });
});
