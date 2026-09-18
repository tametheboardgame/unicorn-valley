import { describe, expect, it } from 'vitest';
import { createR4LongRunningSaveFixture } from './fixtures/r4LongRunningSaveFixture';
import { migrateSaveRecord, type SaveMigration } from './saveMigrations';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';
import { isSaveGame } from './saveValidation';

describe('migrateSaveRecord', () => {
  it('passes a current-version record through safely', () => {
    const current = { schemaVersion: CURRENT_SAVE_SCHEMA_VERSION, marker: 'current' };
    expect(migrateSaveRecord(current)).toEqual(current);
  });

  it('migrates the representative long-running schema-v1 save without losing progress', () => {
    const historical = {
      ...createR4LongRunningSaveFixture(),
      schemaVersion: 1,
    };

    const migrated = migrateSaveRecord(historical);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v1 fixture to migrate to a valid current save.');
    }

    expect(migrated.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(migrated.profile.name).toBe('Starlight');
    expect(migrated.inventory.itemQuantities['currency:shimmer']).toBe(18);
    expect(migrated.relationships.byCharacterId['character:willow']?.friendshipPoints).toBe(7);
    expect(migrated.quests.byQuestId['quest:pip-strange-egg']?.status).toBe('completed');
    expect(migrated.activities.racesById['race:rainbow-run']?.bestTimeMs).toBe(48200);
    expect(migrated.collections.memoryIds).toContain('memory:marigold-picnic');
    expect(migrated.home.style).toEqual({
      walls: {
        back: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
        left: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
        right: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
        front: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
      },
      floorStyleId: 'cottage-floor:honey-oak',
      furnitureVariants: {
        bed: 'cottage-furniture:bed:moonflower',
        sofa: 'cottage-furniture:sofa:sage',
        teaSet: 'cottage-furniture:tea-set:honey-oak',
        fireplace: 'cottage-furniture:fireplace:warm-stone',
      },
    });
  });

  it('adds explicit cottage style state when migrating a schema-v2 save', () => {
    const currentFixture = createR4LongRunningSaveFixture();
    const historicalV2 = {
      ...currentFixture,
      schemaVersion: 2,
      home: {
        ownedFurnitureIds: currentFixture.home.ownedFurnitureIds,
        furnitureBySlot: currentFixture.home.furnitureBySlot,
        gardenFlags: currentFixture.home.gardenFlags,
      },
    };

    const migrated = migrateSaveRecord(historicalV2);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v2 fixture to migrate to a valid current save.');
    }

    expect(migrated.home.style).toEqual({
      walls: {
        back: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
        left: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
        right: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
        front: {
          wallColourId: 'cottage-wall:moon-cream',
          wallpaperId: 'cottage-wallpaper:plain',
        },
      },
      floorStyleId: 'cottage-floor:honey-oak',
      furnitureVariants: {
        bed: 'cottage-furniture:bed:moonflower',
        sofa: 'cottage-furniture:sofa:sage',
        teaSet: 'cottage-furniture:tea-set:honey-oak',
        fireplace: 'cottage-furniture:fireplace:warm-stone',
      },
    });
  });

  it('copies a schema-v3 room-wide wall style onto all four walls', () => {
    const currentFixture = createR4LongRunningSaveFixture();
    const historicalV3 = {
      ...currentFixture,
      schemaVersion: 3,
      home: {
        ...currentFixture.home,
        style: {
          wallColourId: 'cottage-wall:misty-lilac',
          wallpaperId: 'cottage-wallpaper:moon-sprigs',
          floorStyleId: 'cottage-floor:rosewood',
        },
      },
    };

    const migrated = migrateSaveRecord(historicalV3);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v3 fixture to migrate to a valid current save.');
    }

    expect(
      new Set(Object.values(migrated.home.style.walls).map((wall) => wall.wallColourId)),
    ).toEqual(new Set(['cottage-wall:misty-lilac']));
    expect(
      new Set(Object.values(migrated.home.style.walls).map((wall) => wall.wallpaperId)),
    ).toEqual(new Set(['cottage-wallpaper:moon-sprigs']));
    expect(migrated.home.style.floorStyleId).toBe('cottage-floor:rosewood');
  });

  it('adds appearance-preserving furniture variants when migrating schema v4', () => {
    const currentFixture = createR4LongRunningSaveFixture();
    const historicalV4 = {
      ...currentFixture,
      schemaVersion: 4,
      home: {
        ...currentFixture.home,
        style: {
          walls: currentFixture.home.style.walls,
          floorStyleId: currentFixture.home.style.floorStyleId,
        },
      },
    };

    const migrated = migrateSaveRecord(historicalV4);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v4 fixture to migrate to a valid current save.');
    }

    expect(migrated.home.style.furnitureVariants).toEqual({
      bed: 'cottage-furniture:bed:moonflower',
      sofa: 'cottage-furniture:sofa:sage',
      teaSet: 'cottage-furniture:tea-set:honey-oak',
      fireplace: 'cottage-furniture:fireplace:warm-stone',
    });
  });

  it('applies migrations sequentially', () => {
    const toVersionOne: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 1,
      firstMigration: true,
    });
    const toVersionTwo: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 2,
      secondMigration: true,
    });
    const toVersionThree: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 3,
      thirdMigration: true,
    });
    const toVersionFour: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 4,
      fourthMigration: true,
    });
    const toVersionFive: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 5,
      fifthMigration: true,
    });
    const migrations = new Map([
      [0, toVersionOne],
      [1, toVersionTwo],
      [2, toVersionThree],
      [3, toVersionFour],
      [4, toVersionFive],
    ]);

    expect(migrateSaveRecord({ schemaVersion: 0 }, migrations)).toEqual({
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      firstMigration: true,
      secondMigration: true,
      thirdMigration: true,
      fourthMigration: true,
      fifthMigration: true,
    });
  });

  it('rejects unsupported, missing or non-sequential migrations', () => {
    expect(migrateSaveRecord({ schemaVersion: 0 })).toBeNull();
    expect(migrateSaveRecord({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1 })).toBeNull();
    expect(
      migrateSaveRecord(
        { schemaVersion: 0 },
        new Map([[0, () => ({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION })]]),
      ),
    ).toBeNull();
  });
});
