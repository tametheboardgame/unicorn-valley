import { describe, expect, it } from 'vitest';
import {
  R6_CRYSTAL_BROOK_RESIDENT_PLACEMENTS,
  R6_CRYSTAL_BROOK_RESIDENT_TALK_VARIANTS,
  resolveEchoCrystalSongLine,
} from './R6CrystalBrookPopulationContent';

describe('H6.7B Echo story and resident ownership', () => {
  it('keeps one authored Brook Echo route and state-aware conversation variants', () => {
    expect(R6_CRYSTAL_BROOK_RESIDENT_PLACEMENTS).toHaveLength(1);
    expect(R6_CRYSTAL_BROOK_RESIDENT_PLACEMENTS[0].residentId).toBe('resident:echo');
    expect(R6_CRYSTAL_BROOK_RESIDENT_TALK_VARIANTS['resident:echo']).toHaveLength(3);
  });

  it('always gives the real quest hint while the Crystal Song is unfinished', () => {
    const flavour = ['The grotto sounds fuller now.', 'Ripple is listening too.'];
    for (const state of ['started', 'find-low-note', 'find-bright-note', 'find-bell-note'] as const) {
      for (const previousInteractions of [0, 1, 2, 7]) {
        expect(resolveEchoCrystalSongLine(
          { state, message: `quest:${state}` },
          flavour,
          previousInteractions,
        )).toBe(`quest:${state}`);
      }
    }
  });

  it('alternates Echo’s completed-song story response with her existing stateful dialogue', () => {
    const completed = { state: 'complete', message: 'The whole Brook remembers our notes.' } as const;
    const flavour = ['Your Crystal Chime is the small version.', 'Ripple says the Brook has another song.'];
    expect(resolveEchoCrystalSongLine(completed, flavour, 0)).toBe(completed.message);
    expect(resolveEchoCrystalSongLine(completed, flavour, 1)).toBe(flavour[0]);
    expect(resolveEchoCrystalSongLine(completed, flavour, 2)).toBe(completed.message);
    expect(resolveEchoCrystalSongLine(completed, flavour, 3)).toBe(flavour[1]);
  });
});
