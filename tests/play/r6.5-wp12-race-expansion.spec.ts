import { expect, test, type Page } from '@playwright/test';

const PETAL_PARADE_RACE_ID = 'race-course:rainbow-meadow-petal-parade';
const MOONCAP_TRAIL_RACE_ID = 'race-course:whispering-woods-mooncap-trail';
const SHORELINE_SURGE_RACE_ID = 'race-course:starlight-beach-shoreline-surge';

interface DiagnosticObject {
  name: string;
  text: string | null;
  interactive: boolean;
  visible: boolean;
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
  selectRaceCourse(courseId: string): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.goto('/?diagnostics=1');
  await page.waitForFunction(() =>
    Boolean(
      (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__,
    ),
  );
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are not installed.');
    }
    diagnostics.startScene(key);
  }, sceneKey);
  await page.waitForFunction((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(key) ?? false;
  }, sceneKey);
}

async function startRace(page: Page, courseId: string): Promise<void> {
  await page.evaluate((id) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are not installed.');
    }
    diagnostics.selectRaceCourse(id);
    diagnostics.startScene('RaceScene');
  }, courseId);
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes('RaceScene') ?? false;
  });
  await page.waitForFunction((id) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const race = diagnostics?.snapshot().scenes.find(({ key }) => key === 'RaceScene');
    return race?.objects.some(({ name }) => name === `r6.5-wp12-race-theme:${id}`) ?? false;
  }, courseId);
}

async function sceneSnapshot(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  return page.evaluate((key) => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = diagnostics?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing diagnostics for ${key}.`);
    }
    return scene;
  }, sceneKey);
}

test('WP12 exposes coherent regional race and Cup entry points', async ({ page }) => {
  await waitForDiagnostics(page);

  await startScene(page, 'RainbowMeadowScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = diagnostics?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return (
      meadow?.objects.some(({ name }) => name === 'r6.5-wp12-race-entry:petal-parade') &&
      meadow.objects.some(({ name }) => name === 'r6.5-wp12-race-entry:rainbow-cup')
    );
  });
  const meadow = await sceneSnapshot(page, 'RainbowMeadowScene');
  expect(meadow.objects.some(({ name }) => name === 'r6.5-wp12-race-entry:petal-parade')).toBe(true);
  expect(meadow.objects.some(({ name }) => name === 'r6.5-wp12-race-entry:rainbow-cup')).toBe(true);

  await startScene(page, 'WhisperingWoodsScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const woods = diagnostics?.snapshot().scenes.find(({ key }) => key === 'WhisperingWoodsScene');
    return woods?.objects.some(({ name }) => name === 'r6.5-wp12-race-entry:mooncap-trail') ?? false;
  });

  await startScene(page, 'StarlightBeachScene');
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const beach = diagnostics?.snapshot().scenes.find(({ key }) => key === 'StarlightBeachScene');
    return woodsOrBeachHasEntry(beach?.objects, 'r6.5-wp12-race-entry:shoreline-surge');

    function woodsOrBeachHasEntry(objects: DiagnosticObject[] | undefined, name: string): boolean {
      return objects?.some((object) => object.name === name) ?? false;
    }
  });
});

test('WP12 new courses reuse shared RaceScene controls and receive distinct themes', async ({ page }) => {
  await waitForDiagnostics(page);

  const courses = [
    [PETAL_PARADE_RACE_ID, 'Petal Parade'],
    [MOONCAP_TRAIL_RACE_ID, 'Mooncap Trail'],
    [SHORELINE_SURGE_RACE_ID, 'Shoreline Surge'],
  ] as const;

  for (const [courseId, courseName] of courses) {
    await startRace(page, courseId);
    const race = await sceneSnapshot(page, 'RaceScene');
    expect(race.objects.some(({ name }) => name === `r6.5-wp12-race-theme:${courseId}`)).toBe(true);
    expect(race.objects.some(({ text }) => text?.includes(courseName))).toBe(true);
    expect(race.objects.some(({ name }) => name === 'race-assistance-control')).toBe(true);
    expect(race.objects.some(({ name, interactive }) => name === 'race-assistance-toggle' && interactive)).toBe(true);
  }
});

test('WP12 Mooncap Trail visibly exposes its Root Hop shortcut route', async ({ page }) => {
  await waitForDiagnostics(page);
  await startRace(page, MOONCAP_TRAIL_RACE_ID);
  const race = await sceneSnapshot(page, 'RaceScene');
  expect(race.objects.some(({ text }) => text?.includes('ROOT HOP'))).toBe(true);
  expect(race.objects.some(({ text }) => text?.includes('Jump into the glowing route'))).toBe(true);
});
