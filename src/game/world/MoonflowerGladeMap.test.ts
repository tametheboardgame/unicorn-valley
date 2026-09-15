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
  ...MOONFLOWER_GLADE_MAP.gardenPlots.map((plot) => ({
    id: plot.id,
    position: plot.approach,
  })),
  ...MOONFLOWER_GLADE_MAP.entrances.map((entrance) => ({
    id: entrance.id,
    position: entrance.approach,
  })),
];

describe('Moonflower Glade prototype map', () => {
  it('keeps every landmark, garden interaction point and reserved entrance reachable from the player spawn', () => {
    expect(findUnreachableTargets(MOONFLOWER_GLADE_MAP, navigationTargets)).toEqual([]);
  });

  it('keeps navigation targets inside the world and outside collision geometry', () => {
    for (const target of navigationTargets) {
      expect(isPointInsideWalkableBounds(MOONFLOWER_GLADE_MAP, target.position, 42)).toBe(true);
      expect(isPointBlocked(target.position, MOONFLOWER_GLADE_MAP.colliders, 42)).toBe(false);
    }
  });

  it('uses unique stable IDs for landmarks, garden plots, entrances and collision regions', () => {
    const ids = [
      ...MOONFLOWER_GLADE_MAP.landmarks.map((landmark) => landmark.id),
      ...MOONFLOWER_GLADE_MAP.gardenPlots.map((plot) => plot.id),
      ...MOONFLOWER_GLADE_MAP.entrances.map((entrance) => entrance.id),
      ...MOONFLOWER_GLADE_MAP.colliders.map((collider) => collider.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses three stable future-ready growing plots around the cottage', () => {
    expect(MOONFLOWER_GLADE_MAP.gardenPlots.map((plot) => plot.id)).toEqual([
      'garden:main',
      'garden:upper',
      'garden:stream-bank',
    ]);

    const main = MOONFLOWER_GLADE_MAP.gardenPlots[0];
    const upper = MOONFLOWER_GLADE_MAP.gardenPlots[1];
    const stream = MOONFLOWER_GLADE_MAP.gardenPlots[2];
    const northStream = MOONFLOWER_GLADE_MAP.colliders.find(
      (collider) => collider.id === 'collision:stream-north',
    );
    expect(main.width).toBe(upper.width);
    expect(main.height).toBe(upper.height);
    expect(upper.position.y + upper.height / 2).toBeLessThan(main.position.y - main.height / 2);
    expect(stream.orientation).toBe('vertical');
    expect(northStream).toBeDefined();
    expect(stream.position.x + stream.width / 2).toBeLessThan(
      northStream!.x - northStream!.width / 2,
    );
  });

  it('gives physical gate signs compact post collision while keeping their approaches clear', () => {
    const westernSign = MOONFLOWER_GLADE_MAP.colliders.find(
      (collider) => collider.id === 'collision:western-gate-sign',
    );
    const sunbeamSign = MOONFLOWER_GLADE_MAP.colliders.find(
      (collider) => collider.id === 'collision:sunbeam-direction-sign',
    );
    expect(westernSign).toBeDefined();
    expect(sunbeamSign).toBeDefined();
    expect(westernSign!.width).toBeLessThan(40);
    expect(sunbeamSign!.width).toBeLessThan(40);

    const westernGate = MOONFLOWER_GLADE_MAP.landmarks.find(
      (landmark) => landmark.id === 'western-gate',
    );
    const sunbeam = MOONFLOWER_GLADE_MAP.entrances.find(
      (entrance) => entrance.id === 'sunbeam-village',
    );
    expect(isPointBlocked(westernGate!.approach, MOONFLOWER_GLADE_MAP.colliders, 42)).toBe(false);
    expect(isPointBlocked(sunbeam!.approach, MOONFLOWER_GLADE_MAP.colliders, 42)).toBe(false);
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

  it('backs the visible woodland edges with collision while preserving the east gateway', () => {
    for (const point of [
      { x: 900, y: 145 },
      { x: 900, y: 1655 },
      { x: 2640, y: 430 },
      { x: 2640, y: 1370 },
    ]) {
      expect(isPointBlocked(point, MOONFLOWER_GLADE_MAP.colliders, 0)).toBe(true);
    }

    const eastEntrance = MOONFLOWER_GLADE_MAP.entrances.find(
      (entrance) => entrance.id === 'sunbeam-village',
    );
    expect(eastEntrance).toBeDefined();
    expect(isPointBlocked(eastEntrance!.approach, MOONFLOWER_GLADE_MAP.colliders, 42)).toBe(false);
  });

  it('blocks the visible lower trunk/base areas called out in H1.4 review', () => {
    for (const point of [
      { x: 430, y: 250 },
      { x: 820, y: 270 },
      { x: 1180, y: 250 },
      { x: 1640, y: 250 },
      { x: 1980, y: 250 },
      { x: 2520, y: 270 },
      { x: 2200, y: 650 },
    ]) {
      expect(isPointBlocked(point, MOONFLOWER_GLADE_MAP.colliders, 0)).toBe(true);
    }
  });

  it('keeps the Moonflower Field threshold reachable and aligned to the interaction approach', () => {
    const field = MOONFLOWER_GLADE_MAP.landmarks.find(
      (landmark) => landmark.id === 'moonflower-field',
    );
    expect(field).toBeDefined();
    expect(field?.approach).toEqual({ x: 1890, y: 1185 });
    expect(isPointBlocked(field!.approach, MOONFLOWER_GLADE_MAP.colliders, 42)).toBe(false);
  });
});
