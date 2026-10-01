import { expect, test, type Page } from '@playwright/test';

const RAINBOW_MEADOW_NOVA_X = 2470;
const RAINBOW_MEADOW_NOVA_Y = 930;

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
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

interface DiagnosticSnapshot {
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
}

async function meadowSnapshot(page: Page): Promise<DiagnosticScene> {
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
  return meadow;
}

test('H4.1 leaves one Meadow path owner and one production Nova', async ({ page }) => {
  await page.goto('/?scene=meadow&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return Boolean(
      meadow?.objects.some(({ name }) => name === 'core-npc:nova:world') &&
        meadow.objects.some(({ name }) => name === 'rainbow-meadow:path-network'),
    );
  });

  const meadow = await meadowSnapshot(page);

  expect(meadow.objects.some(({ name }) => name === 'core-npc:nova:world')).toBe(true);
  expect(meadow.objects.some(({ name }) => name === 'nova-canonical-world')).toBe(false);

  const legacyNovaContainers = meadow.objects.filter(
    ({ type, name, x, y }) =>
      type === 'Container' &&
      name !== 'core-npc:nova:world' &&
      Math.abs(x - RAINBOW_MEADOW_NOVA_X) <= 2 &&
      Math.abs(y - RAINBOW_MEADOW_NOVA_Y) <= 12,
  );
  expect(legacyNovaContainers).toEqual([]);

  expect(meadow.objects.some(({ name }) => name === 'exploration-path-polish')).toBe(false);
  expect(
    meadow.objects.some(({ name }) => name === 'r6-region-gateway-art:meadow-crystal-brook:path'),
  ).toBe(false);
  expect(
    meadow.objects.some(
      ({ name }) => name === 'r6-region-gateway-art:meadow-crystal-brook:divider',
    ),
  ).toBe(false);
  expect(meadow.objects.some(({ name }) => name === 'r6-wp6.18g:meadow-crystal-brook:path')).toBe(
    false,
  );

  const oldWestGate = meadow.objects.find(
    ({ type, x, y, displayWidth, displayHeight }) =>
      type === 'Rectangle' &&
      Math.abs(x - 125) <= 2 &&
      Math.abs(y - 1050) <= 2 &&
      Math.abs(displayWidth - 110) <= 2 &&
      Math.abs(displayHeight - 370) <= 2,
  );
  expect(oldWestGate).toBeUndefined();
});
