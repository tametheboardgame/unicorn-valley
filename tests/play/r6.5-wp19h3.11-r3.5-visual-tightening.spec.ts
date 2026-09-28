import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  x: number;
  y: number;
  depth: number;
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
}

async function gladeSnapshot(page: Page): Promise<DiagnosticScene> {
  const snapshot = await page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.snapshot();
  });
  const glade = snapshot.scenes.find(({ key }) => key === 'MoonflowerGladeScene');
  if (!glade) {
    throw new Error('Missing Moonflower Glade diagnostics.');
  }
  return glade;
}

test('R3.5 keeps the Glade to Village route visually open while preserving direction signage', async ({
  page,
}) => {
  await page.goto('/?scene=glade&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const glade = api?.snapshot().scenes.find(({ key }) => key === 'MoonflowerGladeScene');
    return glade?.objects.some(
      ({ name, visible }) => name === 'moonflower-glade:sunbeam-direction-sign' && visible,
    );
  });

  const glade = await gladeSnapshot(page);
  expect(
    glade.objects.some(
      ({ name, visible }) => name === 'moonflower-glade:sunbeam-direction-sign' && visible,
    ),
  ).toBe(true);

  expect(
    glade.objects.filter(
      ({ name, visible, x, y }) =>
        name === 'world-traversal-polish-detail' &&
        visible &&
        Math.abs(x - 2680) <= 180 &&
        Math.abs(y - 900) <= 220,
    ),
  ).toEqual([]);

  expect(
    glade.objects.filter(
      ({ type, visible, x, y, depth }) =>
        visible &&
        (type === 'Rectangle' || type === 'Ellipse') &&
        Math.abs(depth - 8) < 0.01 &&
        Math.abs(x - 2680) <= 100 &&
        Math.abs(y - 900) <= 120,
    ),
  ).toEqual([]);
});
