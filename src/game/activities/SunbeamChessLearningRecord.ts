import {
  SUNBEAM_CHESS_LESSON_IDS,
  type SunbeamChessLessonId,
} from './SunbeamChessLessons';
import {
  SUNBEAM_CHESS_PUZZLE_IDS,
  type SunbeamChessPuzzleId,
} from './SunbeamChessPuzzles';
import {
  SUNBEAM_CHESS_OPPONENT_LEVELS,
  type SunbeamChessOpponentLevel,
} from './SunbeamChessOpponent';

export const SUNBEAM_CHESS_LEARNING_STORAGE_KEY = 'unicorn-valley.learning.sunbeam-chess.v1';
export const SUNBEAM_CHESS_LEARNING_RECORD_VERSION = 1;

export interface SunbeamChessLearningRecord {
  version: 1;
  completedLessonIds: SunbeamChessLessonId[];
  completedPuzzleIds: SunbeamChessPuzzleId[];
  puzzleSolveCounts: Partial<Record<SunbeamChessPuzzleId, number>>;
  preferredOpponent: SunbeamChessOpponentLevel;
}

export interface SunbeamChessLearningStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createDefaultSunbeamChessLearningRecord(): SunbeamChessLearningRecord {
  return {
    version: SUNBEAM_CHESS_LEARNING_RECORD_VERSION,
    completedLessonIds: [],
    completedPuzzleIds: [],
    puzzleSolveCounts: {},
    preferredOpponent: 'clover',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLessonId(value: unknown): value is SunbeamChessLessonId {
  return (
    typeof value === 'string' &&
    (SUNBEAM_CHESS_LESSON_IDS as readonly string[]).includes(value)
  );
}

function isPuzzleId(value: unknown): value is SunbeamChessPuzzleId {
  return (
    typeof value === 'string' &&
    (SUNBEAM_CHESS_PUZZLE_IDS as readonly string[]).includes(value)
  );
}

function isOpponentLevel(value: unknown): value is SunbeamChessOpponentLevel {
  return (
    typeof value === 'string' &&
    (SUNBEAM_CHESS_OPPONENT_LEVELS as readonly string[]).includes(value)
  );
}

function sanitiseIds<T extends string>(
  value: unknown,
  predicate: (entry: unknown) => entry is T,
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter(predicate))];
}

export function sanitiseSunbeamChessLearningRecord(
  value: unknown,
): SunbeamChessLearningRecord {
  const defaults = createDefaultSunbeamChessLearningRecord();
  if (!isRecord(value) || value.version !== SUNBEAM_CHESS_LEARNING_RECORD_VERSION) {
    return defaults;
  }

  const completedPuzzleIds = sanitiseIds(value.completedPuzzleIds, isPuzzleId);
  const rawCounts = isRecord(value.puzzleSolveCounts) ? value.puzzleSolveCounts : {};
  const puzzleSolveCounts: Partial<Record<SunbeamChessPuzzleId, number>> = {};

  for (const puzzleId of SUNBEAM_CHESS_PUZZLE_IDS) {
    const rawCount = rawCounts[puzzleId];
    if (typeof rawCount === 'number' && Number.isFinite(rawCount) && rawCount > 0) {
      puzzleSolveCounts[puzzleId] = Math.floor(rawCount);
    }
  }

  return {
    version: SUNBEAM_CHESS_LEARNING_RECORD_VERSION,
    completedLessonIds: sanitiseIds(value.completedLessonIds, isLessonId),
    completedPuzzleIds,
    puzzleSolveCounts,
    preferredOpponent: isOpponentLevel(value.preferredOpponent)
      ? value.preferredOpponent
      : defaults.preferredOpponent,
  };
}

export function loadSunbeamChessLearningRecord(
  storage: SunbeamChessLearningStorage,
): SunbeamChessLearningRecord {
  try {
    const serialised = storage.getItem(SUNBEAM_CHESS_LEARNING_STORAGE_KEY);
    if (!serialised) {
      return createDefaultSunbeamChessLearningRecord();
    }
    return sanitiseSunbeamChessLearningRecord(JSON.parse(serialised) as unknown);
  } catch {
    return createDefaultSunbeamChessLearningRecord();
  }
}

export function saveSunbeamChessLearningRecord(
  storage: SunbeamChessLearningStorage,
  record: SunbeamChessLearningRecord,
): boolean {
  try {
    storage.setItem(
      SUNBEAM_CHESS_LEARNING_STORAGE_KEY,
      JSON.stringify(sanitiseSunbeamChessLearningRecord(record)),
    );
    return true;
  } catch {
    return false;
  }
}

export function completeSunbeamChessLesson(
  record: SunbeamChessLearningRecord,
  lessonId: SunbeamChessLessonId,
): SunbeamChessLearningRecord {
  return {
    ...record,
    completedLessonIds: [...new Set([...record.completedLessonIds, lessonId])],
  };
}

export function completeSunbeamChessPuzzle(
  record: SunbeamChessLearningRecord,
  puzzleId: SunbeamChessPuzzleId,
): SunbeamChessLearningRecord {
  return {
    ...record,
    completedPuzzleIds: [...new Set([...record.completedPuzzleIds, puzzleId])],
    puzzleSolveCounts: {
      ...record.puzzleSolveCounts,
      [puzzleId]: (record.puzzleSolveCounts[puzzleId] ?? 0) + 1,
    },
  };
}

export function setSunbeamChessPreferredOpponent(
  record: SunbeamChessLearningRecord,
  preferredOpponent: SunbeamChessOpponentLevel,
): SunbeamChessLearningRecord {
  return {
    ...record,
    preferredOpponent,
  };
}

function browserStorage(): SunbeamChessLearningStorage {
  return {
    getItem: (key) => globalThis.localStorage.getItem(key),
    setItem: (key, value) => globalThis.localStorage.setItem(key, value),
  };
}

export function loadBrowserSunbeamChessLearningRecord(): SunbeamChessLearningRecord {
  return loadSunbeamChessLearningRecord(browserStorage());
}

export function saveBrowserSunbeamChessLearningRecord(
  record: SunbeamChessLearningRecord,
): boolean {
  return saveSunbeamChessLearningRecord(browserStorage(), record);
}
