import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  name: string;
  x: number;
  y: number;
  bodyWidth: number | null;
  bodyHeight: number | null;
  visible: boolean;
  textureKey: string | null;
}
interface DiagnosticScene {
  key: string;
  camera: {
    scrollX: number;
    scrollY: number;
  };
  objects: DiagnosticObject[];
}
interface Snapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticScene[];
}
interface Diagnostics {
  snapshot(): Snapshot;
  startScene(key: string, data?: object): void;
  setArcadeSpritePosition(key: string, objectName: string, x: number, y: number): void;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const diagnostics = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Diagnostics unavailable');
    }
    return diagnostics.snapshot();
  });
}

async function startInterior(page: Page, interiorId: string): Promise<void> {
  await page.waitForFunction(() =>
    Boolean(
      (
        window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
      ).__UNICORN_VALLEY_DIAGNOSTICS__
        ?.snapshot()
        .activeScenes.includes('TitleScene'),
    ),
  );
  await page.evaluate((id) => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.startScene('VillageInteriorScene', { interiorId: id });
  }, interiorId);
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['VillageInteriorScene']);
}

test('H3.11.1 makes VillageInteriorScene a walkable semantic interior with physical collision', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'bakery');

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) {
    throw new Error('Missing VillageInteriorScene');
  }

  const player = interior.objects.find(({ name }) => name === 'world-player-unicorn');
  const shell = interior.objects.find(({ name }) => name === 'village-interior:bakery:room-shell');
  const counter = interior.objects.find(({ name }) => name === 'village-interior:bakery:counter');
  const counterCollider = interior.objects.find(
    ({ name }) => name === 'village-interior-collider:bakery:counter',
  );
  const cinnamon = interior.objects.find(
    ({ name }) => name === 'village-interior-resident:resident:cinnamon',
  );
  const shellMapButton = interior.objects.find(
    ({ name }) => name === 'exploration-shell-map-button',
  );
  const shellLocation = interior.objects.find(({ name }) => name === 'exploration-location-title');

  expect(player).toMatchObject({ x: 750, y: 870, visible: true });
  expect(player?.textureKey?.startsWith('player-unicorn-village-interior:bakery')).toBe(true);
  expect(shell?.visible).toBe(true);
  expect(counter?.visible).toBe(true);
  expect(counterCollider).toMatchObject({ bodyWidth: 390, bodyHeight: 86 });
  expect(cinnamon?.visible).toBe(true);
  expect(interior.objects.some(({ name }) => name === 'village-interior:bakery:exit-gap')).toBe(
    true,
  );
  expect(shellMapButton?.visible).toBe(true);
  expect(shellLocation?.visible).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:patisserie-case'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:magic-cake-dome'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:bread-counter'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:doughnut-display'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:cupcake-display'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:cupcake-plaque'),
  ).toBe(true);
  expect(
    interior.objects.some(({ name }) => name === 'village-interior:bakery:doughnut-plaque'),
  ).toBe(true);
  expect(
    interior.objects.filter(({ name }) => name === 'village-interior:bakery:cafe-stool').length,
  ).toBe(2);

  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowLeft');
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.find(({ name }) => name === 'world-player-unicorn')?.x ?? 750;
    })
    .toBeLessThan(740);

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      410,
      565,
    );
  });
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.some(
        ({ name }) =>
          name === 'interaction-direct-zone:interaction:village-interior:bakery:counter',
      );
    })
    .toBe(true);

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      750,
      900,
    );
  });
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await snapshot(page)).activeScenes)
    .toEqual(['SunbeamVillageScene']);
});

test('H3.11.4 gives Story House a dedicated storykeeper and physical reading room', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'library');

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) {
    throw new Error('Missing VillageInteriorScene');
  }
  const names = new Set(interior.objects.map(({ name }) => name));

  expect(names.has('village-interior-resident:resident:quill')).toBe(true);
  expect(names.has('village-interior-resident:resident:tansy')).toBe(false);
  expect(names.has('village-interior-resident:resident:maple')).toBe(false);
  expect(names.has('village-interior:library:story-rug')).toBe(true);
  expect(names.has('village-interior:library:story-table')).toBe(true);
  expect(names.has('village-interior:library:storykeeper-desk')).toBe(true);
  expect(names.has('village-interior:library:clue-cabinet')).toBe(true);
  expect(names.has('village-interior:library:reading-chair')).toBe(true);
  expect(names.has('village-interior:library:reading-lamp')).toBe(false);
  expect(
    interior.objects.filter(({ name }) => name === 'village-interior:library:bookcase').length,
  ).toBe(3);
  expect(names.has('village-interior:library:secret-passage-bookcase')).toBe(true);
  expect(
    interior.objects.filter(({ name }) => name === 'village-interior:library:reading-cushion')
      .length,
  ).toBe(4);

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      960,
      805,
    );
  });
  await page.keyboard.press('Enter');
  await expect(page.locator('.story-reader-overlay')).toBeVisible();

  const lanternCard = page.locator(
    '.story-library-book[data-story-id="the-lantern-at-the-edge-of-the-woods"]',
  );
  const lanternLayout = await lanternCard.evaluate((card) => {
    const meta = card.querySelector<HTMLElement>('.story-library-meta');
    if (!meta) {
      throw new Error('Missing Lantern progress footer');
    }
    const cardRect = card.getBoundingClientRect();
    const metaRect = meta.getBoundingClientRect();
    return {
      cardBottom: cardRect.bottom,
      cardHeight: cardRect.height,
      metaBottom: metaRect.bottom,
    };
  });
  expect(lanternLayout.cardHeight).toBeGreaterThanOrEqual(218);
  expect(lanternLayout.metaBottom).toBeLessThanOrEqual(lanternLayout.cardBottom - 14);

  const searchToggle = page.getByRole('button', { name: 'Search' });
  const filterToggle = page.getByRole('button', { name: 'Filters' });
  const categoryToggle = page.getByRole('button', { name: /Categories/ });
  await expect(searchToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(filterToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(categoryToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#story-library-search-panel')).toBeHidden();
  await expect(page.locator('#story-library-filter-panel')).toBeHidden();
  await expect(page.locator('#story-library-category-panel')).toBeHidden();

  await categoryToggle.click();
  await expect(page.locator('#story-library-category-panel')).toBeVisible();
  await categoryToggle.click();
  await expect(page.locator('#story-library-category-panel')).toBeHidden();

  await searchToggle.click();
  await expect(page.locator('#story-library-search-panel')).toBeVisible();
  await filterToggle.click();
  await expect(page.locator('#story-library-filter-panel')).toBeVisible();

  await page.locator('.story-library-book[data-story-id="the-duck-bread-baker"]').click();
  await expect(page.locator('.story-reader-title-wrap span')).toHaveText('Page 1 of 41');

  const scrollerBox = await page.locator('.story-reader-scroller').boundingBox();
  const paperBox = await page.locator('.story-reader-paper').boundingBox();
  if (!scrollerBox || !paperBox) {
    throw new Error('Missing Story House reader geometry');
  }

  await page.mouse.click(
    Math.min(scrollerBox.x + scrollerBox.width - 4, paperBox.x + paperBox.width + 20),
    paperBox.y + 80,
  );
  await expect(page.locator('.story-reader-title-wrap span')).toHaveText('Page 2 of 41');

  const activePaper = page.locator('.story-reader-paper');
  const swipeBox = await activePaper.boundingBox();
  if (!swipeBox) throw new Error('Missing Story House page geometry for swipe');
  const swipeY = swipeBox.y + Math.min(140, swipeBox.height / 2);
  await page.mouse.move(swipeBox.x + swipeBox.width * 0.72, swipeY);
  await page.mouse.down();
  await page.mouse.move(swipeBox.x + swipeBox.width * 0.28, swipeY, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('.story-reader-title-wrap span')).toHaveText('Page 3 of 41');

  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('button', { name: 'Close Story House Library' }).click();
  await expect(page.locator('.story-reader-overlay')).toHaveCount(0);

  const beforeMove = (await snapshot(page)).scenes
    .find(({ key }) => key === 'VillageInteriorScene')
    ?.objects.find(({ name }) => name === 'world-player-unicorn')?.x;
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowLeft');
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.find(({ name }) => name === 'world-player-unicorn')?.x ?? beforeMove;
    })
    .toBeLessThan(beforeMove ?? 960);
});

test('H3.11.2 Cinnamon uses the production dialogue menu to open the Bakery shop', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'bakery');

  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      750,
      545,
    );
  });
  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const interior = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return interior?.objects.filter(({ name }) => name.startsWith('dialogue-production-choice-'))
        .length;
    })
    .toBe(2);

  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const interior = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return interior?.objects.some(({ name }) => name === 'bakery-shop-title') ?? false;
    })
    .toBe(true);
});

test('H3.11.3 gives Twinkle & Thread a dedicated walkable boutique and shopkeeper', async ({
  page,
}) => {
  await page.goto('/?diagnostics=1');
  await startInterior(page, 'accessory-shop');

  const interior = (await snapshot(page)).scenes.find(({ key }) => key === 'VillageInteriorScene');
  if (!interior) throw new Error('Missing VillageInteriorScene');

  const names = new Set(interior.objects.map(({ name }) => name));
  expect(names.has('village-interior-resident:resident:velvet')).toBe(true);
  expect(names.has('village-interior:accessory-shop:counter')).toBe(true);
  expect(names.has('village-interior:accessory-shop:wall-rack')).toBe(true);
  expect(names.has('village-interior:accessory-shop:display-ribbons')).toBe(true);
  expect(names.has('village-interior:accessory-shop:display-home')).toBe(true);
  expect(names.has('village-interior:accessory-shop:mirror')).toBe(true);
  await page.evaluate(() => {
    (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: Diagnostics }
    ).__UNICORN_VALLEY_DIAGNOSTICS__?.setArcadeSpritePosition(
      'VillageInteriorScene',
      'world-player-unicorn',
      760,
      650,
    );
  });
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return (
        current?.objects.some(
          ({ name }) =>
            name ===
            'interaction-direct-zone:interaction:village-interior:accessory-shop:shopkeeper',
        ) ?? false
      );
    })
    .toBe(true);

  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.filter(({ name }) => name.startsWith('dialogue-production-choice-'))
        .length;
    })
    .toBe(2);

  await page.keyboard.press('Enter');

  await expect
    .poll(async () => {
      const snapshotState = await snapshot(page);
      const current = snapshotState.scenes.find(({ key }) => key === 'VillageInteriorScene');
      return {
        activeScenes: snapshotState.activeScenes,
        hasShop: current?.objects.some(({ name }) => name === 'twinkle-shop-title') ?? false,
      };
    })
    .toEqual({
      activeScenes: ['VillageInteriorScene'],
      hasShop: true,
    });

  // Close the shop overlay, then tap Velvet herself. The direct hit area must be over the
  // visible shopkeeper, not down at the customer's standing point.
  await page.keyboard.press('Escape');
  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.some(({ name }) => name === 'twinkle-shop-title') ?? false;
    })
    .toBe(false);

  const velvetZone = (await snapshot(page)).scenes
    .find(({ key }) => key === 'VillageInteriorScene')
    ?.objects.find(
      ({ name }) =>
        name === 'interaction-direct-zone:interaction:village-interior:accessory-shop:shopkeeper',
    );
  expect(velvetZone).toBeDefined();
  expect(velvetZone).toMatchObject({ x: 760, y: 540 });

  // Closing a modal deliberately suppresses world activation briefly so the close
  // click/key cannot fall through into the scene behind it. This is a new intentional
  // interaction, so wait past that guard before tapping Velvet again.
  await page.waitForTimeout(200);
  const current = await snapshot(page);
  const currentInterior = current.scenes.find(({ key }) => key === 'VillageInteriorScene');
  const currentVelvetZone = currentInterior?.objects.find(
    ({ name }) =>
      name === 'interaction-direct-zone:interaction:village-interior:accessory-shop:shopkeeper',
  );
  if (!currentInterior || !currentVelvetZone) {
    throw new Error('Velvet interaction zone disappeared before the direct tap.');
  }

  const canvasBounds = await page.locator('canvas').boundingBox();
  if (!canvasBounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  const screenX = currentVelvetZone.x - currentInterior.camera.scrollX;
  const screenY = currentVelvetZone.y - currentInterior.camera.scrollY;
  await page.mouse.click(
    canvasBounds.x + (screenX / current.width) * canvasBounds.width,
    canvasBounds.y + (screenY / current.height) * canvasBounds.height,
  );

  await expect
    .poll(async () => {
      const current = (await snapshot(page)).scenes.find(
        ({ key }) => key === 'VillageInteriorScene',
      );
      return current?.objects.filter(({ name }) => name.startsWith('dialogue-production-choice-'))
        .length;
    })
    .toBe(2);
});
