import { expect, test } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  visible: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface BrowserDiagnosticsApi {
  snapshot(): { scenes: DiagnosticScene[] };
}

test('H4.3/H4.4 retain one canonical Meadow road network through the recomposed junction', async ({
  page,
}) => {
  await page.goto('/?scene=meadow&diagnostics=1');

  await page.waitForFunction(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return meadow?.objects.some(
      ({ name, visible }) => name === 'rainbow-meadow:path-network' && visible,
    );
  });

  const objects = await page.evaluate(() => {
    const api = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    if (!meadow) {
      throw new Error('Missing Rainbow Meadow diagnostics.');
    }
    return meadow.objects;
  });

  const pathNetworks = objects.filter(
    ({ name, visible }) => name === 'rainbow-meadow:path-network' && visible,
  );
  expect(pathNetworks).toHaveLength(1);

  const network = pathNetworks[0];
  expect(network?.type).toBe('Graphics');
  expect(network?.displayWidth ?? 0).toBeGreaterThan(3000);
  expect(network?.displayHeight ?? 0).toBeGreaterThan(900);

  expect(objects.some(({ name }) => name === 'exploration-path-polish')).toBe(false);
  expect(objects.some(({ name }) => name === 'r6-wp6.18g:meadow-crystal-brook:path')).toBe(false);
  expect(
    objects.some(({ name }) => name === 'r6-region-gateway-art:meadow-crystal-brook:path'),
  ).toBe(false);

  expect(
    objects.some(({ name, visible }) => name === 'world-traversal-polish-detail' && visible),
  ).toBe(true);
});
