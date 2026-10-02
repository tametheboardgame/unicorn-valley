import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  visible: boolean;
  effectiveVisible: boolean;
  x: number;
  y: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticsApi {
  snapshot(): { activeScenes: string[]; scenes: DiagnosticScene[] };
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
  startScene(sceneKey: string, data?: object): void | Promise<void>;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function snapshotScene(page: Page, sceneKey: string): Promise<DiagnosticScene> {
  return page.evaluate((key) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing diagnostics for ${key}.`);
    }
    return scene;
  }, sceneKey);
}

async function setPlayerPosition(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ targetX, targetY }) => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) throw new Error('Browser diagnostics are unavailable.');
      api.setArcadeSpritePosition('RainbowMeadowScene', 'world-player-unicorn', targetX, targetY);
    },
    { targetX: x, targetY: y },
  );
}

test('H4.8 nature features use physical affordances instead of permanent hotspot markers', async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);

  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return meadow?.objects.some(
      ({ name, effectiveVisible }) =>
        name === 'meadow-depth:windmill-bell-physical' && effectiveVisible,
    );
  });

  const meadow = await snapshotScene(page, 'RainbowMeadowScene');
  for (const name of [
    'meadow-depth:windmill-landmark',
    'meadow-depth:windmill-sails',
    'meadow-depth:windmill-lookout-sign',
    'meadow-depth:windmill-bell-physical',
    'meadow-depth:wind-ribbon-fence',
    'meadow-depth:wind-ribbon-physical',
    'meadow-depth:windmill-base-details',
    'meadow-depth:flower-circle-physical',
    'meadow-depth:petal-patch-physical',
    'meadow-depth:butterfly-parade-physical',
    'rainbow-meadow:nature:pond',
    'rainbow-meadow:nature:pond-reeds',
    'rainbow-meadow:discovery:prism-bloom',
    'rainbow-meadow:discovery:sunshower-feather',
  ]) {
    expect(
      meadow.objects.some((object) => object.name === name && object.effectiveVisible),
      `${name} visible`,
    ).toBe(true);
  }

  const interactionAnchors = meadow.objects.filter(({ name }) =>
    [
      'meadow-depth:windmill-story',
      'meadow-depth:windmill-bell',
      'meadow-depth:windmill-lookout',
      'meadow-depth:rainbow-pond',
      'meadow-depth:petal-patch',
      'meadow-depth:flower-circle',
      'meadow-depth:butterfly-parade',
    ].includes(name),
  );
  expect(interactionAnchors.length).toBe(7);
  expect(interactionAnchors.every(({ effectiveVisible }) => !effectiveVisible)).toBe(true);

  const permanentMarkerGlyphs = new Set(['🎐', '🔔', '🌬️', '🐸', '🧺', '🌸', '🌼', '🦋', '🪶']);
  expect(
    meadow.objects.some(
      ({ text, effectiveVisible }) =>
        effectiveVisible && text !== null && permanentMarkerGlyphs.has(text.trim()),
    ),
  ).toBe(false);

  await setPlayerPosition(page, 1570, 850);
  await expect
    .poll(async () => {
      const current = await snapshotScene(page, 'RainbowMeadowScene');
      return current.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt' && effectiveVisible,
      );
    })
    .toBe(true);
});

test('H4.8 Windmill Lookout uses physical chimes and glint cues', async ({ page }) => {
  await page.goto('/?diagnostics=1');
  await waitForDiagnostics(page);

  await page.evaluate(async () => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Browser diagnostics are unavailable.');
    await api.startScene('WindmillLookoutScene');
  });

  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes('WindmillLookoutScene') === true;
  });

  const lookout = await snapshotScene(page, 'WindmillLookoutScene');
  const chimes = lookout.objects.find(({ name }) => name === 'windmill-lookout:chimes');
  const glint = lookout.objects.find(({ name }) => name === 'windmill-lookout:sky-glint');
  expect(chimes?.type).toBe('Graphics');
  expect(glint?.type).toBe('Rectangle');
  expect(
    lookout.objects.some(
      ({ text, effectiveVisible }) =>
        effectiveVisible &&
        ['♫', '✦', '🌬️ Windmill Lookout', '🌿 Rainbow Meadow'].includes(text ?? ''),
    ),
  ).toBe(false);
});
