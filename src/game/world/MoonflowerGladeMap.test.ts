import { describe, expect, it } from 'vitest';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
  type TraversalTarget,
} from './MapTraversal';

const navigationTargets: TraversalTarget[] = [
  ...MOONFLOWER_GLADE_MAP.landmarks.map((landmark) => ({
    id: landmark.id,
    position: landmark.approach,
  })),
  ...MOONFLOWER_GLADE_MAP.entrances.map((entrance) => ({
    id: entrance.id,
    position: entrance.approach,
  })),
];

describe('Moonflower Glade prototype map', () => {
  it('keeps every landmark and reserved entrance reachable from the player spawn', () => {
    expect(findUnreachableTargets(MOONFLOWER_GLADE_MAP, navigationTargets)).toEqual([]);
  });

  it('keeps navigation targets inside the world and outside collision geometry', () => {
    for (const target of navigationTargets) {
      expect(isPointInsideWalkableBounds(MOONFLOWER_GLADE_MAP, target.position, 42)).toBe(true);
      expect(isPointBlocked(target.position, MOONFLOWER_GLADE_MAP.colliders, 42)).toBe(false);
    }
  });

  it('uses unique stable IDs for landmarks, entrances and collision regions', () => {
    const ids = [
      ...MOONFLOWER_GLADE_MAP.landmarks.map((landmark) => landmark.id),
      ...MOONFLOWER_GLADE_MAP.entrances.map((entrance) => entrance.id),
      ...MOONFLOWER_GLADE_MAP.colliders.map((collider) => collider.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the player crossing centred on the visible bridge deck', () => {
    const north = MOONFLOWER_GLADE_MAP.colliders.find(
      (collider) => collider.id === 'collision:stream-north',
    );
    const south = MOONFLOWER_GLADE_MAP.colliders.find(
      (collider) => collider.id === 'collision:stream-south',
    );

    expect(north).toBeDefined();
    expect(south).toBeDefined();

    const northEdge = (north?.y ?? 0) + (north?.height ?? 0) / 2;
    const southEdge = (south?.y ?? 0) - (south?.height ?? 0) / 2;
    const gap = southEdge - northEdge;

    expect(gap).toBe(MOONFLOWER_GLADE_MAP.bridge.walkableHeight);
    expect(gap).toBeLessThan(MOONFLOWER_GLADE_MAP.bridge.height);
    expect((northEdge + southEdge) / 2).toBe(MOONFLOWER_GLADE_MAP.bridge.y);
    expect(isPointBlocked(MOONFLOWER_GLADE_MAP.bridge, MOONFLOWER_GLADE_MAP.colliders, 42)).toBe(
      false,
    );
  });
});