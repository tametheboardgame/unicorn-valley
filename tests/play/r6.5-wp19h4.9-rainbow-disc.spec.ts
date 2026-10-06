import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  visible: boolean;
  effectiveVisible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticHealthScene {
  key: string;
  lifecycleState: string;
}

interface DiagnosticsApi {
  snapshot(): {
    activeScenes: string[];
    scenes: DiagnosticScene[];
    health: { scenes: DiagnosticHealthScene[] };
  };
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() => '__UNICORN_VALLEY_DIAGNOSTICS__' in window);
}

async function snapshotScene(page: Page, key: string): Promise<DiagnosticScene> {
  return page.evaluate((sceneKey) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const scene = api?.snapshot().scenes.find((candidate) => candidate.key === sceneKey);
    if (!scene) throw new Error(`Missing diagnostic scene ${sceneKey}.`);
    return scene;
  }, key);
}

async function clickNamedObject(page: Page, sceneKey: string, name: string): Promise<void> {
  const scene = await snapshotScene(page, sceneKey);
  const object = scene.objects.find(
    ({ name: objectName, effectiveVisible }) => objectName === name && effectiveVisible,
  );
  if (!object) throw new Error(`Missing visible object ${sceneKey}:${name}.`);
  await page.mouse.click(object.x, object.y);
}

async function dragDiscToRing(page: Page, receiverIndex: number): Promise<void> {
  const scene = await snapshotScene(page, 'RainbowDiscActivityScene');
  const disc = scene.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:disc' && effectiveVisible,
  );
  const ring = scene.objects.find(
    ({ name, effectiveVisible }) =>
      name === `rainbow-disc-activity:receiver-ring:${receiverIndex}` && effectiveVisible,
  );
  if (!disc || !ring) throw new Error('Rainbow Disc target throw objects are unavailable.');

  await page.mouse.move(disc.x, disc.y);
  await page.mouse.down();
  await page.mouse.move(ring.x, ring.y, { steps: 8 });
  await waitForGoodThrowTiming(page);
  await page.mouse.up();
}

async function setMeadowPlayerPosition(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ targetX, targetY }) => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!api) throw new Error('Browser diagnostics unavailable.');
      api.setArcadeSpritePosition('RainbowMeadowScene', 'world-player-unicorn', targetX, targetY);
    },
    { targetX: x, targetY: y },
  );
}

async function waitForActiveScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    return api?.snapshot().activeScenes.includes(key) === true;
  }, sceneKey);
}

async function waitForGoodThrowTiming(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = api?.snapshot().scenes.find(
        ({ key }) => key === 'RainbowDiscActivityScene',
      );
      const marker = scene?.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:timing-marker' && effectiveVisible,
      );
      const zone = scene?.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:timing-success-zone' && effectiveVisible,
      );
      if (!marker || !zone) return false;
      const left = zone.x - zone.displayWidth / 2;
      const right = zone.x + zone.displayWidth / 2;
      return marker.x >= left && marker.x <= right;
    },
    undefined,
    { timeout: 6000 },
  );
}

async function currentOpenLane(page: Page): Promise<number> {
  const scene = await snapshotScene(page, 'RainbowDiscActivityScene');
  for (let index = 0; index < 3; index += 1) {
    const defender = scene.objects.find(
      ({ name, effectiveVisible }) =>
        name === `rainbow-disc-activity:defender:${index}` && effectiveVisible,
    );
    if (!defender) return index;
  }
  throw new Error('No open Rainbow Disc lane is visible.');
}

async function defendTelegraphedLane(page: Page, chooseCorrectly = true): Promise<void> {
  const readLane = await page.evaluate(async () => {
    const timeoutAt = performance.now() + 6000;

    return new Promise<number>((resolve, reject) => {
      const inspect = (): void => {
        const api = (
          window as typeof window & {
            __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi;
          }
        ).__UNICORN_VALLEY_DIAGNOSTICS__;
        const scene = api?.snapshot().scenes.find(
          ({ key }) => key === 'RainbowDiscActivityScene',
        );
        const cue = scene?.objects.find(
          ({ name, effectiveVisible }) =>
            name.startsWith('rainbow-disc-activity:defence-read-cue:') && effectiveVisible,
        );

        if (cue) {
          resolve(Number(cue.name.split(':').at(-1)));
          return;
        }

        if (performance.now() >= timeoutAt) {
          reject(new Error('Rainbow Disc defence read cue was not observed.'));
          return;
        }

        requestAnimationFrame(inspect);
      };

      inspect();
    });
  });

  await page.waitForFunction(
    () => {
      const api = (
        window as typeof window & {
          __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi;
        }
      ).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = api?.snapshot().scenes.find(
        ({ key }) => key === 'RainbowDiscActivityScene',
      );
      return !scene?.objects.some(
        ({ name, effectiveVisible }) =>
          name.startsWith('rainbow-disc-activity:defence-read-cue:') && effectiveVisible,
      );
    },
    undefined,
    { timeout: 6000 },
  );

  const choiceScene = await snapshotScene(page, 'RainbowDiscActivityScene');
  const chosenLane = chooseCorrectly ? readLane : (readLane + 1) % 3;
  const receiver = choiceScene.objects.find(
    ({ name, effectiveVisible }) =>
      name === `rainbow-disc-activity:opponent-receiver:${chosenLane}` && effectiveVisible,
  );
  if (!receiver) throw new Error('Rainbow Disc defence receiver is unavailable.');
  await page.mouse.click(receiver.x, receiver.y);
}

async function startStandardMatch(page: Page): Promise<void> {
  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    'rainbow-disc-activity:match-assistance-standard',
  );
  await expect
    .poll(async () => {
      const scene = await snapshotScene(page, 'RainbowDiscActivityScene');
      return scene.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:thrower' && effectiveVisible,
      );
    })
    .toBe(true);
}

async function completeOpenLanePass(page: Page): Promise<void> {
  await dragDiscToReceiver(page, await currentOpenLane(page));
}

async function dragDiscToReceiver(page: Page, receiverIndex = 1): Promise<void> {
  const scene = await snapshotScene(page, 'RainbowDiscActivityScene');
  const disc = scene.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:disc' && effectiveVisible,
  );
  const receiver = scene.objects.find(
    ({ name, effectiveVisible }) =>
      name === `rainbow-disc-activity:receiver:${receiverIndex}` && effectiveVisible,
  );
  if (!disc || !receiver) {
    throw new Error('Rainbow Disc throw objects are unavailable.');
  }

  await page.mouse.move(disc.x, disc.y);
  await page.mouse.down();
  await page.mouse.move(receiver.x, receiver.y, { steps: 8 });
  await waitForGoodThrowTiming(page);
  await page.mouse.up();
}

test('H4.9 Rainbow Disc lawn is alive before interaction and returns cleanly after a score', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await page.waitForFunction(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    const meadow = api?.snapshot().scenes.find(({ key }) => key === 'RainbowMeadowScene');
    return meadow?.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:ambient-disc' && effectiveVisible,
    );
  });

  const meadow = await snapshotScene(page, 'RainbowMeadowScene');
  const fieldPlayers = meadow.objects.filter(
    ({ name, effectiveVisible }) => name.startsWith('rainbow-disc:player:') && effectiveVisible,
  );
  expect(fieldPlayers).toHaveLength(5);

  const widths = fieldPlayers.map(({ displayWidth }) => displayWidth);
  const heights = fieldPlayers.map(({ displayHeight }) => displayHeight);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);

  const initialPositions = new Map(fieldPlayers.map(({ name, x, y }) => [name, { x, y }] as const));
  await page.waitForTimeout(1200);
  const movingMeadow = await snapshotScene(page, 'RainbowMeadowScene');
  const movedPlayers = movingMeadow.objects
    .filter(
      ({ name, effectiveVisible }) => name.startsWith('rainbow-disc:player:') && effectiveVisible,
    )
    .filter(({ name, x, y }) => {
      const initial = initialPositions.get(name);
      if (!initial) return false;
      return Math.hypot(x - initial.x, y - initial.y) >= 10;
    });
  expect(movedPlayers.length).toBeGreaterThanOrEqual(3);
  expect(
    meadow.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:lawn' && effectiveVisible,
    ),
  ).toBe(true);
  const sign = meadow.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc:sign' && effectiveVisible,
  );
  expect(sign).toBeDefined();
  expect(sign?.x ?? 9999).toBeCloseTo(520, 0);
  expect(sign?.y ?? 9999).toBeCloseTo(1170, 0);
  for (const name of [
    'rainbow-disc:sign-leg-left',
    'rainbow-disc:sign-leg-right',
    'rainbow-disc:practice-sign-leg-left',
    'rainbow-disc:practice-sign-leg-right',
  ]) {
    expect(
      meadow.objects.some((object) => object.name === name && object.effectiveVisible),
      `${name} visible`,
    ).toBe(true);
  }

  const ambientDisc = meadow.objects.find(
    ({ name, effectiveVisible }) => name === 'rainbow-disc:ambient-disc' && effectiveVisible,
  );
  expect(ambientDisc?.type).toBe('Graphics');
  expect(
    meadow.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:practice-range' && effectiveVisible,
    ),
  ).toBe(true);
  expect(
    meadow.objects.some(
      ({ name, effectiveVisible }) => name === 'rainbow-disc:practice-sign' && effectiveVisible,
    ),
  ).toBe(true);

  for (let index = 0; index < 4; index += 1) {
    const post = meadow.objects.find(({ name }) => name === `rainbow-disc:pennant-post:${index}`);
    const pennant = meadow.objects.find(({ name }) => name === `rainbow-disc:pennant:${index}`);
    expect(post).toBeDefined();
    expect(pennant).toBeDefined();
    expect(pennant?.x).toBeCloseTo(post?.x ?? 0, 0);
    expect(pennant?.y).toBeCloseTo((post?.y ?? 0) - 35, 0);
  }

  await setMeadowPlayerPosition(page, 505, 1475);
  await expect
    .poll(async () => {
      const current = await snapshotScene(page, 'RainbowMeadowScene');
      return current.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt' && effectiveVisible,
      );
    })
    .toBe(true);

  await expect
    .poll(async () => {
      const current = await snapshotScene(page, 'RainbowMeadowScene');
      return current.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt-label' && effectiveVisible,
      )?.text;
    })
    .toBe('Join the game');

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');
  await startStandardMatch(page);

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
          .__UNICORN_VALLEY_DIAGNOSTICS__;
        return api?.snapshot().health.scenes.find(({ key }) => key === 'RainbowMeadowScene')
          ?.lifecycleState;
      }),
    )
    .toBe('paused');

  for (let goal = 0; goal < 2; goal += 1) {
    for (let pass = 0; pass < 3; pass += 1) {
      await completeOpenLanePass(page);
      if (pass < 2) {
        await page.waitForTimeout(520);
      }
    }

    if (goal === 0) {
      await expect
        .poll(async () => {
          const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
          return activity.objects.find(
            ({ name, effectiveVisible }) =>
              name === 'rainbow-disc-activity:scoreline' && effectiveVisible,
          )?.text;
        })
        .toContain('YOU 1');

      await defendTelegraphedLane(page, true);
      await expect
        .poll(async () => {
          const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
          return activity.objects.some(
            ({ name, effectiveVisible }) =>
              name === 'rainbow-disc-activity:thrower' && effectiveVisible,
          );
        })
        .toBe(true);
    }
  }

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:result' && effectiveVisible,
      );
    })
    .toBe(true);

  const finalMatch = await snapshotScene(page, 'RainbowDiscActivityScene');
  expect(
    finalMatch.objects.find(
      ({ name, effectiveVisible }) =>
        name === 'rainbow-disc-activity:scoreline' && effectiveVisible,
    )?.text,
  ).toContain('YOU 2');

  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    'rainbow-disc-activity:result-change-level',
  );
  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:match-setup-title' && effectiveVisible,
      );
    })
    .toBe(true);

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'RainbowMeadowScene');
});

test('H4.9B practice range launches a five-throw target challenge', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await setMeadowPlayerPosition(page, 1080, 1400);
  await expect
    .poll(async () => {
      const current = await snapshotScene(page, 'RainbowMeadowScene');
      return current.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt' && effectiveVisible,
      );
    })
    .toBe(true);

  await expect
    .poll(async () => {
      const current = await snapshotScene(page, 'RainbowMeadowScene');
      return current.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt-label' && effectiveVisible,
      )?.text;
    })
    .toBe('Practice throws');

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ text, effectiveVisible }) => effectiveVisible && text === 'Rainbow Disc Practice',
      );
    })
    .toBe(true);

  const practiceMenu = await snapshotScene(page, 'RainbowDiscActivityScene');
  expect(
    practiceMenu.objects.some(
      ({ name, effectiveVisible }) =>
        name === 'rainbow-disc-activity:practice-menu-title' && effectiveVisible,
    ),
  ).toBe(true);

  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    'rainbow-disc-activity:practice-target-range',
  );

  const activityStart = await snapshotScene(page, 'RainbowDiscActivityScene');
  expect(
    activityStart.objects.some(
      ({ name, effectiveVisible }) =>
        name === 'rainbow-disc-activity:practice-targets' && effectiveVisible,
    ),
  ).toBe(true);

  const practiceRings = [0, 1, 2].map((index) =>
    activityStart.objects.find(
      ({ name, effectiveVisible }) =>
        name === `rainbow-disc-activity:receiver-ring:${index}` && effectiveVisible,
    ),
  );
  expect(practiceRings.every(Boolean)).toBe(true);
  expect(new Set(practiceRings.map((ring) => Math.round(ring?.y ?? -1))).size).toBe(1);
  expect(practiceRings.map((ring) => ring?.x ?? 0)).toEqual(
    [...practiceRings.map((ring) => ring?.x ?? 0)].sort((a, b) => a - b),
  );
  expect(
    activityStart.objects.find(
      ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:disc' && effectiveVisible,
    )?.type,
  ).toBe('Graphics');

  for (let throwIndex = 0; throwIndex < 5; throwIndex += 1) {
    const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
    const disc = activity.objects.find(
      ({ name, effectiveVisible }) => name === 'rainbow-disc-activity:disc' && effectiveVisible,
    );
    if (!disc) throw new Error('Practice disc is unavailable.');

    await page.mouse.move(disc.x, disc.y);
    await page.mouse.down();
    await page.mouse.move(890, 325, { steps: 8 });
    await waitForGoodThrowTiming(page);
    await page.mouse.up();

    if (throwIndex < 4) {
      await page.waitForTimeout(520);
    }
  }

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ text, effectiveVisible }) => effectiveVisible && text === 'PRACTICE COMPLETE!',
      );
    })
    .toBe(true);

  await clickNamedObject(page, 'RainbowDiscActivityScene', 'rainbow-disc-activity:result-menu');
  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:practice-menu-title' && effectiveVisible,
      );
    })
    .toBe(true);

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'RainbowMeadowScene');
});

test('H4.9D defended lanes can turn over possession and trigger a defence phase', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await setMeadowPlayerPosition(page, 700, 1400);
  await expect
    .poll(async () => {
      const meadow = await snapshotScene(page, 'RainbowMeadowScene');
      return meadow.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt-label' && effectiveVisible,
      )?.text;
    })
    .toBe('Join the game');

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');
  await startStandardMatch(page);

  const attack = await snapshotScene(page, 'RainbowDiscActivityScene');
  const attackDefenders = attack.objects.filter(
    ({ name, effectiveVisible }) =>
      name.startsWith('rainbow-disc-activity:defender:') && effectiveVisible,
  );
  expect(attackDefenders.length).toBeGreaterThanOrEqual(2);

  for (let index = 0; index < 3; index += 1) {
    const receiver = attack.objects.find(
      ({ name, effectiveVisible }) =>
        name === `rainbow-disc-activity:receiver:${index}` && effectiveVisible,
    );
    const ring = attack.objects.find(
      ({ name, effectiveVisible }) =>
        name === `rainbow-disc-activity:receiver-ring:${index}` && effectiveVisible,
    );
    expect(receiver).toBeDefined();
    expect(ring).toBeDefined();
    expect(receiver?.x).toBeCloseTo(ring?.x ?? 0, 0);
    expect(receiver?.y).toBeCloseTo(ring?.y ?? 0, 0);
  }

  for (const index of [0, 2]) {
    const receiver = attack.objects.find(
      ({ name, effectiveVisible }) =>
        name === `rainbow-disc-activity:receiver:${index}` && effectiveVisible,
    );
    const defender = attack.objects.find(
      ({ name, effectiveVisible }) =>
        name === `rainbow-disc-activity:defender:${index}` && effectiveVisible,
    );
    expect(receiver).toBeDefined();
    expect(defender).toBeDefined();
    expect(Math.abs((receiver?.x ?? 0) - (defender?.x ?? 0))).toBeGreaterThanOrEqual(130);
    expect(defender?.displayWidth).toBeCloseTo(receiver?.displayWidth ?? 0, 0);
    expect(defender?.displayHeight).toBeCloseTo(receiver?.displayHeight ?? 0, 0);
  }

  await dragDiscToReceiver(page, 0);

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:defence-player' && effectiveVisible,
      );
    })
    .toBe(true);

  await defendTelegraphedLane(page, true);

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:thrower' && effectiveVisible,
      );
    })
    .toBe(true);
});

test('MG-WP6C defence telegraph can be read or missed and the opposition can score', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await setMeadowPlayerPosition(page, 700, 1400);
  await expect
    .poll(async () => {
      const meadow = await snapshotScene(page, 'RainbowMeadowScene');
      return meadow.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt-label' && effectiveVisible,
      )?.text;
    })
    .toBe('Join the game');

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');
  await startStandardMatch(page);

  const attack = await snapshotScene(page, 'RainbowDiscActivityScene');
  const markedLane = [0, 1, 2].find((index) =>
    attack.objects.some(
      ({ name, effectiveVisible }) =>
        name === `rainbow-disc-activity:defender:${index}` && effectiveVisible,
    ),
  );
  if (markedLane === undefined) throw new Error('No marked lane is available.');

  await dragDiscToReceiver(page, markedLane);

  await defendTelegraphedLane(page, false);
  await defendTelegraphedLane(page, false);

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:scoreline' && effectiveVisible,
      )?.text;
    })
    .toContain('1 VILLAGE');

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:thrower' && effectiveVisible,
      );
    })
    .toBe(true);
});

test('MG-WP6D Practice hub exposes Passing Drill and Rainbow Streak as distinct loops', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await setMeadowPlayerPosition(page, 1080, 1400);
  await expect
    .poll(async () => {
      const meadow = await snapshotScene(page, 'RainbowMeadowScene');
      return meadow.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt-label' && effectiveVisible,
      )?.text;
    })
    .toBe('Practice throws');

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');

  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    'rainbow-disc-activity:practice-passing-drill',
  );
  await completeOpenLanePass(page);

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:scoreline' && effectiveVisible,
      )?.text;
    })
    .toContain('Passing · Score 1/6 · Streak 1');

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await setMeadowPlayerPosition(page, 1080, 1400);
  await expect
    .poll(async () => {
      const meadow = await snapshotScene(page, 'RainbowMeadowScene');
      return meadow.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt-label' && effectiveVisible,
      )?.text;
    })
    .toBe('Practice throws');

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');
  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    'rainbow-disc-activity:practice-rainbow-streak',
  );

  const streakStart = await snapshotScene(page, 'RainbowDiscActivityScene');
  const calledLabel = streakStart.objects.find(
    ({ text, effectiveVisible }) => effectiveVisible && text?.startsWith('★ ') === true,
  );
  expect(calledLabel).toBeDefined();
  if (!calledLabel) throw new Error('Rainbow Streak called target is unavailable.');

  const calledRing = streakStart.objects
    .filter(
      ({ name, effectiveVisible }) =>
        name.startsWith('rainbow-disc-activity:receiver-ring:') && effectiveVisible,
    )
    .sort((left, right) => Math.abs(left.x - calledLabel.x) - Math.abs(right.x - calledLabel.x))[0];
  expect(calledRing).toBeDefined();
  if (!calledRing) throw new Error('Rainbow Streak called ring is unavailable.');

  const calledIndex = Number(calledRing.name.split(':').at(-1));
  await dragDiscToRing(page, calledIndex);

  await expect
    .poll(async () => {
      const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
      return activity.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:scoreline' && effectiveVisible,
      )?.text;
    })
    .toContain('Hits 1 · Streak 1');
});

test('H4.9D practice difficulty tightens the green window and increases sweep speed', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?scene=meadow&diagnostics=1');
  await waitForDiagnostics(page);
  await waitForActiveScene(page, 'RainbowMeadowScene');

  await setMeadowPlayerPosition(page, 1080, 1400);
  await expect
    .poll(async () => {
      const meadow = await snapshotScene(page, 'RainbowMeadowScene');
      return meadow.objects.find(
        ({ name, effectiveVisible }) =>
          name === 'exploration-interaction-prompt-label' && effectiveVisible,
      )?.text;
    })
    .toBe('Practice throws');

  await page.keyboard.press('E');
  await waitForActiveScene(page, 'RainbowDiscActivityScene');
  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    'rainbow-disc-activity:practice-target-range',
  );

  const initial = await snapshotScene(page, 'RainbowDiscActivityScene');
  const initialLabel = initial.objects.find(
    ({ name, effectiveVisible }) =>
      name === 'rainbow-disc-activity:timing-difficulty' && effectiveVisible,
  )?.text;
  expect(initialLabel).toContain('Medium');

  await page.keyboard.press('ArrowUp');
  const unchanged = await snapshotScene(page, 'RainbowDiscActivityScene');
  const unchangedLabel = unchanged.objects.find(
    ({ name, effectiveVisible }) =>
      name === 'rainbow-disc-activity:timing-difficulty' && effectiveVisible,
  )?.text;
  expect(unchangedLabel).toContain('Medium');

  await page.keyboard.press('ArrowLeft');
  const easy = await snapshotScene(page, 'RainbowDiscActivityScene');
  const easyZone = easy.objects.find(
    ({ name, effectiveVisible }) =>
      name === 'rainbow-disc-activity:timing-success-zone' && effectiveVisible,
  );
  const easyLabel = easy.objects.find(
    ({ name, effectiveVisible }) =>
      name === 'rainbow-disc-activity:timing-difficulty' && effectiveVisible,
  )?.text;
  expect(easyZone).toBeDefined();
  expect(easyLabel).toContain('Easy');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const hard = await snapshotScene(page, 'RainbowDiscActivityScene');
  const hardZone = hard.objects.find(
    ({ name, effectiveVisible }) =>
      name === 'rainbow-disc-activity:timing-success-zone' && effectiveVisible,
  );
  const hardLabel = hard.objects.find(
    ({ name, effectiveVisible }) =>
      name === 'rainbow-disc-activity:timing-difficulty' && effectiveVisible,
  )?.text;
  expect(hardZone).toBeDefined();
  expect(hardLabel).toContain('Hard');
  expect(hardZone?.displayWidth ?? 999).toBeLessThan(easyZone?.displayWidth ?? 0);

  const speedFrom = (value: string | null | undefined): number =>
    Number(value?.match(/([0-9.]+) speed/)?.[1] ?? '0');
  expect(speedFrom(hardLabel)).toBeGreaterThan(speedFrom(easyLabel));

  await page.keyboard.press('Escape');
  await waitForActiveScene(page, 'RainbowMeadowScene');
});
