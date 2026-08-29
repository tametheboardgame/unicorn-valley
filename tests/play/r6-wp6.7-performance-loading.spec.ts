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

test('production world transitions stay responsive and avoid severe frame hitches', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'MoonflowerGladeScene');

  const initial = await measureSettledPerformance(page);
  expect(initial.sampleCount).toBeGreaterThanOrEqual(MIN_PERFORMANCE_SAMPLES);
  expect(initial.p95FrameMs).toBeLessThan(120);

  for (const sceneKey of ['SunbeamVillageScene', 'RainbowMeadowScene', 'CrystalBrookScene']) {
    const transition = await measureTransition(page, sceneKey);
    expect(transition.elapsedMs, `${sceneKey} transition took too long`).toBeLessThan(1000);
    expect(
      transition.performance.worstFrameMs,
      `${sceneKey} transition produced a severe frame hitch`,
    ).toBeLessThan(500);

    const profile = await measureSettledPerformance(page);
    expect(profile.sampleCount).toBeGreaterThanOrEqual(MIN_PERFORMANCE_SAMPLES);
    expect(profile.p95FrameMs).toBeLessThan(120);
    expect(profile.worstFrameMs).toBeLessThan(500);
  }
});
