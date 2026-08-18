import { describe, expect, it } from 'vitest';
import { NOVA_TUTORIAL_RACE_ID, SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  createRaceCompetitionState,
  getRaceStandings,
  stepRaceCompetition,
  type NpcRacerDefinition,
} from './RaceCompetition';
import {
  NOVA_TUTORIAL_RAINBOW_RUN_COURSE,
  PRACTICE_RAINBOW_RUN_COURSE,
  validateRaceCourse,
} from './RaceCourse';
import { EARLY_RACE_DIFFICULTY, resolveRacePlayerTuning } from './RaceDifficulty';
import {
  RAINBOW_RUN_FINISHER_RIBBON_ID,
  RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID,
  applyRaceResultToSave,
} from './RaceResults';
import { createRaceRunState, stepRaceRun, type RaceRunState } from './RaceRun';

const STEP_SECONDS = 0.05;
const TUTORIAL_NOVA = [
  {
    id: 'racer:nova',
    name: 'Nova',
    tint: 0xf09ad1,
    laneOffset: 34,
    baseSpeedMultiplier: 0.96,
    paceVariance: 0.018,
    variancePeriodSeconds: 2.8,
    variancePhase: 0.4,
    jumpLeadProgress: 120,
    mistakeObstacleIds: [],
  },
] as const satisfies readonly NpcRacerDefinition[];

function shouldJumpTutorialObstacle(run: RaceRunState): boolean {
  if (!run.movement.grounded) {
    return false;
  }

  const nextObstacle = NOVA_TUTORIAL_RAINBOW_RUN_COURSE.obstacles.find(
    (obstacle) =>
      obstacle.progress > run.movement.progress && !run.hitObstacleIds.includes(obstacle.id),
  );
  if (!nextObstacle) {
    return false;
  }

  return nextObstacle.progress - run.movement.progress <= 120;
}

function runTutorialRace(jumpCleanly: boolean): number {
  let run = createRaceRunState();
  let competition = createRaceCompetitionState(TUTORIAL_NOVA);
  let elapsedSeconds = 0;
  let playerFinishTimeSeconds: number | null = null;
  const tuning = resolveRacePlayerTuning(EARLY_RACE_DIFFICULTY, 'standard');

  for (let step = 0; step < 600; step += 1) {
    const wasFinished = run.movement.finished;
    run = stepRaceRun(
      run,
      NOVA_TUTORIAL_RAINBOW_RUN_COURSE,
      STEP_SECONDS,
      jumpCleanly ? shouldJumpTutorialObstacle(run) : false,
      tuning.forwardSpeedMultiplier,
      tuning,
    ).state;
    competition = stepRaceCompetition(
      competition,
      TUTORIAL_NOVA,
      NOVA_TUTORIAL_RAINBOW_RUN_COURSE,
      STEP_SECONDS,
    );
    elapsedSeconds += STEP_SECONDS;

    if (!wasFinished && run.movement.finished) {
      playerFinishTimeSeconds = elapsedSeconds;
    }

    if (
      run.movement.finished &&
      competition.npcRacers.every((racer) => racer.run.movement.finished)
    ) {
      break;
    }
  }

  const standings = getRaceStandings(
    {
      id: 'player',
      name: 'You',
      progress: run.movement.progress,
      finished: run.movement.finished,
      finishTimeSeconds: playerFinishTimeSeconds,
      isPlayer: true,
    },
    competition,
    TUTORIAL_NOVA,
  );

  return standings.find((standing) => standing.isPlayer)?.place ?? 2;
}

describe("Nova's first race", () => {
  it('uses a simpler tutorial course before the named Sunrise Sprint', () => {
    expect(NOVA_TUTORIAL_RAINBOW_RUN_COURSE.id).toBe(NOVA_TUTORIAL_RACE_ID);
    expect(PRACTICE_RAINBOW_RUN_COURSE.id).toBe(SUNRISE_SPRINT_RACE_ID);
    expect(PRACTICE_RAINBOW_RUN_COURSE.name).toBe('Sunrise Sprint');
    expect(NOVA_TUTORIAL_RAINBOW_RUN_COURSE.obstacles.length).toBeLessThan(
      PRACTICE_RAINBOW_RUN_COURSE.obstacles.length,
    );
    expect(validateRaceCourse(NOVA_TUTORIAL_RAINBOW_RUN_COURSE)).toEqual([]);
    expect(validateRaceCourse(PRACTICE_RAINBOW_RUN_COURSE)).toEqual([]);
  });

  it('rewards using the tutorial jump without making first place automatic', () => {
    expect(runTutorialRace(true)).toBe(1);
    expect(runTutorialRace(false)).toBe(2);
  });

  it('awards the first finisher ribbon even when Nova finishes first', () => {
    const save = createDefaultSave('2026-08-18T06:00:00.000Z');
    const result = applyRaceResultToSave(save, {
      raceId: NOVA_TUTORIAL_RACE_ID,
      finishTimeMs: 16_000,
      place: 2,
      participantCount: 2,
    });

    expect(result.summary.newRibbonIds).toContain(RAINBOW_RUN_FINISHER_RIBBON_ID);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID]).toBe(1);
  });

  it('does not pretend the same keepsake is new when the follow-up race is unlocked', () => {
    const save = createDefaultSave('2026-08-18T06:00:00.000Z');
    const tutorial = applyRaceResultToSave(save, {
      raceId: NOVA_TUTORIAL_RACE_ID,
      finishTimeMs: 15_000,
      place: 2,
      participantCount: 2,
    });
    const followUp = applyRaceResultToSave(tutorial.save, {
      raceId: SUNRISE_SPRINT_RACE_ID,
      finishTimeMs: 14_000,
      place: 4,
      participantCount: 4,
    });

    expect(followUp.summary.newRibbonIds).not.toContain(RAINBOW_RUN_FINISHER_RIBBON_ID);
    expect(followUp.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID]).toBe(1);
  });
});
