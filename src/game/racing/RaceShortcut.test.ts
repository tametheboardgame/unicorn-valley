import { describe, expect, it } from 'vitest';
import { CRYSTAL_CASCADE_RACE_COURSE } from './RaceCourse';
import {
  RAINBOW_RUN_NPC_RACERS,
  createRaceCompetitionState,
  stepRaceCompetition,
} from './RaceCompetition';
import { createRaceMovementState } from './RaceMovement';
import { createRaceRunState, stepRaceRun, type RaceRunState } from './RaceRun';
import { CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT } from './RaceShortcut';

function airborneState(progress: number, height: number): RaceRunState {
  return {
    ...createRaceRunState(),
    movement: {
      ...createRaceMovementState(),
      progress,
      jumpOffset: -height,
      grounded: false,
      verticalVelocity: 0,
    },
  };
}

describe('R5-WP5.9D Prism Current route variation', () => {
  it('carries an airborne player forward when they take the Prism Current entry', () => {
    const before = CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT.entryStartProgress - 4;
    const result = stepRaceRun(
      airborneState(before, 70),
      CRYSTAL_CASCADE_RACE_COURSE,
      0.05,
      false,
    );

    expect(result.events.some((event) => event.type === 'shortcut-taken')).toBe(true);
    expect(result.state.usedShortcutIds).toContain(CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT.id);
    expect(result.state.movement.progress - before).toBeGreaterThan(
      CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT.progressSkip,
    );
  });

  it('leaves the ground route intact when the player does not jump into the current', () => {
    const before = CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT.entryStartProgress - 4;
    const result = stepRaceRun(
      {
        ...createRaceRunState(),
        movement: { ...createRaceMovementState(), progress: before },
      },
      CRYSTAL_CASCADE_RACE_COURSE,
      0.05,
      false,
    );

    expect(result.events.some((event) => event.type === 'shortcut-taken')).toBe(false);
    expect(result.state.usedShortcutIds).toEqual([]);
  });

  it('does not apply the same shortcut more than once', () => {
    const shortcut = CRYSTAL_CASCADE_PRISM_CURRENT_SHORTCUT;
    const result = stepRaceRun(
      {
        ...airborneState(shortcut.entryStartProgress, 70),
        usedShortcutIds: [shortcut.id],
      },
      CRYSTAL_CASCADE_RACE_COURSE,
      0.05,
      false,
    );

    expect(result.events.some((event) => event.type === 'shortcut-taken')).toBe(false);
  });

  it('allows the existing AI field to finish Crystal Cascade without using the shortcut', () => {
    let competition = createRaceCompetitionState();

    for (let step = 0; step < 2_000; step += 1) {
      competition = stepRaceCompetition(
        competition,
        RAINBOW_RUN_NPC_RACERS,
        CRYSTAL_CASCADE_RACE_COURSE,
        0.05,
      );
      if (competition.npcRacers.every((racer) => racer.run.movement.finished)) {
        break;
      }
    }

    expect(competition.npcRacers.every((racer) => racer.run.movement.finished)).toBe(true);
  });
});
