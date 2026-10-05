export const SUNBEAM_CHESS_ACADEMY_MODES = [
  'lessons',
  'puzzle-garden',
  'coach-match',
  'friendly-match',
] as const;

export type SunbeamChessAcademyMode = (typeof SUNBEAM_CHESS_ACADEMY_MODES)[number];
export type SunbeamChessAcademyAvailability = 'available' | 'coming-soon';

export interface SunbeamChessAcademyModeDefinition {
  id: SunbeamChessAcademyMode;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  availability: SunbeamChessAcademyAvailability;
}

export const SUNBEAM_CHESS_ACADEMY_MODE_DEFINITIONS = [
  {
    id: 'lessons',
    title: 'Lessons',
    shortTitle: 'Lessons',
    description: 'Learn one chess idea at a time with tiny board challenges.',
    icon: '✦',
    availability: 'available',
  },
  {
    id: 'puzzle-garden',
    title: 'Puzzle Garden',
    shortTitle: 'Puzzles',
    description: 'Spot clever checks, captures and escapes in little positions.',
    icon: '🌱',
    availability: 'available',
  },
  {
    id: 'coach-match',
    title: 'Coach Match',
    shortTitle: 'Coach',
    description: 'Play a real game with gentle help when you want it.',
    icon: '🦄',
    availability: 'available',
  },
  {
    id: 'friendly-match',
    title: 'Friendly Match',
    shortTitle: 'Play',
    description: 'Play the existing full chess game with simple hints.',
    icon: '♟',
    availability: 'available',
  },
] as const satisfies readonly SunbeamChessAcademyModeDefinition[];

export function getSunbeamChessAcademyMode(
  id: SunbeamChessAcademyMode,
): SunbeamChessAcademyModeDefinition {
  const mode = SUNBEAM_CHESS_ACADEMY_MODE_DEFINITIONS.find((definition) => definition.id === id);
  if (!mode) {
    throw new Error(`Unknown Sunbeam Chess Academy mode: ${id}`);
  }
  return mode;
}
