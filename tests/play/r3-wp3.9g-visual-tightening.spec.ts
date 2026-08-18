import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObjectSnapshot {
  name: string;
  textureKey: string | null;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

async function getSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((expectedScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes(expectedScene);
  }, sceneKey);
  await page.waitForTimeout(450);
}

for (const [alias, sceneKey, minimumDetails] of [
  ['glade', 'MoonflowerGladeScene', 18],
  ['village', 'SunbeamVillageScene', 24],
  ['meadow', 'RainbowMeadowScene', 18],
  ['cottage', 'CottageInteriorScene', 18],
  ['nova-race', 'NovaTutorialRaceScene', 18],
  ['race', 'RaceScene', 18],
] as const) {
  test(`${sceneKey} receives non-interactive visual tightening detail`, async ({ page }) => {
    await page.goto(`/?scene=${alias}&diagnostics=1`);
    await waitForScene(page, sceneKey);

    const snapshot = await getSnapshot(page);
    const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
    expect(scene).toBeTruthy();

    const details =
      scene?.objects.filter(
        (object) => object.name === 'visual-tightening-detail' && object.visible,
      ) ?? [];
    expect(details.length).toBeGreaterThanOrEqual(minimumDetails);

    for (const detail of details) {
      expect(detail.scrollFactorX).toBe(1);
      expect(detail.scrollFactorY).toBe(1);
    }
  });
}

test('player unicorn proportions stay coherent while race animation can squash and stretch', async ({
  page,
}) => {
  const worldAspectRatios: number[] = [];
  let raceAspectRatio: number | null = null;

  for (const [alias, sceneKey] of [
    ['glade', 'MoonflowerGladeScene'],
    ['meadow', 'RainbowMeadowScene'],
    ['race', 'RaceScene'],
  ] as const) {
    await page.goto(`/?scene=${alias}&diagnostics=1`);
    await waitForScene(page, sceneKey);

    const snapshot = await getSnapshot(page);
    const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
    const player = scene?.objects.find((object) =>
      object.textureKey?.startsWith('player-unicorn-'),
    );
    expect(player).toBeTruthy();

    if (!player) {
      continue;
    }

    const ratio = player.displayWidth / player.displayHeight;
    expect(ratio).toBeGreaterThan(1.15);
    expect(ratio).toBeLessThan(1.4);

    if (sceneKey === 'RaceScene') {
      raceAspectRatio = ratio;
    } else {
      worldAspectRatios.push(ratio);
    }
  }

  expect(worldAspectRatios).toHaveLength(2);
  expect(Math.max(...worldAspectRatios) - Math.min(...worldAspectRatios)).toBeLessThan(0.02);
  expect(raceAspectRatio).not.toBeNull();
  expect(Math.abs((raceAspectRatio ?? 0) - worldAspectRatios[0])).toBeLessThan(0.16);
});
