import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { RAINBOW_RUN_HUB_LAYOUT } from '../../src/game/world/RainbowRunHubMap';
import { CRYSTAL_BROOK_GROTTO_THRESHOLD } from '../../src/game/world/CrystalBrookMap';

interface DiagnosticObject {
  name: string;
  visible: boolean;
  active: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

type DiagnosticWindow = typeof window & {
  __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
};

const ARTIFACT_DIR = 'playtest-artifacts/wp18f';

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__),
  );
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnostics = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(expectedScene) === true;
  }, sceneKey);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(key);
  }, sceneKey);
  await waitForScene(page, sceneKey);
}

async function movePlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, nextX, nextY }) => {
      (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
        key,
        'world-player-unicorn',
        nextX,
        nextY,
      );
    },
    { key: sceneKey, nextX: x, nextY: y },
  );
  await page.waitForTimeout(350);
}

async function sceneObjectNames(page: Page, sceneKey: string): Promise<string[]> {
  return page.evaluate((key) => {
    const snapshot = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
    return (
      snapshot?.scenes.find((scene) => scene.key === key)?.objects.map(({ name }) => name) ?? []
    );
  }, sceneKey);
}

async function expectObjects(
  page: Page,
  sceneKey: string,
  names: readonly string[],
): Promise<void> {
  await page.waitForFunction(
    ({ key, requiredNames }) => {
      const snapshot = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
      const objects = snapshot?.scenes.find((scene) => scene.key === key)?.objects ?? [];
      const objectNames = new Set(objects.map(({ name }) => name));
      return requiredNames.every((name) => objectNames.has(name));
    },
    { key: sceneKey, requiredNames: names },
  );
  const actualNames = await sceneObjectNames(page, sceneKey);
  for (const name of names) {
    expect(actualNames).toContain(name);
  }
}

test.beforeAll(async () => {
  await mkdir(ARTIFACT_DIR, { recursive: true });
});

test.describe('R6.5-WP18F visual evidence', () => {
  test('player retains production body in Meadow and Nova is correctly presented at Race Hub', async ({
    page,
  }) => {
    await page.goto('/?scene=meadow&diagnostics=1');
    await waitForDiagnostics(page);
    await waitForScene(page, 'RainbowMeadowScene');
    await expectObjects(page, 'RainbowMeadowScene', [
      'world-player-unicorn',
      'world-player-mane-coverage',
    ]);
    expect(await sceneObjectNames(page, 'RainbowMeadowScene')).not.toContain('core-npc:nova:world');

    // Nova's canonical pre-picnic home moved to the standalone Rainbow Run hub.
    await page.goto('/?scene=race-hub&diagnostics=1');
    await waitForDiagnostics(page);
    await waitForScene(page, 'RainbowRunEntryScene');
    await expectObjects(page, 'RainbowRunEntryScene', [
      'world-player-unicorn',
      'core-npc:nova:race-hub',
    ]);
    await movePlayer(
      page,
      'RainbowRunEntryScene',
      RAINBOW_RUN_HUB_LAYOUT.nova.x + 160,
      RAINBOW_RUN_HUB_LAYOUT.nova.y,
    );
    await page.screenshot({ path: `${ARTIFACT_DIR}/rainbow-run-hub-nova-and-player.png` });
  });

  test('Shell Cove reads as an enclosed cove and includes the unicorn sandcastle', async ({
    page,
  }) => {
    await page.goto('/?scene=beach&diagnostics=1');
    await waitForDiagnostics(page);
    await waitForScene(page, 'StarlightBeachScene');
    await expectObjects(page, 'StarlightBeachScene', [
      'wp18f-world-experience:shell-cove',
      'wp18f-world-experience:unicorn-sandcastle',
    ]);
    await movePlayer(page, 'StarlightBeachScene', 820, 1040);
    await page.screenshot({ path: `${ARTIFACT_DIR}/shell-cove-and-sandcastle.png` });
  });

  test('Crystal Brook approach terminates in a readable crystal grotto', async ({ page }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'CrystalBrookScene');
    // The legacy WP18F grotto mouth and generic cluster were intentionally
    // replaced by single Brook-owned Grotto architecture and faceted crystals.
    await expectObjects(page, 'CrystalBrookScene', [
      'crystal-brook:grotto:authored-arch',
      'crystal-brook:crystal-grove:prism-east-shoulder',
    ]);
    const { x, y } = CRYSTAL_BROOK_GROTTO_THRESHOLD.approach;
    await movePlayer(page, 'CrystalBrookScene', x, y);
    await page.screenshot({ path: `${ARTIFACT_DIR}/crystal-brook-prism-grotto.png` });
  });

  test('Sunbeam Village shop exteriors communicate distinct functions', async ({ page }) => {
    await page.goto('/?scene=village&diagnostics=1');
    await waitForDiagnostics(page);
    await waitForScene(page, 'SunbeamVillageScene');
    await expectObjects(page, 'SunbeamVillageScene', [
      'village-shopfront:bakery:feature:chimney',
      'village-shopfront:accessory-shop:feature:turret',
      'village-shopfront:library:feature:attic-window',
      'village-shopfront:bakery:sign',
      'village-shopfront:accessory-shop:sign',
      'village-shopfront:library:sign',
    ]);
    await movePlayer(page, 'SunbeamVillageScene', 1500, 800);
    await page.screenshot({ path: `${ARTIFACT_DIR}/sunbeam-village-shopfronts.png` });
  });

  test('Whispering Woods keeps its baseline while gaining restrained magical atmosphere', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'WhisperingWoodsScene');
    await expectObjects(page, 'WhisperingWoodsScene', [
      'wp18f-world-experience:whispering-woods',
      'wp18f-world-experience:woods-mote:0',
    ]);
    await movePlayer(page, 'WhisperingWoodsScene', 1980, 1080);
    await page.screenshot({ path: `${ARTIFACT_DIR}/whispering-woods-atmosphere.png` });
  });
});
