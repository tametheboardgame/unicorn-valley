import { describe, expect, it } from 'vitest';
import { PRACTICE_RAINBOW_RUN_COURSE } from './RaceCourse';
import {
  RAINBOW_RUN_NPC_RACERS,
  createRaceCompetitionState,
  formatRacePlace,
  getNpcPaceMultiplier,
  getRaceStandings,
  stepRaceCompetition,
  type RaceCompetitionState,
  type RaceParticipantSnapshot,
} from './RaceCompetition';
import { createRaceRunState, stepRaceRun, type RaceRunState } from './RaceRun';

const STEP_SECONDS = 0.05;

function shouldCleanPlayerJump(run: RaceRunState): boolean {
  if (!run.movement.grounded) {
    return false;
  }

  const nextObstacle = PRACTICE_RAINBOW_RUN_COURSE.obstacles.find(
    (obstacle) =>
      obstacle.progress > run.movement.progress && !run.hitObstacleIds.includes(obstacle.id),
  );
  if (!nextObstacle) {
    return false;
  }

  return nextObstacle.progress - run.movement.progress <= 118;
}

function runFullRace(cleanPlayerRun: boolean): {
  player: RaceParticipantSnapshot;
  competition: RaceCompetitionState;
} {
  let run = createRaceRunState();
  let competition = createRaceCompetitionState();
  let elapsedSeconds = 0;
  let playerFinishTimeSeconds: number | null = null;

  for (let step = 0; step < 600; step += 1) {
    const wasFinished = run.movement.finished;
    const jumpRequested = cleanPlayerRun ? shouldCleanPlayerJump(run) : false;
    run = stepRaceRun(run, PRACTICE_RAINBOW_RUN_COURSE, STEP_SECONDS, jumpRequested).state;
    competition = stepRaceCompetition(
      competition,
      RAINBOW_RUN_NPC_RACERS,
      PRACTICE_RAINBOW_RUN_COURSE,
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

  return {
    player: {
      id: 'player',
      name: 'You',
      progress: run.movement.progress,
      finished: run.movement.finished,
      finishTimeSeconds: playerFinishTimeSeconds,
      isPlayer: true,
    },
    competition,
  };
}

describe('Rainbow Run NPC racers', () => {
  it('uses deterministic authored pace variance rather than player-relative rubber-banding', () => {
    const nova = RAINBOW_RUN_NPC_RACERS[0];
    const first = getNpcPaceMultiplier(nova, 3.25);
    const repeated = getNpcPaceMultiplier(nova, 3.25);

    expect(repeated).toBe(first);
    expect(first).toBeGreaterThanOrEqual(nova.baseSpeedMultiplier - nova.paceVariance);
    expect(first).toBeLessThanOrEqual(nova.baseSpeedMultiplier + nova.paceVariance);
  });

  it('lets every opponent finish the authored course reliably', () => {
    const result = runFullRace(true);

    for (const racer of result.competition.npcRacers) {
      expect(racer.run.movement.finished).toBe(true);
      expect(racer.finishTimeSeconds).not.toBeNull();
      expect(racer.finishTimeSeconds).toBeLessThan(20);
    }
  });

  it('makes the early field beatable without making victory automatic', () => {
    const cleanRace = runFullRace(true);
    const cleanStandings = getRaceStandings(
      cleanRace.player,
      cleanRace.competition,
      RAINBOW_RUN_NPC_RACERS,
    );
    expect(cleanStandings.find((standing) => standing.isPlayer)?.place).toBe(1);

    const mistakeRace = runFullRace(false);
    const mistakeStandings = getRaceStandings(
      mistakeRace.player,
      mistakeRace.competition,
      RAINBOW_RUN_NPC_RACERS,
    );
    expect(mistakeStandings.find((standing) => standing.isPlayer)?.place).toBeGreaterThan(1);
  });

  it('reports the live player position from actual race progress', () => {
    let competition = createRaceCompetitionState();
    for (let step = 0; step < 30; step += 1) {
      competition = stepRaceCompetition(
        competition,
        RAINBOW_RUN_NPC_RACERS,
        PRACTICE_RAINBOW_RUN_COURSE,
        STEP_SECONDS,
      );
    }

    const standings = getRaceStandings(
      {
        id: 'player',
        name: 'You',
        progress: 0,
        finished: false,
        finishTimeSeconds: null,
        isPlayer: true,
      },
      competition,
      RAINBOW_RUN_NPC_RACERS,
    );

    expect(standings.find((standing) => standing.isPlayer)?.place).toBe(4);
    expect(standings.map((standing) => standing.place)).toEqual([1, 2, 3, 4]);
  });

  it('orders completed racers by their recorded finish times', () => {
    const result = runFullRace(true);
    const standings = getRaceStandings(result.player, result.competition, RAINBOW_RUN_NPC_RACERS);
    const finishTimes = standings.map((standing) => standing.finishTimeSeconds ?? Infinity);

    expect(standings.every((standing) => standing.finished)).toBe(true);
    expect(finishTimes).toEqual([...finishTimes].sort((left, right) => left - right));
    expect(standings[0].isPlayer).toBe(true);
  });
});

describe('formatRacePlace', () => {
  it('formats child-facing ordinal positions', () => {
    expect(formatRacePlace(1)).toBe('1st');
    expect(formatRacePlace(2)).toBe('2nd');
    expect(formatRacePlace(3)).toBe('3rd');
    expect(formatRacePlace(4)).toBe('4th');
    expect(formatRacePlace(11)).toBe('11th');
  });
});
