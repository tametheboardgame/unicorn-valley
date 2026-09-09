import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseUrl = process.env.EVIDENCE_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = 'docs/evidence/wp19b-current-head';
const displays = {
  desktop: { viewport: { width: 1440, height: 900 }, hasTouch: false },
  'tablet-landscape': { viewport: { width: 1024, height: 768 }, hasTouch: true },
  'phone-landscape': { viewport: { width: 844, height: 390 }, hasTouch: true },
  'phone-portrait': { viewport: { width: 390, height: 844 }, hasTouch: true },
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch();
const evidence = {
  candidateSha: process.env.CANDIDATE_SHA ?? 'working-tree',
  capturedAt: new Date().toISOString(),
  baseUrl,
  floorSeamY: 390,
  displays: {},
};

async function startScene(page, key) {
  await page.goto(`${baseUrl}/?diagnostics=1`);
  await page.waitForFunction(() => Boolean(window.__UNICORN_VALLEY_DIAGNOSTICS__));
  await page.evaluate(
    (sceneKey) => window.__UNICORN_VALLEY_DIAGNOSTICS__.startScene(sceneKey),
    key,
  );
  await page.waitForFunction(
    (sceneKey) => window.__UNICORN_VALLEY_DIAGNOSTICS__.snapshot().activeScenes.includes(sceneKey),
    key,
  );
}

async function sceneSnapshot(page, key) {
  return page.evaluate(
    (sceneKey) =>
      window.__UNICORN_VALLEY_DIAGNOSTICS__.snapshot().scenes.find(({ key }) => key === sceneKey),
    key,
  );
}

try {
  for (const [name, options] of Object.entries(displays)) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await startScene(page, 'CottageInteriorScene');
    await page.evaluate(() =>
      window.__UNICORN_VALLEY_DIAGNOSTICS__.setArcadeSpritePosition(
        'CottageInteriorScene',
        'world-player-unicorn',
        705,
        455,
      ),
    );
    await page.waitForTimeout(250);
    const cottage = await sceneSnapshot(page, 'CottageInteriorScene');
    const player = cottage.objects.find(({ name }) => name === 'world-player-unicorn');
    const seam = cottage.objects.find(({ name }) => name === 'cottage-floor-seam');
    const canvas = await page.locator('canvas').boundingBox();
    evidence.displays[name] = {
      viewport: options.viewport,
      canvas,
      player: player
        ? {
            centre: { x: player.x, y: player.y },
            display: { width: player.displayWidth, height: player.displayHeight },
            visualTop: player.y - player.displayHeight / 2,
            visualBottom: player.y + player.displayHeight / 2,
            physicsBody: {
              x: player.bodyX,
              y: player.bodyY,
              width: player.bodyWidth,
              height: player.bodyHeight,
              feet: { x: player.bodyX + player.bodyWidth / 2, y: player.bodyY + player.bodyHeight },
            },
            facing: player.playerFacing,
          }
        : null,
      seam: seam
        ? { x: seam.x, y: seam.y, width: seam.displayWidth, height: seam.displayHeight }
        : null,
    };
    await page.screenshot({ path: `${outputDir}/${name}-cottage-wall.png` });

    if (name === 'tablet-landscape') {
      for (const sceneKey of ['CrystalGrottoScene', 'FireflyGroveScene']) {
        await startScene(page, sceneKey);
        await page.screenshot({
          path: `${outputDir}/tablet-landscape-${sceneKey === 'CrystalGrottoScene' ? 'grotto' : 'grove'}.png`,
        });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(`${outputDir}/geometry.json`, `${JSON.stringify(evidence, null, 2)}\n`);
