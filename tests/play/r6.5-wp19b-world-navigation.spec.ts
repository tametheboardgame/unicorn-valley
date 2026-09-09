import { expect, test, type Page } from '@playwright/test';

interface ObjectSnapshot {
  name: string;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
  playerFacing: string | null;
}
interface SceneSnapshot {
  key: string;
  camera: { scrollX: number; scrollY: number };
  objects: ObjectSnapshot[];
}
interface Snapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: SceneSnapshot[];
}
interface Diagnostics {
  snapshot(): Snapshot;
  startScene(key: string): void;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Diagnostics unavailable');
    return api.snapshot();
  });
}

async function startScene(page: Page, key: string): Promise<void> {
  await page.evaluate((sceneKey) => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene(sceneKey);
  }, key);
  await page.waitForFunction(
    (sceneKey) =>
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes(sceneKey),
    key,
  );
}

function scene(value: Snapshot, key: string): SceneSnapshot {
  const found = value.scenes.find((candidate) => candidate.key === key);
  if (!found) throw new Error(`Missing ${key}`);
  return found;
}

function player(value: Snapshot, key: string): ObjectSnapshot {
  const found = scene(value, key).objects.find(({ name }) => name === 'world-player-unicorn');
  if (!found) throw new Error(`Missing player in ${key}`);
  return found;
}

async function tapWorld(page: Page, sceneKey: string, x: number, y: number): Promise<void> {
  const value = await snapshot(page);
  const camera = scene(value, sceneKey).camera;
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Canvas unavailable');
  await page.touchscreen.tap(
    canvas.x + ((x - camera.scrollX) / value.width) * canvas.width,
    canvas.y + ((y - camera.scrollY) / value.height) * canvas.height,
  );
}

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

test('Cottage wall seam blocks whole-unicorn overlap while approaches and Gallop remain usable', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startScene(page, 'CottageInteriorScene');

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2_200);
  await page.keyboard.up('ArrowUp');
  let value = await snapshot(page);
  const atWall = player(value, 'CottageInteriorScene');
  expect(atWall.y).toBeGreaterThanOrEqual(430);
  expect(
    scene(value, 'CottageInteriorScene').objects.some(({ name }) => name === 'cottage-floor-seam'),
  ).toBe(true);

  await page.keyboard.down('ArrowDown');
  await page.keyboard.down('Shift');
  await page.waitForTimeout(650);
  await page.keyboard.up('Shift');
  await page.keyboard.up('ArrowDown');
  value = await snapshot(page);
  expect(player(value, 'CottageInteriorScene').y).toBeGreaterThan(atWall.y + 45);

  const beforeTapX = player(value, 'CottageInteriorScene').x;
  await tapWorld(page, 'CottageInteriorScene', 705, 455);
  await expect
    .poll(async () => beforeTapX - player(await snapshot(page), 'CottageInteriorScene').x)
    .toBeGreaterThan(35);
});

for (const [key, blocked, open] of [
  ['CrystalGrottoScene', { x: 640, y: 470 }, { x: 1080, y: 300 }],
  ['FireflyGroveScene', { x: 620, y: 470 }, { x: 1080, y: 300 }],
] as const) {
  test(`${key} uses collider-aware touch navigation and recovers after a blocked tap`, async ({
    page,
  }) => {
    await page.goto('/?diagnostics=1');
    await startScene(page, key);
    await tapWorld(page, key, blocked.x, blocked.y);
    await page.waitForTimeout(1_100);
    const recovered = player(await snapshot(page), key);
    expect(Math.hypot(recovered.x - blocked.x, recovered.y - blocked.y)).toBeGreaterThan(55);

    await tapWorld(page, key, open.x, open.y);
    await expect
      .poll(async () => player(await snapshot(page), key).x - recovered.x, { timeout: 6_000 })
      .toBeGreaterThan(80);
  });
}
