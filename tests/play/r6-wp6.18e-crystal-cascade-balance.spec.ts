import { expect, test, type Page } from '@playwright/test';

const CRYSTAL_CASCADE_RACE_ID = 'race-course:crystal-brook-crystal-cascade';
const RACE_CONDITION_TIMEOUT_MS = 15_000;
const RACE_START_TIMEOUT_MS = 30_000;
const CLEAN_JUMP_PROGRESS = [430, 1230, 2000, 2870] as const;

interface DiagnosticSceneState {
  raceStarted: boolean | null;
  raceFinished: boolean | null;
  raceProgress: number | null;
  raceGrounded: boolean | null;
  raceHitObstacleCount: number | null;
  raceCollectedCount: number | null;
  raceUsedShortcutCount: number | null;
  racePlayerFinishPlace: number | null;
  raceElapsedMs: number | null;
}

interface DiagnosticObject {
  text: string | null;
}

interface DiagnosticScene {
  key: string;
  state: DiagnosticSceneState;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  sceneState(sceneKey: string): DiagnosticSceneState | null;
  startScene(sceneKey: string, data?: object): void;
  selectRaceCourse(courseId: string): void;
}

async function waitForRaceState(
  page: Page,
  predicate: (state: DiagnosticSceneState) => boolean,
  timeout = RACE_CONDITION_TIMEOUT_MS,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => {
          const diagnosticWindow = window as typeof window & {
            __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
          };
          return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.sceneState('RaceScene') ?? null;
        });
        return state !== null && predicate(state);
      },
      { timeout, intervals: [40, 40, 40, 40] },
    )
    .toBe(true);
}

async function jumpAtProgress(page: Page, threshold: number): Promise<void> {
  await page.waitForFunction(
    (target) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      const state = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.sceneState('RaceScene');
      return (
        state?.raceProgress !== null &&
        state?.raceProgress !== undefined &&
        state.raceProgress >= target &&
        state.raceGrounded === true
      );
    },
    threshold,
    { timeout: RACE_CONDITION_TIMEOUT_MS, polling: 'raf' },
  );

  await page.keyboard.down('Space');
  try {
    await page.waitForFunction(
      () => {
        const diagnosticWindow = window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        };
        return (
          diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.sceneState('RaceScene')?.raceGrounded ===
          false
        );
      },
      undefined,
      { timeout: RACE_CONDITION_TIMEOUT_MS, polling: 'raf' },
    );
  } finally {
    await page.keyboard.up('Space');
  }
}

test('a clean standard Crystal Cascade run can win with ordinary run and jump input', async ({
  page,
}) => {
  test.setTimeout(100_000);
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .activeScenes.includes('TitleScene');
  });

  await page.evaluate((courseId) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    diagnostics?.selectRaceCourse(courseId);
    diagnostics?.startScene('RaceScene');
  }, CRYSTAL_CASCADE_RACE_ID);

  await waitForRaceState(page, (state) => state.raceStarted === true, RACE_START_TIMEOUT_MS);
  await page.keyboard.down('ArrowRight');

  try {
    for (const jumpProgress of CLEAN_JUMP_PROGRESS) {
      await jumpAtProgress(page, jumpProgress);
    }

    await waitForRaceState(page, (state) => state.raceFinished === true);
  } finally {
    await page.keyboard.up('ArrowRight');
  }
  await page.waitForTimeout(420);

  const race = await page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'RaceScene');
  });

  expect(race?.state.raceHitObstacleCount).toBe(0);
  expect(race?.state.raceUsedShortcutCount).toBe(0);
  expect(race?.state.racePlayerFinishPlace).toBe(1);
  expect(race?.objects.some((object) => object.text?.includes('You finished 1st!'))).toBe(true);
});
