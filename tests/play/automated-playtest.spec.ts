import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface DiagnosticObjectSnapshot {
  type: string;
  name: string;
  text: string | null;
  textureKey: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  depth: number;
  alpha: number;
  visible: boolean;
  active: boolean;
  scrollFactorX: number;
  scrollFactorY: number;
  interactive: boolean;
}

interface DiagnosticSceneSnapshot {
  key: string;
  camera: {
    scrollX: number;
    scrollY: number;
    width: number;
    height: number;
    worldX: number;
    worldY: number;
    worldWidth: number;
    worldHeight: number;
  };
  objects: DiagnosticObjectSnapshot[];
}

interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface PlaytestFinding {
  severity: 'error' | 'warning' | 'suggestion';
  scene: string;
  message: string;
}

interface PlaytestResult {
  scenario: string;
  passed: boolean;
  findings: PlaytestFinding[];
  screenshot?: string;
}

const ARTIFACT_ROOT = 'playtest-artifacts';
const SCREENSHOT_ROOT = join(ARTIFACT_ROOT, 'screenshots');
const report: PlaytestResult[] = [];

async function getSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: { snapshot(): BrowserDiagnosticSnapshot };
    };
    const diagnostics = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction(
    (expectedScene) => {
      const diagnosticWindow = window as typeof window & {
        __UNICORN_VALLEY_DIAGNOSTICS__?: {
          snapshot(): BrowserDiagnosticSnapshot;
        };
      };
      return diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes(expectedScene);
    },
    sceneKey,
  );
  await page.waitForTimeout(350);
}

function getScene(snapshot: BrowserDiagnosticSnapshot, sceneKey: string): DiagnosticSceneSnapshot {
  const scene = snapshot.scenes.find((candidate) => candidate.key === sceneKey);
  if (!scene) {
    throw new Error(`Expected active scene ${sceneKey}, got ${snapshot.activeScenes.join(', ')}`);
  }
  return scene;
}

function getPlayer(scene: DiagnosticSceneSnapshot): DiagnosticObjectSnapshot | null {
  const candidates = scene.objects.filter((object) => object.textureKey?.startsWith('player-unicorn-'));
  if (candidates.length === 0) {
    return null;
  }
  return candidates.sort((left, right) => right.depth - left.depth)[0];
}

function auditScene(
  snapshot: BrowserDiagnosticSnapshot,
  scene: DiagnosticSceneSnapshot,
  options: { requirePlayer?: boolean } = {},
): PlaytestFinding[] {
  const findings: PlaytestFinding[] = [];
  const player = getPlayer(scene);

  if (options.requirePlayer && !player) {
    findings.push({ severity: 'error', scene: scene.key, message: 'No player sprite was found.' });
  }

  if (player) {
    if (!player.visible || !player.active || player.alpha < 0.2) {
      findings.push({
        severity: 'error',
        scene: scene.key,
        message: 'Player exists but is invisible, inactive or effectively transparent.',
      });
    }

    if (
      player.displayWidth < 40 ||
      player.displayHeight < 35 ||
      player.displayWidth > 220 ||
      player.displayHeight > 190
    ) {
      findings.push({
        severity: 'warning',
        scene: scene.key,
        message: `Player display size looks unusual (${player.displayWidth.toFixed(0)}×${player.displayHeight.toFixed(0)}).`,
      });
    }

    const camera = scene.camera;
    const cameraPadding = 120;
    if (
      player.x < camera.worldX - cameraPadding ||
      player.x > camera.worldX + camera.worldWidth + cameraPadding ||
      player.y < camera.worldY - cameraPadding ||
      player.y > camera.worldY + camera.worldHeight + cameraPadding
    ) {
      findings.push({
        severity: 'error',
        scene: scene.key,
        message: 'Player is outside the followed camera view.',
      });
    }

    const suspiciousForeground = scene.objects.filter(
      (object) =>
        object.visible &&
        object.alpha > 0.65 &&
        object.depth > player.depth &&
        object.displayWidth > snapshot.width * 0.8 &&
        object.displayHeight > snapshot.height * 0.55,
    );
    if (suspiciousForeground.length > 0) {
      findings.push({
        severity: 'error',
        scene: scene.key,
        message: `Large foreground object(s) sit above the player: ${suspiciousForeground.map((object) => object.type).join(', ')}. This can hide the unicorn behind the map.`,
      });
    }
  }

  const fixedObjects = scene.objects.filter(
    (object) =>
      object.visible &&
      object.alpha > 0.05 &&
      object.scrollFactorX === 0 &&
      object.scrollFactorY === 0 &&
      object.displayWidth > 0 &&
      object.displayHeight > 0,
  );
  const offscreenFixedObjects = fixedObjects.filter(
    (object) =>
      object.x + object.displayWidth / 2 < -30 ||
      object.x - object.displayWidth / 2 > snapshot.width + 30 ||
      object.y + object.displayHeight / 2 < -30 ||
      object.y - object.displayHeight / 2 > snapshot.height + 30,
  );
  if (offscreenFixedObjects.length > 0) {
    findings.push({
      severity: 'warning',
      scene: scene.key,
      message: `${offscreenFixedObjects.length} fixed UI object(s) are entirely outside the game viewport.`,
    });
  }

  const zeroSizeInteractive = scene.objects.filter(
    (object) => object.visible && object.interactive && (object.displayWidth <= 1 || object.displayHeight <= 1),
  );
  if (zeroSizeInteractive.length > 0) {
    findings.push({
      severity: 'warning',
      scene: scene.key,
      message: `${zeroSizeInteractive.length} interactive object(s) have effectively zero display size; verify their hit areas remain intentional.`,
    });
  }

  if (scene.objects.length > 500) {
    findings.push({
      severity: 'suggestion',
      scene: scene.key,
      message: `Scene contains ${scene.objects.length} live game objects; consider pooling or simplifying decorative objects if performance drops on tablets.`,
    });
  }

  return findings;
}

async function captureScenario(
  page: Page,
  scenario: string,
  sceneKey: string,
  options: { requirePlayer?: boolean } = {},
): Promise<PlaytestFinding[]> {
  const snapshot = await getSnapshot(page);
  const scene = getScene(snapshot, sceneKey);
  const findings = auditScene(snapshot, scene, options);
  const screenshot = join(SCREENSHOT_ROOT, `${scenario}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  report.push({
    scenario,
    passed: !findings.some((finding) => finding.severity === 'error'),
    findings,
    screenshot,
  });
  return findings;
}

async function logicalClick(page: Page, logicalX: number, logicalY: number): Promise<void> {
  const snapshot = await getSnapshot(page);
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  await page.mouse.click(
    bounds.x + (logicalX / snapshot.width) * bounds.width,
    bounds.y + (logicalY / snapshot.height) * bounds.height,
  );
}

async function playerPosition(
  page: Page,
  sceneKey: string,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const snapshot = await getSnapshot(page);
  const player = getPlayer(getScene(snapshot, sceneKey));
  if (!player) {
    throw new Error(`No player found in ${sceneKey}.`);
  }
  return { x: player.x, y: player.y, width: player.displayWidth, height: player.displayHeight };
}

function writeReport(): void {
  const summary = {
    generatedAt: new Date().toISOString(),
    scenarios: report,
    errorCount: report.flatMap((entry) => entry.findings).filter((item) => item.severity === 'error')
      .length,
    warningCount: report
      .flatMap((entry) => entry.findings)
      .filter((item) => item.severity === 'warning').length,
    suggestionCount: report
      .flatMap((entry) => entry.findings)
      .filter((item) => item.severity === 'suggestion').length,
  };
  writeFileSync(join(ARTIFACT_ROOT, 'playtest-report.json'), `${JSON.stringify(summary, null, 2)}\n`);
}

test.describe.serial('Unicorn Valley automated playtest', () => {
  test.beforeAll(() => {
    rmSync(ARTIFACT_ROOT, { recursive: true, force: true });
    mkdirSync(SCREENSHOT_ROOT, { recursive: true });
  });

  test.afterAll(() => {
    writeReport();
  });

  const worldScenes = [
    ['glade', 'MoonflowerGladeScene'],
    ['cottage', 'CottageInteriorScene'],
    ['village', 'SunbeamVillageScene'],
    ['meadow', 'RainbowMeadowScene'],
  ] as const;

  for (const [alias, sceneKey] of worldScenes) {
    test(`${sceneKey} renders a visible playable unicorn`, async ({ page }) => {
      const browserErrors: string[] = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));
      await page.goto(`/?scene=${alias}&diagnostics=1`);
      await waitForScene(page, sceneKey);
      const findings = await captureScenario(page, alias, sceneKey, { requirePlayer: true });

      expect(browserErrors, `Browser errors in ${sceneKey}`).toEqual([]);
      expect(findings.filter((finding) => finding.severity === 'error')).toEqual([]);
    });
  }

  test('captures the main non-world interfaces for visual review', async ({ page }) => {
    const states = [
      ['title', '/', 'TitleScene'],
      ['creator', '/?scene=creator&diagnostics=1', 'UnicornCreatorScene'],
      ['nova-story', '/?scene=nova-story&diagnostics=1', 'NovaStoryScene'],
    ] as const;

    for (const [name, url, sceneKey] of states) {
      const target = url.includes('?') ? url : `${url}?diagnostics=1`;
      await page.goto(target);
      await waitForScene(page, sceneKey);
      const findings = await captureScenario(page, name, sceneKey);
      expect(findings.filter((finding) => finding.severity === 'error')).toEqual([]);
    }
  });

  test('Nova first run requires active movement, supports jumping and exits cleanly', async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.goto('/?scene=nova-race&diagnostics=1');
    await waitForScene(page, 'NovaTutorialRaceScene');

    await page.waitForTimeout(4_000);
    const idleStart = await playerPosition(page, 'NovaTutorialRaceScene');
    await page.waitForTimeout(800);
    const idleEnd = await playerPosition(page, 'NovaTutorialRaceScene');
    expect(Math.abs(idleEnd.x - idleStart.x), 'No input should not move the racer').toBeLessThan(3);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(900);
    const running = await playerPosition(page, 'NovaTutorialRaceScene');
    expect(running.x - idleEnd.x, 'Holding Right should move the racer').toBeGreaterThan(35);

    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(500);
    const stopped = await playerPosition(page, 'NovaTutorialRaceScene');
    expect(Math.abs(stopped.x - running.x), 'Releasing Right should stop forward progress').toBeLessThan(4);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);
    const beforeJump = await playerPosition(page, 'NovaTutorialRaceScene');
    await page.keyboard.press('Space');
    await page.waitForTimeout(130);
    const duringJump = await playerPosition(page, 'NovaTutorialRaceScene');
    expect(duringJump.y, 'SPACE should visibly lift the racer').toBeLessThan(beforeJump.y - 3);

    let finished = false;
    for (let step = 0; step < 65; step += 1) {
      if (step % 2 === 0) {
        await page.keyboard.press('Space');
      }
      await page.waitForTimeout(300);
      const snapshot = await getSnapshot(page);
      const race = getScene(snapshot, 'NovaTutorialRaceScene');
      finished = race.objects.some((object) => object.text?.startsWith('First run complete'));
      if (finished) {
        break;
      }
    }
    await page.keyboard.up('ArrowRight');
    expect(finished, 'Tutorial race should be finishable by an automated child-like run').toBe(true);

    const resultFindings = await captureScenario(
      page,
      'nova-race-finished',
      'NovaTutorialRaceScene',
      { requirePlayer: true },
    );
    expect(resultFindings.filter((finding) => finding.severity === 'error')).toEqual([]);

    const snapshot = await getSnapshot(page);
    await logicalClick(page, snapshot.width / 2, snapshot.height / 2 + 137);
    await waitForScene(page, 'NovaStoryScene');
    await captureScenario(page, 'nova-post-race', 'NovaStoryScene');

    expect(browserErrors, 'Browser errors during the full tutorial race').toEqual([]);
  });

  test('Sunrise Sprint also obeys manual forward control', async ({ page }) => {
    await page.goto('/?scene=race&diagnostics=1');
    await waitForScene(page, 'RaceScene');
    await page.waitForTimeout(4_000);

    const idleStart = await playerPosition(page, 'RaceScene');
    await page.waitForTimeout(700);
    const idleEnd = await playerPosition(page, 'RaceScene');
    expect(Math.abs(idleEnd.x - idleStart.x)).toBeLessThan(3);

    await page.keyboard.down('KeyD');
    await page.waitForTimeout(800);
    const running = await playerPosition(page, 'RaceScene');
    await page.keyboard.up('KeyD');
    expect(running.x - idleEnd.x).toBeGreaterThan(30);

    const findings = await captureScenario(page, 'sunrise-sprint', 'RaceScene', {
      requirePlayer: true,
    });
    expect(findings.filter((finding) => finding.severity === 'error')).toEqual([]);
  });
});
