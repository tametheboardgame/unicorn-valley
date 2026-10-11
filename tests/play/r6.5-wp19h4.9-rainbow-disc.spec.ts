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
  primeRainbowDiscTiming(): void;
  rainbowDiscMatchState(): RainbowDiscMatchState;
}

interface RainbowDiscMatchState {
  mode: string;
  phase: string;
  selectedReceiver: number;
  openLane: number | null;
  possession: number;
  playerScore: number;
  oppositionScore: number;
  actionLocked: boolean;
  timingActive: boolean;
  defenceCueLane: number | null;
  defenceCueRenderedLane: number | null;
  practiceThrows: number;
}

async function matchState(page: Page): Promise<RainbowDiscMatchState> {
  return page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Browser diagnostics unavailable.');
    return api.rainbowDiscMatchState();
  });
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

async function waitForTimingReady(page: Page): Promise<void> {
  // Poll the small scene-owned state instead of repeatedly serialising all
  // Phaser objects; full snapshots can starve scheduled tweens on CI.
  try {
    await expect
      .poll(async () => (await matchState(page)).timingActive, {
        timeout: 15_000,
        intervals: [100, 250, 500, 1_000],
      })
      .toBe(true);
    // Still require the visible player-facing timing control when input unlocks.
    const scene = await snapshotScene(page, 'RainbowDiscActivityScene');
    expect(
      scene.objects.some(
        ({ name, effectiveVisible }) =>
          name === 'rainbow-disc-activity:timing-marker' && effectiveVisible,
      ),
    ).toBe(true);
  } catch (error) {
    const state = await matchState(page);
    const scene = await snapshotScene(page, 'RainbowDiscActivityScene');
    const marker = scene.objects.find(({ name }) => name === 'rainbow-disc-activity:timing-marker');
    throw new Error(
      `Rainbow Disc timing readiness stalled: ${JSON.stringify({
        state,
        markerVisible: marker?.visible,
        markerEffectiveVisible: marker?.effectiveVisible,
      })}`,
      { cause: error },
    );
  }
}

async function primeSuccessfulTiming(page: Page): Promise<void> {
  await waitForTimingReady(page);
  await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Browser diagnostics unavailable.');
    api.primeRainbowDiscTiming();
  });
}

async function clickNamedObject(page: Page, sceneKey: string, name: string): Promise<void> {
  const scene = await snapshotScene(page, sceneKey);
  const object = scene.objects.find(
    ({ name: objectName, effectiveVisible }) => objectName === name && effectiveVisible,
  );
  if (!object) throw new Error(`Missing visible object ${sceneKey}:${name}.`);
  await page.mouse.click(object.x, object.y);
}

async function throwToPracticeTarget(page: Page, receiverIndex: number): Promise<void> {
  await waitForTimingReady(page);
  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    `rainbow-disc-activity:receiver-ring:${receiverIndex}`,
  );
  // Readiness was already checked above. Avoid a second full-scene snapshot
  // for each throw in this five-round journey.
  await page.evaluate(() => {
    const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
      .__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!api) throw new Error('Browser diagnostics unavailable.');
    api.primeRainbowDiscTiming();
  });
  const previousThrows = (await matchState(page)).practiceThrows;
  await page.keyboard.press('Space');
  await expect.poll(async () => (await matchState(page)).practiceThrows).toBe(previousThrows + 1);
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
  // The scene records the lane only after drawing the player-facing cue.
  // Read that turn-scoped evidence even if the short-lived cue has expired.
  const readLane = await page.waitForFunction(
    () => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      // Playwright waitForFunction requires a truthy result; lane 0 is valid.
      return (api?.rainbowDiscMatchState().defenceCueRenderedLane ?? -1) + 1;
    },
    undefined,
    { timeout: 6_000, polling: 75 },
  );
  const telegraphedLane = (await readLane.jsonValue()) - 1;

  await page.waitForFunction(
    () => {
      const api = (window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: DiagnosticsApi })
        .__UNICORN_VALLEY_DIAGNOSTICS__;
      const state = api?.rainbowDiscMatchState();
      return state?.phase === 'defence' && !state.actionLocked && state.defenceCueLane === null;
    },
    undefined,
    { timeout: 6_000, polling: 100 },
  );

  const choiceScene = await snapshotScene(page, 'RainbowDiscActivityScene');
  const chosenLane = chooseCorrectly ? telegraphedLane : (telegraphedLane + 1) % 3;
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

async function startGentleMatch(page: Page): Promise<void> {
  await clickNamedObject(
    page,
    'RainbowDiscActivityScene',
    'rainbow-disc-activity:match-assistance-gentle',
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

async function completeOpenLanePass(page: Page, previousReceiver = 1): Promise<number> {
  await waitForTimingReady(page);
  const receiverIndex = await currentOpenLane(page);
  // Both Match and Passing Drill reuse this real throw helper; the diagnostic
  // openLane is meaningful only during Match attack, not Practice.
  const state = await matchState(page);
  if (state.mode === 'match') {
    expect(state.openLane).toBe(receiverIndex);
  }
  // Use the supported lane-choice keys: clicking the art sprite is not a
  // deterministic way of changing receiver on software-rendered Chromium.
  const steps = (receiverIndex - previousReceiver + 3) % 3;
  if (steps > 0) {
    await page.keyboard.press(steps === 1 ? 'ArrowDown' : 'ArrowUp');
  }
  await expect.poll(async () => (await matchState(page)).selectedReceiver).toBe(receiverIndex);
  await primeSuccessfulTiming(page);
  const previousThrows = (await matchState(page)).practiceThrows;
  await page.keyboard.press('Space');
  if (state.mode === 'practice') {
    // A completed attempt is the contract, not merely an on-screen disc that
    // can remain visible while the throw animation is still in flight.
    await expect.poll(async () => (await matchState(page)).practiceThrows).toBe(previousThrows + 1);
  }
  return receiverIndex;
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
  await page.mouse.up();
}

test('H4.9 Rainbow Disc lawn is alive before interaction and returns cleanly after a score', async ({
  page,
}) => {
  // Complete two-goal match, defence and return uses several real animation
  // sequences and browser interactions; retain all assertions on slow CI runners.
  test.setTimeout(120_000);
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
  await startGentleMatch(page);

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
    // The match starts each attack with the centre receiver selected and keeps
    // that selection between passes. Track only real keyboard selections.
    let selectedReceiver = 1;
    for (let pass = 0; pass < 3; pass += 1) {
      selectedReceiver = await completeOpenLanePass(page, selectedReceiver);
    }

    if (goal === 0) {
      // Observe the transient defence telegraph as soon as the third pass is
      // released. Waiting for the score poll first can miss the cue entirely.
      await defendTelegraphedLane(page, true);
      await expect
        .poll(async () => {
          const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
          return activity.objects.find(
            ({ name, effectiveVisible }) =>
              name === 'rainbow-disc-activity:scoreline' && effectiveVisible,
          )?.text;
        })
        .toContain('YOU 1');
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
  // Five real throws and their animated returns take longer under sharded CI.
  test.setTimeout(75_000);
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
    'rainbow-disc-activity:practice-assistance-gentle',
  );
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
    await throwToPracticeTarget(page, 0);

    if (throwIndex < 4) {
      await expect
        .poll(async () => {
          const activity = await snapshotScene(page, 'RainbowDiscActivityScene');
          return activity.objects.some(
            ({ name, effectiveVisible }) =>
              name === 'rainbow-disc-activity:disc' && effectiveVisible,
          );
        })
        .toBe(true);
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

  // Defenders rotate between lanes; throwing to receiver 0 is not reliably
  // intercepted. Target one of the currently marked lanes to assert turnover.
  const markedLane = Number(attackDefenders[0].name.split(':').at(-1));
  // Newly started match selects the centre receiver (1); choose one of the two
  // currently defended lanes with the actual Up/Down control and throw with Space.
  expect([0, 2]).toContain(markedLane);
  await page.keyboard.press(markedLane === 0 ? 'ArrowUp' : 'ArrowDown');
  await expect.poll(async () => (await matchState(page)).selectedReceiver).toBe(markedLane);
  await primeSuccessfulTiming(page);
  await page.keyboard.press('Space');

  // The telegraph is time-limited. Observing it and correctly intercepting
  // the next possession verifies the real defence phase, rather than waiting
  // on a cosmetic sprite until the cue has already expired.
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
    'rainbow-disc-activity:practice-assistance-gentle',
  );
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
    'rainbow-disc-activity:practice-assistance-gentle',
  );
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
  await throwToPracticeTarget(page, calledIndex);

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
