import { describe, expect, it } from 'vitest';
import { RAINBOW_RUN_HUB_LAYOUT, RAINBOW_RUN_HUB_MAP } from './RainbowRunHubMap';

describe('Rainbow Run Race Hub map', () => {
  it('owns a distinct traversable space with one Meadow return and one race gateway', () => {
    expect(RAINBOW_RUN_HUB_MAP.width).toBe(2200);
    expect(RAINBOW_RUN_HUB_MAP.height).toBe(1400);
    expect(RAINBOW_RUN_HUB_MAP.playerSpawn).toEqual(RAINBOW_RUN_HUB_LAYOUT.playerSpawn);
    expect(RAINBOW_RUN_HUB_LAYOUT.meadowExit.position.y).toBeGreaterThan(
      RAINBOW_RUN_HUB_LAYOUT.meadowExit.approach.y,
    );
    expect(RAINBOW_RUN_HUB_LAYOUT.raceGate.position.x).toBeGreaterThan(
      RAINBOW_RUN_HUB_LAYOUT.cupBoard.position.x,
    );
  });

  it('keeps the moved race infrastructure spatially separated', () => {
    const points = [
      RAINBOW_RUN_HUB_LAYOUT.tent,
      RAINBOW_RUN_HUB_LAYOUT.ribbonBoard.position,
      RAINBOW_RUN_HUB_LAYOUT.cupBoard.position,
      RAINBOW_RUN_HUB_LAYOUT.coursePoster.position,
      RAINBOW_RUN_HUB_LAYOUT.nova,
      RAINBOW_RUN_HUB_LAYOUT.raceGate.position,
    ];

    for (let index = 0; index < points.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
        expect(
          Math.hypot(
            points[index].x - points[otherIndex].x,
            points[index].y - points[otherIndex].y,
          ),
        ).toBeGreaterThan(210);
      }
    }
  });

  it('owns the expanded Meadow race entries inside the Hub', () => {
    expect(RAINBOW_RUN_HUB_LAYOUT.expandedRaceEntries).toEqual({
      petalParade: { x: 1370, y: 980 },
      rainbowCup: { x: 1380, y: 610 },
    });
  });

  it('owns collision for the substantial hub props', () => {
    expect(RAINBOW_RUN_HUB_MAP.colliders.map(({ id }) => id)).toEqual([
      'collision:race-hub-tent',
      'collision:race-hub-ribbon-board',
      'collision:race-hub-cup-board',
      'collision:race-hub-race-post-north',
      'collision:race-hub-race-post-south',
    ]);
  });
});
