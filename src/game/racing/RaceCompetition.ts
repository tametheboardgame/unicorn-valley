import type { RaceCourseDefinition } from './RaceCourse';
import { RACE_MAX_FRAME_SECONDS } from './RaceMovement';
import { createRaceRunState, stepRaceRun, type RaceRunState } from './RaceRun';

export interface NpcRacerDefinition {
  id: string;
  name: string;
  tint: number;
  laneOffset: number;
  baseSpeedMultiplier: number;
  paceVariance: number;
  variancePeriodSeconds: number;
  variancePhase: number;
  jumpLeadProgress: number;
  mistakeObstacleIds: readonly string[];
}

export interface NpcRacerState {
  id: string;
  run: RaceRunState;
  elapsedSeconds: number;
  finishTimeSeconds: number | null;
}

export interface RaceCompetitionState {
  npcRacers: readonly NpcRacerState[];
}

export interface RaceParticipantSnapshot {
  id: string;
  name: string;
  progress: number;
  finished: boolean;
  finishTimeSeconds: number | null;
  isPlayer: boolean;
}

export interface RaceStanding extends RaceParticipantSnapshot {
  place: number;
}

export const RAINBOW_RUN_NPC_RACERS = [
  {
    id: 'racer:nova',
    name: 'Nova',
    tint: 0xf09ad1,
    laneOffset: -34,
    baseSpeedMultiplier: 0.985,
    paceVariance: 0.018,
    variancePeriodSeconds: 2.8,
    variancePhase: 0.4,
    jumpLeadProgress: 118,
    mistakeObstacleIds: ['obstacle:rainbow-log-two', 'obstacle:cascade-reed-hurdle-one'],
  },
  {
    id: 'racer:clover',
    name: 'Clover',
    tint: 0xa8d87f,
    laneOffset: 18,
    baseSpeedMultiplier: 0.935,
    paceVariance: 0.028,
    variancePeriodSeconds: 3.4,
    variancePhase: 2.1,
    jumpLeadProgress: 112,
    mistakeObstacleIds: ['obstacle:flower-hurdle', 'obstacle:cascade-driftwood-two'],
  },
  {
    id: 'racer:breeze',
    name: 'Breeze',
    tint: 0x8fcde8,
    laneOffset: 48,
    baseSpeedMultiplier: 1.015,
    paceVariance: 0.035,
    variancePeriodSeconds: 2.2,
    variancePhase: 4.1,
    jumpLeadProgress: 118,
    mistakeObstacleIds: [
      'obstacle:rainbow-log-one',
      'obstacle:flower-hurdle',
      'obstacle:cascade-driftwood-one',
      'obstacle:cascade-reed-hurdle-two',
    ],
  },
] as const satisfies readonly NpcRacerDefinition[];

export function createRaceCompetitionState(
  definitions: readonly NpcRacerDefinition[] = RAINBOW_RUN_NPC_RACERS,
): RaceCompetitionState {
  return {
    npcRacers: definitions.map((definition) => ({
      id: definition.id,
      run: createRaceRunState(),
      elapsedSeconds: 0,
      finishTimeSeconds: null,
    })),
  };
}

export function getNpcPaceMultiplier(
  definition: NpcRacerDefinition,
  elapsedSeconds: number,
): number {
  const period = Math.max(0.1, definition.variancePeriodSeconds);
  const wave = Math.sin((elapsedSeconds / period) * Math.PI * 2 + definition.variancePhase);
  return Math.max(
    0.7,
    Math.min(1.2, definition.baseSpeedMultiplier + wave * definition.paceVariance),
  );
}

function shouldNpcJump(
  state: NpcRacerState,
  definition: NpcRacerDefinition,
  course: RaceCourseDefinition,
): boolean {
  if (!state.run.movement.grounded || state.run.movement.finished) {
    return false;
  }

  const nextObstacle = course.obstacles.find(
    (obstacle) =>
      obstacle.progress > state.run.movement.progress &&
      !state.run.hitObstacleIds.includes(obstacle.id),
  );

  if (!nextObstacle || definition.mistakeObstacleIds.includes(nextObstacle.id)) {
    return false;
  }

  const distance = nextObstacle.progress - state.run.movement.progress;
  return distance <= definition.jumpLeadProgress;
}

export function stepNpcRacer(
  state: NpcRacerState,
  definition: NpcRacerDefinition,
  course: RaceCourseDefinition,
  deltaSeconds: number,
): NpcRacerState {
  if (state.run.movement.finished) {
    return state;
  }

  const frameSeconds = Math.max(0, Math.min(deltaSeconds, RACE_MAX_FRAME_SECONDS));
  const elapsedSeconds = state.elapsedSeconds + frameSeconds;
  const jumpRequested = shouldNpcJump(state, definition, course);
  const paceMultiplier = getNpcPaceMultiplier(definition, state.elapsedSeconds);
  const result = stepRaceRun(state.run, course, frameSeconds, jumpRequested, paceMultiplier);
  const justFinished = !state.run.movement.finished && result.state.movement.finished;

  return {
    ...state,
    run: result.state,
    elapsedSeconds,
    finishTimeSeconds: justFinished ? elapsedSeconds : state.finishTimeSeconds,
  };
}

export function stepRaceCompetition(
  state: RaceCompetitionState,
  definitions: readonly NpcRacerDefinition[],
  course: RaceCourseDefinition,
  deltaSeconds: number,
): RaceCompetitionState {
  return {
    npcRacers: state.npcRacers.map((racer) => {
      const definition = definitions.find((candidate) => candidate.id === racer.id);
      return definition ? stepNpcRacer(racer, definition, course, deltaSeconds) : racer;
    }),
  };
}

export function getRaceStandings(
  player: RaceParticipantSnapshot,
  competition: RaceCompetitionState,
  definitions: readonly NpcRacerDefinition[],
): RaceStanding[] {
  const participants: Array<RaceParticipantSnapshot & { sourceIndex: number }> = [
    { ...player, sourceIndex: 0 },
  ];

  for (const racer of competition.npcRacers) {
    const definition = definitions.find((candidate) => candidate.id === racer.id);
    if (!definition) {
      continue;
    }
    participants.push({
      id: racer.id,
      name: definition.name,
      progress: racer.run.movement.progress,
      finished: racer.run.movement.finished,
      finishTimeSeconds: racer.finishTimeSeconds,
      isPlayer: false,
      sourceIndex: participants.length,
    });
  }

  participants.sort((left, right) => {
    if (left.finished !== right.finished) {
      return left.finished ? -1 : 1;
    }

    if (left.finished && right.finished) {
      const leftTime = left.finishTimeSeconds ?? Number.POSITIVE_INFINITY;
      const rightTime = right.finishTimeSeconds ?? Number.POSITIVE_INFINITY;
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }
    } else if (left.progress !== right.progress) {
      return right.progress - left.progress;
    }

    return left.sourceIndex - right.sourceIndex;
  });

  return participants.map((participant, index) => ({
    id: participant.id,
    name: participant.name,
    progress: participant.progress,
    finished: participant.finished,
    finishTimeSeconds: participant.finishTimeSeconds,
    isPlayer: participant.isPlayer,
    place: index + 1,
  }));
}

export function formatRacePlace(place: number): string {
  const positivePlace = Math.max(1, Math.floor(place));
  const lastTwo = positivePlace % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${positivePlace}th`;
  }

  switch (positivePlace % 10) {
    case 1:
      return `${positivePlace}st`;
    case 2:
      return `${positivePlace}nd`;
    case 3:
      return `${positivePlace}rd`;
    default:
      return `${positivePlace}th`;
  }
}
