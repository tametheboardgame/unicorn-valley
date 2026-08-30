import { expect, test, type Page } from '@playwright/test';

const CRYSTAL_CASCADE_RACE_ID = 'race-course:crystal-brook-crystal-cascade';
const RACE_CONDITION_TIMEOUT_MS = 15_000;
const RACE_START_TIMEOUT_MS = 30_000;
const CLEAN_JUMP_PROGRESS = [490, 1290, 2000, 2930] as const;

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

async function runBrowserTimedJumpSequence(page: Page): Promise<void> {
  await page.evaluate(async (jumpProgresses) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable for Crystal Cascade input validation.');
    }

    const nextFrame = (): Promise<void> =>
      new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const dispatchSpace = (type: 'keydown' | 'keyup'): void => {
      const event = new KeyboardEvent(type, {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'keyCode', { value: 32 });
      Object.defineProperty(event, 'which', { value: 32 });
      globalThis.dispatchEvent(event);
    };

    for (const targetProgress of jumpProgresses) {
      while (true) {
        const state = diagnostics.sceneState('RaceScene');
        if (!state || state.raceFinished === true) {
          throw new Error(`Race ended before jump target ${targetProgress}.`);
        }
        if (
          state.raceProgress !== null &&
          state.raceProgress >= targetProgress &&
          state.raceGrounded === true
        ) {
          break;
        }
        await nextFrame();
      }

      dispatchSpace('keydown');
      while (diagnostics.sceneState('RaceScene')?.raceGrounded !== false) {
        await nextFrame();
      }
      dispatchSpace('keyup');
    }
  }, CLEAN_JUMP_PROGRESS);
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
    await runBrowserTimedJumpSequence(page);
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
