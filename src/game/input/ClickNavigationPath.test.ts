import { describe, expect, it } from 'vitest';
import type { TraversalMapDefinition } from '../world/MapTraversal';
import { findClickNavigationPath } from './ClickNavigationPath';

const map: TraversalMapDefinition = {
  width: 600,
  height: 420,
  margin: 20,
  playerSpawn: { x: 90, y: 210 },
  colliders: [
    { id: 'wall-top', x: 300, y: 105, width: 50, height: 170 },
    { id: 'wall-bottom', x: 300, y: 335, width: 50, height: 130 },
  ],
};

describe('findClickNavigationPath', () => {
  it('routes through a safe gap instead of walking straight into collision geometry', () => {
    const path = findClickNavigationPath(
      map,
      { x: 90, y: 210 },
      { x: 510, y: 210 },
      { cellSize: 28, clearance: 18 },
    );

    expect(path.length).toBeGreaterThan(2);
    expect(
      path.some((point) => point.x > 260 && point.x < 340 && point.y > 185 && point.y < 280),
    ).toBe(true);
    expect(path.at(-1)).toEqual({ x: 510, y: 210 });
  });

  it('moves a blocked click to the nearest safe destination', () => {
    const path = findClickNavigationPath(
      map,
      { x: 90, y: 210 },
      { x: 300, y: 105 },
      { cellSize: 28, clearance: 18 },
    );

    expect(path.length).toBeGreaterThan(0);
    expect(path.at(-1)).not.toEqual({ x: 300, y: 105 });
  });

  it('returns no route when the walkable area is fully divided', () => {
    const sealedMap: TraversalMapDefinition = {
      ...map,
      colliders: [{ id: 'sealed-wall', x: 300, y: 210, width: 70, height: 380 }],
    };

    expect(
      findClickNavigationPath(
        sealedMap,
        { x: 90, y: 210 },
        { x: 510, y: 210 },
        { cellSize: 28, clearance: 18 },
      ),
    ).toEqual([]);
  });
});
