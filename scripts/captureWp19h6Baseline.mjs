import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.EVIDENCE_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = 'docs/evidence/wp19h6-baseline';
const sourceCommit = process.env.BASELINE_SOURCE_COMMIT ?? 'working-tree';

const displays = {
  desktop: { viewport: { width: 1440, height: 900 }, hasTouch: false },
  tablet: { viewport: { width: 1024, height: 768 }, hasTouch: true },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true },
};

const anchors = {
  west: { x: 420, y: 1090 },
  centre: { x: 1800, y: 1110 },
  cascade: { x: 2860, y: 850 },
  grotto: { x: 3020, y: 1710 },
};

await mkdir(outputDir, { recursive: true });

const performanceReport = JSON.parse(await readFile('performance-report.json', 'utf8'));
const evidence = {
  schemaVersion: 1,
  package: 'R6.5-WP19H6.0',
  sourceCommit,
  capturedAt: new Date().toISOString(),
  baseUrl,
  route: '/?scene=brook&diagnostics=1',
  displays: {},
  bundlePerformance: performanceReport,
};

const browser = await chromium.launch();

try {
  for (const [displayName, options] of Object.entries(displays)) {
    const context = await browser.newContext({
      viewport: options.viewport,
      hasTouch: options.hasTouch,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/?scene=brook&diagnostics=1`);
    await page.waitForFunction(() => Boolean(window.__UNICORN_VALLEY_DIAGNOSTICS__));
    await page.waitForFunction(
      () => window.__UNICORN_VALLEY_DIAGNOSTICS__.snapshot().activeScenes.includes('CrystalBrookScene'),
    );
    await page.waitForTimeout(1_400);
    await page.evaluate(() => window.__UNICORN_VALLEY_DIAGNOSTICS__.resetPerformance());

    const displayEvidence = {
      viewport: options.viewport,
      hasTouch: options.hasTouch,
      canvas: await page.locator('canvas').boundingBox(),
      anchors: {},
    };

    for (const [anchorName, anchor] of Object.entries(anchors)) {
      await page.evaluate(
        ({ x, y }) =>
          window.__UNICORN_VALLEY_DIAGNOSTICS__.setArcadeSpritePosition(
            'CrystalBrookScene',
            'world-player-unicorn',
            x,
            y,
          ),
        anchor,
      );
      await page.waitForTimeout(650);

      const snapshot = await page.evaluate(() => window.__UNICORN_VALLEY_DIAGNOSTICS__.snapshot());
      const scene = snapshot.scenes.find(({ key }) => key === 'CrystalBrookScene');
      const namedObjects = (scene?.objects ?? [])
        .filter(({ name }) => Boolean(name))
        .map(({ name, type, x, y, displayWidth, displayHeight, depth, visible, effectiveVisible }) => ({
          name,
          type,
          x,
          y,
          displayWidth,
          displayHeight,
          depth,
          visible,
          effectiveVisible,
        }));

      displayEvidence.anchors[anchorName] = {
        player: anchor,
        camera: scene?.camera ?? null,
        sceneObjectCount: scene?.objects.length ?? 0,
        health: snapshot.health.scenes.find(({ key }) => key === 'CrystalBrookScene') ?? null,
        namedObjects,
        performance: await page.evaluate(() => window.__UNICORN_VALLEY_DIAGNOSTICS__.performance()),
      };

      await page.locator('canvas').screenshot({
        path: `${outputDir}/${displayName}-${anchorName}.png`,
      });
    }

    evidence.displays[displayName] = displayEvidence;
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(`${outputDir}/baseline.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(
  `${outputDir}/bundle-performance.json`,
  `${JSON.stringify(performanceReport, null, 2)}\n`,
);
