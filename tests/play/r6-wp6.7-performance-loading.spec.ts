import { expect, test, type Page } from '@playwright/test';

interface FramePerformanceSnapshot {
  sampleCount: number;
  averageFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  longFrameCount: number;
}

interface TransitionMeasurement {
  elapsedMs: number;
  performance: FramePerformanceSnapshot;
}

interface BrowserDiagnosticsApi {
  snapshot(): { activeScenes: string[] };
  performance(): FramePerformanceSnapshot;
  resetPerformance(): void;
  startScene(sceneKey: string, data?: object): void;
}

const MIN_PERFORMANCE_SAMPLES = 60;
const PERFORMANCE_SAMPLE_TIMEOUT_MS = 15_000;
const NORMAL_P95_BUDGET_MS = 120;
const SEVERE_P95_CEILING_MS = 180;
const SLOW_RUNNER_DEGRADATION_FACTOR = 1.35;

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return Boolean(diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__);
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

async function waitForPerformanceSamples(
  page: Page,
  minimumSamples = MIN_PERFORMANCE_SAMPLES,
): Promise<FramePerformanceSnapshot> {
  await page.waitForFunction(
    (minimum) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      };
      return (
        (diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.performance().sampleCount ?? 0) >= minimum
      );
    },
    minimumSamples,
    { timeout: PERFORMANCE_SAMPLE_TIMEOUT_MS },
  );

  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const profile = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.performance();
    if (!profile) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return profile;
  });
}

async function measureTransition(page: Page, sceneKey: string): Promise<TransitionMeasurement> {
  const startedAt = await page.evaluate((targetScene) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    diagnostics.resetPerformance();
    const start = performance.now();
    diagnostics.startScene(targetScene);
    return start;
  }, sceneKey);

  await waitForScene(page, sceneKey);
  return page.evaluate((start) => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return {
      elapsedMs: performance.now() - start,
      performance: diagnostics.performance(),
    };
  }, startedAt);
}

async function measureSettledPerformance(page: Page): Promise<FramePerformanceSnapshot> {
  await page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.resetPerformance();
  });
  return waitForPerformanceSamples(page);
}

function settledP95Ceiling(initialP95FrameMs: number): number {
  return Math.min(
    SEVERE_P95_CEILING_MS,
    Math.max(NORMAL_P95_BUDGET_MS, initialP95FrameMs * SLOW_RUNNER_DEGRADATION_FACTOR),
  );
}

test('production world transitions stay responsive and avoid severe frame hitches', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'MoonflowerGladeScene');

  const initial = await measureSettledPerformance(page);
  expect(initial.sampleCount).toBeGreaterThanOrEqual(MIN_PERFORMANCE_SAMPLES);
  expect(initial.p95FrameMs, 'runner baseline is severely slow').toBeLessThan(SEVERE_P95_CEILING_MS);
  expect(initial.worstFrameMs).toBeLessThan(500);
  const p95Ceiling = settledP95Ceiling(initial.p95FrameMs);

  for (const sceneKey of ['SunbeamVillageScene', 'RainbowMeadowScene', 'CrystalBrookScene']) {
    const transition = await measureTransition(page, sceneKey);
    expect(transition.elapsedMs, `${sceneKey} transition took too long`).toBeLessThan(1000);
    expect(
      transition.performance.worstFrameMs,
      `${sceneKey} transition produced a severe frame hitch`,
    ).toBeLessThan(500);

    const profile = await measureSettledPerformance(page);
    expect(profile.sampleCount).toBeGreaterThanOrEqual(MIN_PERFORMANCE_SAMPLES);
    expect(
      profile.p95FrameMs,
      `${sceneKey} settled p95 regressed beyond the runner baseline`,
    ).toBeLessThan(p95Ceiling);
    expect(profile.worstFrameMs).toBeLessThan(500);
  }
});
