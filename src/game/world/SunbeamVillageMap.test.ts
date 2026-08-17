import { describe, expect, it } from 'vitest';
import { findUnreachableTargets, isPointBlocked, isPointInsideWalkableBounds } from './MapTraversal';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';

const PLAYER_CLEARANCE = 42;

describe('Sunbeam Village map', () => {
  it('keeps the spawn and all interaction approaches reachable', () => {
    expect(
      isPointInsideWalkableBounds(
        SUNBEAM_VILLAGE_MAP,
        SUNBEAM_VILLAGE_MAP.playerSpawn,
        PLAYER_CLEARANCE,
      ),
    ).toBe(true);
    expect(
      isPointBlocked(
        SUNBEAM_VILLAGE_MAP.playerSpawn,
        SUNBEAM_VILLAGE_MAP.colliders,
        PLAYER_CLEARANCE,
      ),
    ).toBe(false);

    const targets = [
      ...SUNBEAM_VILLAGE_MAP.landmarks.map((landmark) => ({
        id: `landmark:${landmark.id}`,
        position: landmark.approach,
      })),
      ...SUNBEAM_VILLAGE_MAP.entrances.map((entrance) => ({
        id: `entrance:${entrance.id}`,
        position: entrance.approach,
      })),
      ...SUNBEAM_VILLAGE_MAP.npcMarkers.map((marker) => ({
        id: `npc:${marker.id}`,
        position: marker.position,
      })),
    ];

    expect(findUnreachableTargets(SUNBEAM_VILLAGE_MAP, targets)).toEqual([]);
  });

  it('reserves enough space between NPC markers for separate interactions', () => {
    const markers = SUNBEAM_VILLAGE_MAP.npcMarkers;

    for (let left = 0; left < markers.length; left += 1) {
      for (let right = left + 1; right < markers.length; right += 1) {
        const distance = Math.hypot(
          markers[left].position.x - markers[right].position.x,
          markers[left].position.y - markers[right].position.y,
        );
        expect(distance).toBeGreaterThanOrEqual(220);
      }
    }
  });

  it('has unique stable IDs for landmarks, entrances and NPC markers', () => {
    const ids = [
      ...SUNBEAM_VILLAGE_MAP.landmarks.map((landmark) => landmark.id),
      ...SUNBEAM_VILLAGE_MAP.entrances.map((entrance) => entrance.id),
      ...SUNBEAM_VILLAGE_MAP.npcMarkers.map((marker) => marker.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });
});
