import { describe, expect, it } from 'vitest';
import {
  SUNBEAM_CHESS_LEARNING_STORAGE_KEY,
  completeSunbeamChessLesson,
  completeSunbeamChessPuzzle,
  createDefaultSunbeamChessLearningRecord,
  clearSunbeamChessFriendlyMatch,
  loadSunbeamChessLearningRecord,
  saveSunbeamChessFriendlyMatch,
  saveSunbeamChessLearningRecord,
  setSunbeamChessPreferredOpponent,
  type SunbeamChessLearningStorage,
} from './SunbeamChessLearningRecord';

class MemoryStorage implements SunbeamChessLearningStorage {
  public readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('SunbeamChessLearningRecord', () => {
  it('starts empty and entirely separate from adventure save state', () => {
    expect(createDefaultSunbeamChessLearningRecord()).toEqual({
      version: 1,
      completedLessonIds: [],
      completedPuzzleIds: [],
      puzzleSolveCounts: {},
      preferredOpponent: 'clover',
      activeFriendlyMatch: null,
    });
    expect(SUNBEAM_CHESS_LEARNING_STORAGE_KEY).not.toContain('unicorn-valley.save');
  });

  it('records lessons idempotently and puzzle solve counts cumulatively', () => {
    let record = createDefaultSunbeamChessLearningRecord();
    record = completeSunbeamChessLesson(record, 'rook-rays');
    record = completeSunbeamChessLesson(record, 'rook-rays');
    record = completeSunbeamChessPuzzle(record, 'free-rook');
    record = completeSunbeamChessPuzzle(record, 'free-rook');

    expect(record.completedLessonIds).toEqual(['rook-rays']);
    expect(record.completedPuzzleIds).toEqual(['free-rook']);
    expect(record.puzzleSolveCounts['free-rook']).toBe(2);
  });

  it('persists and restores the preferred friendly opponent', () => {
    const storage = new MemoryStorage();
    const record = setSunbeamChessPreferredOpponent(
      createDefaultSunbeamChessLearningRecord(),
      'dandelion',
    );

    expect(saveSunbeamChessLearningRecord(storage, record)).toBe(true);
    expect(loadSunbeamChessLearningRecord(storage).preferredOpponent).toBe('dandelion');
  });

  it('sanitises unknown ids and invalid counts instead of leaking arbitrary state', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SUNBEAM_CHESS_LEARNING_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completedLessonIds: ['rook-rays', 'not-a-lesson'],
        completedPuzzleIds: ['free-rook', 'not-a-puzzle'],
        puzzleSolveCounts: { 'free-rook': 2.9, 'mate-in-one': -2, rogue: 99 },
        preferredOpponent: 'not-an-opponent',
        quests: { surprise: true },
      }),
    );

    expect(loadSunbeamChessLearningRecord(storage)).toEqual({
      version: 1,
      completedLessonIds: ['rook-rays'],
      completedPuzzleIds: ['free-rook'],
      puzzleSolveCounts: { 'free-rook': 2 },
      preferredOpponent: 'clover',
      activeFriendlyMatch: null,
    });
  });

  it('stores and restores a resumable legal Friendly Match PGN', () => {
    const storage = new MemoryStorage();
    let record = saveSunbeamChessFriendlyMatch(
      createDefaultSunbeamChessLearningRecord(),
      'dandelion',
      '1. e4 e5 2. Nf3',
    );

    expect(saveSunbeamChessLearningRecord(storage, record)).toBe(true);
    record = loadSunbeamChessLearningRecord(storage);

    expect(record.activeFriendlyMatch).toEqual({
      opponent: 'dandelion',
      pgn: '1. e4 e5 2. Nf3',
    });
    expect(record.preferredOpponent).toBe('dandelion');

    expect(clearSunbeamChessFriendlyMatch(record).activeFriendlyMatch).toBeNull();
  });

  it('drops corrupt or already-finished Friendly Match sessions', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SUNBEAM_CHESS_LEARNING_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultSunbeamChessLearningRecord(),
        activeFriendlyMatch: {
          opponent: 'clover',
          pgn: 'not valid pgn',
        },
      }),
    );
    expect(loadSunbeamChessLearningRecord(storage).activeFriendlyMatch).toBeNull();

    storage.setItem(
      SUNBEAM_CHESS_LEARNING_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultSunbeamChessLearningRecord(),
        activeFriendlyMatch: {
          opponent: 'sunbeam',
          pgn: '1. f3 e5 2. g4 Qh4#',
        },
      }),
    );
    expect(loadSunbeamChessLearningRecord(storage).activeFriendlyMatch).toBeNull();
  });

  it('fails soft when storage is unavailable or corrupt', () => {
    const brokenRead: SunbeamChessLearningStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => undefined,
    };
    const brokenWrite: SunbeamChessLearningStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const corrupt = new MemoryStorage();
    corrupt.setItem(SUNBEAM_CHESS_LEARNING_STORAGE_KEY, '{nope');

    expect(loadSunbeamChessLearningRecord(brokenRead)).toEqual(
      createDefaultSunbeamChessLearningRecord(),
    );
    expect(loadSunbeamChessLearningRecord(corrupt)).toEqual(
      createDefaultSunbeamChessLearningRecord(),
    );
    expect(
      saveSunbeamChessLearningRecord(brokenWrite, createDefaultSunbeamChessLearningRecord()),
    ).toBe(false);
  });
});
