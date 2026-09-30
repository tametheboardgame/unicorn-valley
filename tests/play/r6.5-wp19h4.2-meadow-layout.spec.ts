import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): { scenes: DiagnosticScene[] };
}

async function meadowObjects(page: Page): Promise<DiagnosticObject[]> {
  const snapshot = await page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return api.snapshot();
  });
  const meadow = snapshot.scenes.find(({ key }) => key === 'RainbowMeadowScene');
  if (!meadow) {
    throw new Error('Missing Rainbow Meadow diagnostics.');
  }
  return meadow.objects;
}

test('H4.2 composes distinct Meadow districts and clears future activity space', async ({
  page,
}) => {
  await page.goto('/?scene=meadow&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return Boolean(
      meadow?.objects.some(({ name }) => name === 'rainbow-meadow:district:rainbow-disc-lawn') &&
        meadow.objects.some(({ name }) => name === 'rainbow-meadow:district:picnic-hill-reserve') &&
        meadow.objects.some(
          ({ name }) => name === 'rainbow-meadow:district:crystal-brook-corridor',
        ) &&
        meadow.objects.some(({ name }) => name === 'meadow-depth:flower-circle'),
    );
  });

  const objects = await meadowObjects(page);
  const expectedDistricts = [
    ['sunbeam-arrival', 430, 1050],
    ['north-nature', 1450, 580],
    ['rainbow-disc-lawn', 700, 1640],
    ['picnic-hill-reserve', 1740, 1660],
    ['rainbow-run', 2700, 1010],
    ['crystal-brook-corridor', 2980, 1780],
  ] as const;

  for (const [id, x, y] of expectedDistricts) {
    const district = objects.find(({ name }) => name === `rainbow-meadow:district:${id}`);
    expect(district).toBeDefined();
    expect(district?.visible).toBe(true);
    expect(district?.x).toBeCloseTo(x, 0);
    expect(district?.y).toBeCloseTo(y, 0);
  }

  for (const [name, x, y] of [
    ['meadow-depth:flower-circle', 500, 650],
    ['meadow-depth:butterfly-parade', 780, 800],
    ['meadow-depth:petal-patch', 1030, 650],
  ] as const) {
    const feature = objects.find((candidate) => candidate.name === name);
    expect(feature).toBeDefined();
    expect(feature?.x).toBeCloseTo(x, 0);
    expect(feature?.y).toBeCloseTo(y, 0);
  }

  const trees = objects.filter(({ name }) => name.startsWith('rainbow-meadow:tree:'));
  expect(trees).toHaveLength(8);
  expect(
    trees.some(
      ({ x, y }) =>
        ((x - 700) / 500) ** 2 + ((y - 1640) / 300) ** 2 <= 1 ||
        ((x - 2980) / 350) ** 2 + ((y - 1780) / 220) ** 2 <= 1,
    ),
  ).toBe(false);
});
