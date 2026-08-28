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
  await page.waitForTimeout(750);
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

test('production world transitions stay responsive and avoid severe frame hitches', async ({
  page,
}) => {
  test.setTimeout(45_000);
  await page.goto('/?scene=glade&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForScene(page, 'MoonflowerGladeScene');
  await page.waitForTimeout(650);

  const initial = await page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.performance();
  });
  expect(initial?.sampleCount).toBeGreaterThan(15);
  expect(initial?.p95FrameMs ?? Number.POSITIVE_INFINITY).toBeLessThan(120);

  for (const sceneKey of ['SunbeamVillageScene', 'RainbowMeadowScene', 'CrystalBrookScene']) {
    const transition = await measureTransition(page, sceneKey);
    expect(transition.elapsedMs, `${sceneKey} transition took too long`).toBeLessThan(1000);
    expect(
      transition.performance.worstFrameMs,
      `${sceneKey} transition produced a severe frame hitch`,
    ).toBeLessThan(500);

    const profile = await measureSettledPerformance(page);
    expect(profile.sampleCount).toBeGreaterThan(15);
    expect(profile.p95FrameMs).toBeLessThan(120);
    expect(profile.worstFrameMs).toBeLessThan(500);
  }
});
