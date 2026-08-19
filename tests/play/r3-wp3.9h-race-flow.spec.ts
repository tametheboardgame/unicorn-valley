import { expect, test, type Page } from '@playwright/test';

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

test('walking to the Rainbow Run start opens a confirmation instead of requiring E', async ({
  page,
}) => {
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForScene(page, 'RainbowMeadowScene');

  let snapshot = await getSnapshot(page);
  let meadow = sceneSnapshot(snapshot, 'RainbowMeadowScene');
  expect(meadow.objects.some((object) => object.name === 'race-entry-shared-start-sign')).toBe(
    true,
  );

  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
      };
      const meadowScene = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .scenes.find((scene) => scene.key === 'RainbowMeadowScene');
      return meadowScene?.objects.some((object) => object.name === 'race-entry-confirmation');
    },
    undefined,
    { timeout: 20_000 },
  );
  await page.keyboard.up('ArrowRight');

  snapshot = await getSnapshot(page);
  meadow = sceneSnapshot(snapshot, 'RainbowMeadowScene');
  expect(meadow.objects.some((object) => object.name === 'race-entry-confirmation')).toBe(true);
  expect(
    meadow.objects.some(
      (object) => object.name === 'race-entry-confirmation-yes' && object.interactive,
    ),
  ).toBe(true);
  expect(
    meadow.objects.some(
      (object) => object.name === 'race-entry-confirmation-no' && object.interactive,
    ),
  ).toBe(true);
  expect(
    meadow.objects.some(
      (object) => object.visible && object.text?.includes('Enter Rainbow Run'),
    ),
  ).toBe(false);
});

test('Sunrise Sprint finish controls remain clickable after the result panel appears', async ({
  page,
}) => {
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
    { timeout: 25_000 },
  );

  await page.keyboard.down('d');
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
    { timeout: 30_000 },
  );
  await page.keyboard.up('d');

  await page.waitForFunction(() => {
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
  });

  const finished = await getSnapshot(page);
  await logicalClick(page, finished.width / 2 - 145, finished.height / 2 + 190);

  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const race = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'RaceScene');
    return race?.state.raceFinished === false;
  });

  expect((await getSnapshot(page)).activeScenes).toContain('RaceScene');
});
