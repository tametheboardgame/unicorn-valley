import type { RaceAssistanceMode } from './RaceSettings';

export type RaceDifficultyProfileId = 'early' | 'standard';

export interface RaceDifficultyProfile {
  id: RaceDifficultyProfileId;
  label: string;
  baseForwardSpeedMultiplier: number;
  obstacleClearanceAllowance: number;
  obstacleWidthMultiplier: number;
}

export interface RacePlayerTuning {
  forwardSpeedMultiplier: number;
  obstacleClearanceAllowance: number;
  obstacleWidthMultiplier: number;
}

export const EARLY_RACE_DIFFICULTY: RaceDifficultyProfile = {
  id: 'early',
  label: 'First Run',
  baseForwardSpeedMultiplier: 1,
  obstacleClearanceAllowance: 10,
  obstacleWidthMultiplier: 0.9,
};

export const STANDARD_RACE_DIFFICULTY: RaceDifficultyProfile = {
  id: 'standard',
  label: 'Standard Run',
  baseForwardSpeedMultiplier: 1,
  obstacleClearanceAllowance: 0,
  obstacleWidthMultiplier: 1,
};

export const EXTRA_HELP_SPEED_MULTIPLIER = 1.05;
export const EXTRA_HELP_CLEARANCE_ALLOWANCE = 18;
export const EXTRA_HELP_OBSTACLE_WIDTH_MULTIPLIER = 0.82;

export function resolveRacePlayerTuning(
  profile: RaceDifficultyProfile,
  assistanceMode: RaceAssistanceMode,
): RacePlayerTuning {
  if (assistanceMode === 'extra-help') {
    return {
      forwardSpeedMultiplier: profile.baseForwardSpeedMultiplier * EXTRA_HELP_SPEED_MULTIPLIER,
      obstacleClearanceAllowance:
        profile.obstacleClearanceAllowance + EXTRA_HELP_CLEARANCE_ALLOWANCE,
      obstacleWidthMultiplier:
        profile.obstacleWidthMultiplier * EXTRA_HELP_OBSTACLE_WIDTH_MULTIPLIER,
    };
  }

  return {
    forwardSpeedMultiplier: profile.baseForwardSpeedMultiplier,
    obstacleClearanceAllowance: profile.obstacleClearanceAllowance,
    obstacleWidthMultiplier: profile.obstacleWidthMultiplier,
  };
}
