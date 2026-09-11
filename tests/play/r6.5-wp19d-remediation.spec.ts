import { expect, type Page, test } from '@playwright/test';

const WORLD_PLAYER_NAME = 'world-player-unicorn';

interface DiagnosticObjectSnapshot {
  name: string;
  text: string | null;
  x: number;
  y: number;
  visible: boolean;
  interactive: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
}

interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function startScene(page: Page, sceneKey: string): Promise<void> {
  await page.evaluate((key) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    api.startScene(key);
  }, sceneKey);
  await page.waitForFunction((key) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) === true;
  }, sceneKey);
}

async function getScene(page: Page, sceneKey: string): Promise<DiagnosticSceneSnapshot> {
  return page.evaluate((key) => {
    const api = (
      window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
      }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find((candidate) => candidate.key === key);
    if (!scene) {
      throw new Error(`Missing diagnostic scene ${key}.`);
    }
    return scene;
  }, sceneKey);
}

async function positionPlayer(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ key, targetX, targetY }) => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      api.setArcadeSpritePosition(key, WORLD_PLAYER_NAME, targetX, targetY);
    },
    { key: sceneKey, targetX: x, targetY: y },
  );
}

function objectByName(scene: DiagnosticSceneSnapshot, name: string): DiagnosticObjectSnapshot {
  const object = scene.objects.find((candidate) => candidate.name === name);
  if (!object) {
    throw new Error(`Missing ${name} in ${scene.key}.`);
  }
  return object;
}

function player(scene: DiagnosticSceneSnapshot): DiagnosticObjectSnapshot {
  return objectByName(scene, WORLD_PLAYER_NAME);
}

async function waitForNamedObject(
  page: Page,
  sceneKey: string,
  predicate: (object: DiagnosticObjectSnapshot) => boolean,
): Promise<DiagnosticObjectSnapshot> {
  await expect
    .poll(async () => {
      const scene = await getScene(page, sceneKey);
      return scene.objects.find(predicate)?.name ?? null;
    })
    .not.toBeNull();
  const scene = await getScene(page, sceneKey);
  const object = scene.objects.find(predicate);
  if (!object) {
    throw new Error(`Expected object did not remain available in ${sceneKey}.`);
  }
  return object;
}

async function waitForTalkTarget(page: Page, sceneKey: string, label: string): Promise<void> {
  await expect
    .poll(async () => {
      const scene = await getScene(page, sceneKey);
      const action = scene.objects.find(
        (object) => object.name === 'exploration-interaction-prompt-label' && object.visible,
      );
      const hint = scene.objects.find(
        (object) => object.name === 'exploration-tablet-hint' && object.visible,
      );
      return `${action?.text ?? ''}|${hint?.text ?? ''}`;
    })
    .toBe(`Talk|${label}`);
}

function installFinePrimaryPointerOverride(): void {
  const nativeMatchMedia = window.matchMedia.bind(window);
  const finePrimaryPointer: MediaQueryList = {
    matches: false,
    media: '(pointer: coarse)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) =>
      query.trim() === '(pointer: coarse)' ? finePrimaryPointer : nativeMatchMedia(query),
  });
}

test.describe('R6.5-WP19D desktop control remediation', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: true });

  test('touchscreen laptop hides movement controls while core NPCs remain physical and actionable', async ({
    page,
  }) => {
    await page.addInitScript(installFinePrimaryPointerOverride);
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'MoonflowerGladeScene');
    await page.waitForTimeout(250);

    let scene = await getScene(page, 'MoonflowerGladeScene');
    expect(objectByName(scene, 'tablet-movement-pad').visible).toBe(false);
    expect(objectByName(scene, 'touch-movement-gallop').visible).toBe(false);

    const pip = await waitForNamedObject(
      page,
      'MoonflowerGladeScene',
      (object) => object.name === 'core-npc:pip:world',
    );
    await positionPlayer(page, 'MoonflowerGladeScene', pip.x, pip.y);
    await expect
      .poll(async () => {
        const current = await getScene(page, 'MoonflowerGladeScene');
        const currentPip = objectByName(current, 'core-npc:pip:world');
        const currentPlayer = player(current);
        return Math.hypot(currentPlayer.x - currentPip.x, currentPlayer.y - currentPip.y);
      })
      .toBeGreaterThanOrEqual(70);

    await positionPlayer(page, 'MoonflowerGladeScene', 840, 825);
    await waitForTalkTarget(page, 'MoonflowerGladeScene', 'Pip');
    scene = await getScene(page, 'MoonflowerGladeScene');
    expect(objectByName(scene, 'exploration-interaction-prompt').visible).toBe(true);
  });
});

test.describe('R6.5-WP19D interaction remediation', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false });

  test('supporting resident has physical separation and owns the lower speech area while engaged', async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'MoonflowerGladeScene');

    const resident = await waitForNamedObject(
      page,
      'MoonflowerGladeScene',
      (object) => object.name === 'supporting-resident:resident:juniper',
    );

    await positionPlayer(page, 'MoonflowerGladeScene', resident.x, resident.y);
    await expect
      .poll(async () => {
        const scene = await getScene(page, 'MoonflowerGladeScene');
        const currentResident = objectByName(scene, 'supporting-resident:resident:juniper');
        const currentPlayer = player(scene);
        return Math.hypot(currentPlayer.x - currentResident.x, currentPlayer.y - currentResident.y);
      })
      .toBeGreaterThanOrEqual(70);

    let scene = await getScene(page, 'MoonflowerGladeScene');
    const separatedResident = objectByName(scene, 'supporting-resident:resident:juniper');
    await positionPlayer(
      page,
      'MoonflowerGladeScene',
      separatedResident.x + 84,
      separatedResident.y,
    );
    await waitForTalkTarget(page, 'MoonflowerGladeScene', 'Juniper');

    await page.keyboard.press('KeyE');
    await expect
      .poll(async () => {
        const current = await getScene(page, 'MoonflowerGladeScene');
        return current.objects.some(
          (object) => object.name === 'wp19d-resident-conversation-panel' && object.visible,
        );
      })
      .toBe(true);

    scene = await getScene(page, 'MoonflowerGladeScene');
    const conversation = objectByName(scene, 'wp19d-resident-conversation-panel');
    expect(conversation.y).toBeGreaterThan(500);
    expect(objectByName(scene, 'exploration-location-title-panel').visible).toBe(true);
    expect(objectByName(scene, 'exploration-interaction-prompt').visible).toBe(false);
    expect(objectByName(scene, 'exploration-tablet-hint-panel').visible).toBe(false);

    const engagedResident = objectByName(scene, 'supporting-resident:resident:juniper');
    await page.waitForTimeout(450);
    scene = await getScene(page, 'MoonflowerGladeScene');
    const stillEngagedResident = objectByName(scene, 'supporting-resident:resident:juniper');
    expect(
      Math.hypot(
        stillEngagedResident.x - engagedResident.x,
        stillEngagedResident.y - engagedResident.y,
      ),
    ).toBeLessThan(1);

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(250);
    scene = await getScene(page, 'MoonflowerGladeScene');
    expect(
      scene.objects.some(
        (object) => object.name === 'wp19d-resident-conversation-panel' && object.visible,
      ),
    ).toBe(false);
  });

  test('Starlight Beach keeps the canonical HUD and discovery feedback out of the top chrome', async ({
    page,
  }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/?diagnostics=1');
    await waitForDiagnostics(page);
    await startScene(page, 'StarlightBeachScene');
    await page.waitForTimeout(350);

    let scene = await getScene(page, 'StarlightBeachScene');
    for (const name of [
      'exploration-shell-map-button',
      'exploration-shell-bag-button',
      'exploration-shell-book-button',
      'exploration-shell-settings-nav-button',
      'exploration-location-title-panel',
    ]) {
      expect(objectByName(scene, name).visible, name).toBe(true);
    }

    expect(
      scene.objects.some(
        (object) =>
          object.visible &&
          object.scrollFactorX === 0 &&
          object.y < 190 &&
          object.text === 'Follow the warm sand between Shell Cove, the Tide Pools and Star Dunes.',
      ),
    ).toBe(false);
    expect(
      scene.objects.some(
        (object) =>
          object.visible &&
          object.scrollFactorX === 0 &&
          object.y < 190 &&
          object.text?.startsWith('New place discovered!'),
      ),
    ).toBe(false);

    await positionPlayer(page, 'StarlightBeachScene', 820, 760);
    await expect
      .poll(async () => {
        const current = await getScene(page, 'StarlightBeachScene');
        return current.objects.find(
          (object) => object.visible && object.text === 'New discovery for your Wonderbook!',
        )?.y;
      })
      .toBeGreaterThan(450);

    scene = await getScene(page, 'StarlightBeachScene');
    expect(
      scene.objects.some(
        (object) =>
          object.visible &&
          object.scrollFactorX === 0 &&
          object.y < 190 &&
          (object.text?.startsWith('New discovery!') ?? false),
      ),
    ).toBe(false);
  });
});
