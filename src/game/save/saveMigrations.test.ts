import { describe, expect, it } from 'vitest';
import { createR4LongRunningSaveFixture } from './fixtures/r4LongRunningSaveFixture';
import { createCrystalariumFullState } from '../minigames/crystalarium/CrystalariumFullRules';
import { isCrystalariumPotionState, POTION_CAPACITY } from '../minigames/crystalarium/CrystalariumPotionRules';
import {
  grantCottageStarterDecorations,
  migrateSaveRecord,
  type SaveMigration,
} from './saveMigrations';
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

  it('grants the starter collection to an existing save without disturbing its contents', () => {
    const currentFixture = createR4LongRunningSaveFixture();
    const historicalV5 = {
      ...currentFixture,
      schemaVersion: 5,
      inventory: {
        ...currentFixture.inventory,
        itemQuantities: {
          ...currentFixture.inventory.itemQuantities,
          'item:starter-moonflower-hoop': 3,
          'item:cloud-cushion': 2,
        },
        ownedDecorationIds: ['item:cloud-cushion'],
      },
      home: {
        ...currentFixture.home,
        furnitureBySlot: {
          'cottage-slot:cosy-corner': 'item:cloud-cushion',
        },
      },
    };

    const migrated = migrateSaveRecord(historicalV5);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v5 fixture to migrate to a valid current save.');
    }

    expect(migrated.inventory.itemQuantities).toMatchObject({
      'item:starter-moonflower-hoop': 3,
      'item:starter-star-bunting': 1,
      'item:starter-meadow-rug': 1,
      'item:starter-daisy-vase': 1,
      'item:cloud-cushion': 2,
    });
    expect(migrated.inventory.ownedDecorationIds).toEqual(
      expect.arrayContaining([
        'item:cloud-cushion',
        'item:starter-moonflower-hoop',
        'item:starter-star-bunting',
      ]),
    );
    expect(migrated.home.furnitureBySlot).toEqual(historicalV5.home.furnitureBySlot);
  });

  it('applies the starter grant idempotently while preserving larger and unrelated quantities', () => {
    const save = {
      schemaVersion: 5,
      inventory: {
        itemQuantities: {
          'item:starter-daisy-vase': 4,
          'item:berry-bun': 7,
        },
        ownedDecorationIds: ['item:starter-daisy-vase'],
        specialItemIds: ['item:storybook-key'],
      },
    };

    const once = grantCottageStarterDecorations(save);
    const twice = grantCottageStarterDecorations(once);

    expect(twice).toEqual(once);
    expect((twice.inventory as Record<string, unknown>).itemQuantities).toMatchObject({
      'item:starter-daisy-vase': 4,
      'item:berry-bun': 7,
    });
    expect((twice.inventory as Record<string, unknown>).specialItemIds).toEqual([
      'item:storybook-key',
    ]);
  });

  it('grandfathers selected schema-v6 styles while keeping other unlockables locked', () => {
    const currentFixture = createR4LongRunningSaveFixture();
    const { unlockedStyleIds: _unlockedStyleIds, ...legacyHome } = currentFixture.home;
    const historicalV6 = {
      ...currentFixture,
      schemaVersion: 6,
      home: {
        ...legacyHome,
        style: {
          ...currentFixture.home.style,
          walls: {
            ...currentFixture.home.style.walls,
            left: {
              ...currentFixture.home.style.walls.left,
              wallColourId: 'cottage-wall:sea-glass',
            },
          },
        },
      },
    };

    const migrated = migrateSaveRecord(historicalV6);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v6 fixture to migrate to a valid current save.');
    }

    expect(migrated.home.unlockedStyleIds).toContain('cottage-wall:sea-glass');
    expect(migrated.home.unlockedStyleIds).not.toContain('cottage-wall:buttercup');
  });

  it('adds durable story reading state when migrating a schema-v8 save', () => {
    const current = createR4LongRunningSaveFixture();
    const { storyReading: _storyReading, ...historical } = current;
    const migrated = migrateSaveRecord({
      ...historical,
      schemaVersion: 8,
    });

    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v8 fixture to migrate to a valid current save.');
    }

    expect(migrated.storyReading).toEqual({
      preferences: {
        fontSize: 20,
        lineHeight: 1.7,
        illustrationSetByStoryEditionKey: {},
        coverStyle: 'modern',
      },
      byStoryId: {},
    });
  });

  it('upgrades a version-nine adventure without changing other progress', () => {
    const save = createR4LongRunningSaveFixture();
    const historical = {
      ...save,
      schemaVersion: 9,
      activities: { ...save.activities, crystalarium: undefined },
    };
    const migrated = migrateSaveRecord(historical);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) throw new Error('Expected v10 adventure');
    expect(migrated.activities.crystalarium).toBeNull();
    expect(migrated.quests).toEqual(save.quests);
    expect(migrated.inventory).toEqual(save.inventory);
    expect(migrated.world).toEqual(save.world);
  });

  it('migrates schema-ten Crystalarium progress to 12-slot v3 without losing pieces or world data', () => {
    const world = createR4LongRunningSaveFixture();
    const old = createCrystalariumFullState();
    const cells = [...old.cells];
    cells[7] = { family: 'bright' as const, tier: 3 as const };
    const shelf = [...old.shelf];
    shelf[2] = { family: 'bell' as const, tier: 4 as const };
    const oldCrystalarium = { ...old, cells, shelf, completed: 7, merges: 40, harmonies: 2 };
    const previous = {
      ...world,
      schemaVersion: 10,
      activities: {
        ...world.activities,
        crystalarium: oldCrystalarium,
      },
    };
    const before = JSON.stringify(previous);
    const migrated = migrateSaveRecord(previous);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) throw new Error('V12 migration failed');
    expect(migrated.schemaVersion).toBe(13);
    expect(isCrystalariumPotionState(migrated.activities.crystalarium)).toBe(true);
    const queue = migrated.activities.crystalarium;
    expect(queue?.version).toBe(4);
    expect(queue && 'potion' in queue ? queue.potion : null).toBe(POTION_CAPACITY);
    expect(queue?.cells).toEqual(cells);
    expect(queue?.shelf.slice(0, 4)).toEqual(shelf);
    expect(queue?.shelf).toHaveLength(12);
    expect(queue?.shelf.slice(4).every((piece) => piece === null)).toBe(true);
    expect(queue?.completed).toBe(7);
    expect(queue?.harmonies).toBe(2);
    expect(queue?.merges).toBe(40);
    expect(migrated.quests).toEqual(world.quests);
    expect(migrated.inventory).toEqual(world.inventory);
    expect(migrated.world).toEqual(world.world);
    expect(JSON.stringify(previous)).toBe(before);
    expect(migrateSaveRecord(migrated)).toEqual(migrated);
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
    const toVersionSix: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 6,
      sixthMigration: true,
    });
    const toVersionSeven: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 7,
      seventhMigration: true,
      eighthMigration: true,
      ninthMigration: true,
    });
    const toVersionEight: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 8,
      eighthMigration: true,
    });
    const toVersionNine: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 9,
      ninthMigration: true,
    });
    const toVersionTen: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 10,
      tenthMigration: true,
      eleventhMigration: true,
    });
    const toVersionEleven: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 11,
      eleventhMigration: true,
    });
    const toVersionTwelve: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 12,
    });
    const migrations = new Map([
      [0, toVersionOne],
      [1, toVersionTwo],
      [2, toVersionThree],
      [3, toVersionFour],
      [4, toVersionFive],
      [5, toVersionSix],
      [6, toVersionSeven],
      [7, toVersionEight],
      [8, toVersionNine],
      [9, toVersionTen],
      [10, toVersionEleven],
      [11, toVersionTwelve],
    ]);

    expect(migrateSaveRecord({ schemaVersion: 0 }, migrations)).toEqual({
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      firstMigration: true,
      secondMigration: true,
      thirdMigration: true,
      fourthMigration: true,
      fifthMigration: true,
      sixthMigration: true,
      seventhMigration: true,
      eighthMigration: true,
      ninthMigration: true,
      tenthMigration: true,
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
