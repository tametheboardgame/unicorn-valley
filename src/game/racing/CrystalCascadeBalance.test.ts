import { describe, expect, it } from 'vitest';
import {
  RAINBOW_RUN_NPC_RACERS,
  createRaceCompetitionState,
  getRaceStandings,
  stepRaceCompetition,
  type RaceCompetitionState,
} from './RaceCompetition';
import { CRYSTAL_CASCADE_RACE_COURSE } from './RaceCourse';
import { createRaceRunState, stepRaceRun, type RaceRunState } from './RaceRun';

const STEP_SECONDS = 0.05;
const CLEAN_JUMP_LEAD = 118;

interface SimulatedRace {
  player: RaceRunState;
  playerFinishTimeSeconds: number;
  competition: RaceCompetitionState;
}

function shouldJumpForNextObstacle(run: RaceRunState, missedObstacleId?: string): boolean {
  if (!run.movement.grounded) {
    return false;
  }

  const nextObstacle = CRYSTAL_CASCADE_RACE_COURSE.obstacles.find(
    (obstacle) =>
      obstacle.progress > run.movement.progress && !run.hitObstacleIds.includes(obstacle.id),
  );
  if (!nextObstacle || nextObstacle.id === missedObstacleId) {
    return false;
  }

  return nextObstacle.progress - run.movement.progress <= CLEAN_JUMP_LEAD;
}

function simulateStandardPlayer(missedObstacleId?: string): SimulatedRace {
  let player = createRaceRunState();
  let competition = createRaceCompetitionState();
  let elapsedSeconds = 0;
  let playerFinishTimeSeconds: number | null = null;

  while (
    elapsedSeconds < 25 &&
    (!player.movement.finished ||
      competition.npcRacers.some((racer) => !racer.run.movement.finished))
  ) {
    if (!player.movement.finished) {
      const jumpRequested = shouldJumpForNextObstacle(player, missedObstacleId);
      const result = stepRaceRun(
        player,
        CRYSTAL_CASCADE_RACE_COURSE,
        STEP_SECONDS,
        jumpRequested,
        1,
      );
      if (!player.movement.finished && result.state.movement.finished) {
        playerFinishTimeSeconds = elapsedSeconds + STEP_SECONDS;
      }
      player = result.state;
    }

    competition = stepRaceCompetition(
      competition,
      RAINBOW_RUN_NPC_RACERS,
      CRYSTAL_CASCADE_RACE_COURSE,
      STEP_SECONDS,
    );
    elapsedSeconds += STEP_SECONDS;
  }

  if (playerFinishTimeSeconds === null) {
    throw new Error('Standard player did not finish Crystal Cascade during the simulation window.');
  }

  return { player, playerFinishTimeSeconds, competition };
}

function playerPlace(result: SimulatedRace): number {
  return (
    getRaceStandings(
      {
        id: 'player',
        name: 'You',
        progress: result.player.movement.progress,
        finished: result.player.movement.finished,
        finishTimeSeconds: result.playerFinishTimeSeconds,
        isPlayer: true,
      },
      result.competition,
      RAINBOW_RUN_NPC_RACERS,
    ).find((standing) => standing.isPlayer)?.place ?? 99
  );
}

describe('Crystal Cascade human winability', () => {
  it('gives every NPC an intentional Crystal Cascade mistake', () => {
    const cascadeObstacleIds = new Set<string>(
      CRYSTAL_CASCADE_RACE_COURSE.obstacles.map((obstacle) => obstacle.id),
    );

    for (const racer of RAINBOW_RUN_NPC_RACERS) {
      expect(racer.mistakeObstacleIds.some((id) => cascadeObstacleIds.has(id))).toBe(true);
    }
  });

  it('lets a clean standard player win without needing the Prism Current shortcut', () => {
    const result = simulateStandardPlayer();

    expect(result.player.hitObstacleIds).toHaveLength(0);
    expect(result.player.usedShortcutIds).toHaveLength(0);
    expect(playerPlace(result)).toBe(1);
    expect(result.playerFinishTimeSeconds).toBeLessThan(9.6);
  });

  it('still gives a competent standard player a realistic first-place route after one mistake', () => {
    const result = simulateStandardPlayer('obstacle:cascade-reed-hurdle-one');

    expect(result.player.hitObstacleIds).toContain('obstacle:cascade-reed-hurdle-one');
    expect(result.player.usedShortcutIds).toHaveLength(0);
    expect(playerPlace(result)).toBe(1);
  });
});
