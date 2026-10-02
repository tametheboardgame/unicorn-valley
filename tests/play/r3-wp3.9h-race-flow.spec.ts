import { expect, test, type Page } from '@playwright/test';

const WORLD_TRIGGER_TIMEOUT_MS = 30_000;

interface DiagnosticObjectSnapshot {
  name: string;
  text: string | null;
  visible: boolean;
  interactive: boolean;
}

interface DiagnosticSceneSnapshot {
  key: string;
  state: {
    raceStarted: boolean | null;
    raceFinished: boolean | null;
  };
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
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
}

async function logicalClick(page: Page, logicalX: number, logicalY: number): Promise<void> {
  const snapshot = await getSnapshot(page);
  const bounds = await page.locator('canvas').boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (logicalX / snapshot.width) * bounds.width,
    bounds.y + (logicalY / snapshot.height) * bounds.height,
  );
}

function sceneSnapshot(
  snapshot: BrowserDiagnosticSnapshot,
  sceneKey: string,
): DiagnosticSceneSnapshot {
  const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Missing diagnostic scene ${sceneKey}.`);
  }
  return scene;
}

test('Rainbow Meadow now enters the standalone Rainbow Run Race Hub', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForScene(page, 'RainbowMeadowScene');

  await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: {
          setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
        };
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    diagnostics?.setArcadeSpritePosition('RainbowMeadowScene', 'world-player-unicorn', 2950, 390);
  });
  await page.waitForTimeout(120);
  await page.keyboard.press('KeyE');
  await waitForScene(page, 'RainbowRunEntryScene');

  const snapshot = await getSnapshot(page);
  const hub = sceneSnapshot(snapshot, 'RainbowRunEntryScene');
  expect(hub.objects.some((object) => object.name === 'rainbow-run-hub:race-gate')).toBe(true);
  expect(snapshot.activeScenes).not.toContain('RainbowMeadowScene');
});

test('Sunrise Sprint finish controls remain clickable after the result panel appears', async ({
  page,
}) => {
  test.setTimeout(75_000);
  await page.goto('/?scene=race&diagnostics=1');
  await waitForScene(page, 'RaceScene');

  await page.waitForFunction(
    () => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
      };
      return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((scene) => scene.key === 'RaceScene')?.state.raceStarted;
    },
    undefined,
    { timeout: 30_000 },
  );

  await page.keyboard.down('d');
  try {
    await page.waitForFunction(
      () => {
        const diagnosticWindow = window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
        };
        return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
          ?.snapshot()
          .scenes.find((scene) => scene.key === 'RaceScene')?.state.raceFinished;
      },
      undefined,
      { timeout: 35_000 },
    );
  } finally {
    await page.keyboard.up('d');
  }

  await page.waitForFunction(
    () => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
      };
      const race = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((scene) => scene.key === 'RaceScene');
      return (
        race?.objects.some(
          (object) => object.name === 'race-finish-restart-zone' && object.interactive,
        ) &&
        race.objects.some((object) => object.name === 'race-finish-exit-zone' && object.interactive)
      );
    },
    undefined,
    { timeout: 10_000 },
  );

  const finished = await getSnapshot(page);
  await logicalClick(page, finished.width / 2 + 145, finished.height / 2 + 190);

  await waitForScene(page, 'RainbowRunEntryScene');

  const returned = await getSnapshot(page);
  expect(returned.activeScenes).toContain('RainbowRunEntryScene');
  expect(returned.activeScenes).not.toContain('RainbowMeadowScene');
});
