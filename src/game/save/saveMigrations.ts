import { createDefaultSave } from './createDefaultSave';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

export type SaveRecord = Record<string, unknown>;
export type SaveMigration = (save: SaveRecord) => SaveRecord;

function isRecord(value: unknown): value is SaveRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeRecord<T extends object>(defaultValue: T, value: unknown): T {
  return (isRecord(value) ? { ...defaultValue, ...value } : { ...defaultValue }) as T;
}

const migrateV1ToV2: SaveMigration = (save) => {
  const timestamp =
    typeof save.createdAt === 'string' ? save.createdAt : '1970-01-01T00:00:00.000Z';
  const defaults = createDefaultSave(timestamp);

  return {
    ...defaults,
    ...save,
    schemaVersion: 2,
    profile: mergeRecord(defaults.profile, save.profile),
    inventory: mergeRecord(defaults.inventory, save.inventory),
    relationships: mergeRecord(defaults.relationships, save.relationships),
    quests: mergeRecord(defaults.quests, save.quests),
    world: mergeRecord(defaults.world, save.world),
    home: mergeRecord(defaults.home, save.home),
    activities: mergeRecord(defaults.activities, save.activities),
    collections: mergeRecord(defaults.collections, save.collections),
  };
};

const migrateV2ToV3: SaveMigration = (save) => {
  const timestamp =
    typeof save.createdAt === 'string' ? save.createdAt : '1970-01-01T00:00:00.000Z';
  const defaults = createDefaultSave(timestamp);
  const home = mergeRecord(defaults.home, save.home);
  const sourceStyle: SaveRecord = isRecord(home.style) ? home.style : {};
  const sourceWalls: SaveRecord = isRecord(sourceStyle.walls) ? sourceStyle.walls : {};
  const sourceBackWall: SaveRecord = isRecord(sourceWalls.back) ? sourceWalls.back : {};

  return {
    ...save,
    schemaVersion: 3,
    home: {
      ...home,
      style: {
        wallColourId:
          typeof sourceStyle.wallColourId === 'string'
            ? sourceStyle.wallColourId
            : typeof sourceBackWall.wallColourId === 'string'
              ? sourceBackWall.wallColourId
              : defaults.home.style.walls.back.wallColourId,
        wallpaperId:
          typeof sourceStyle.wallpaperId === 'string'
            ? sourceStyle.wallpaperId
            : typeof sourceBackWall.wallpaperId === 'string'
              ? sourceBackWall.wallpaperId
              : defaults.home.style.walls.back.wallpaperId,
        floorStyleId:
          typeof sourceStyle.floorStyleId === 'string'
            ? sourceStyle.floorStyleId
            : defaults.home.style.floorStyleId,
      },
    },
  };
};

const migrateV3ToV4: SaveMigration = (save) => {
  const timestamp =
    typeof save.createdAt === 'string' ? save.createdAt : '1970-01-01T00:00:00.000Z';
  const defaults = createDefaultSave(timestamp);
  const home = mergeRecord(defaults.home, save.home);
  const sourceStyle: SaveRecord = isRecord(home.style) ? home.style : {};
  const sourceColour =
    typeof sourceStyle.wallColourId === 'string'
      ? sourceStyle.wallColourId
      : defaults.home.style.walls.back.wallColourId;
  const sourceWallpaper =
    typeof sourceStyle.wallpaperId === 'string'
      ? sourceStyle.wallpaperId
      : defaults.home.style.walls.back.wallpaperId;
  const wall = {
    wallColourId: sourceColour,
    wallpaperId: sourceWallpaper,
  };

  return {
    ...save,
    schemaVersion: 4,
    home: {
      ...home,
      style: {
        walls: {
          back: { ...wall },
          left: { ...wall },
          right: { ...wall },
          front: { ...wall },
        },
        floorStyleId:
          typeof sourceStyle.floorStyleId === 'string'
            ? sourceStyle.floorStyleId
            : defaults.home.style.floorStyleId,
      },
    },
  };
};

const migrateV4ToV5: SaveMigration = (save) => {
  const timestamp =
    typeof save.createdAt === 'string' ? save.createdAt : '1970-01-01T00:00:00.000Z';
  const defaults = createDefaultSave(timestamp);
  const home = mergeRecord(defaults.home, save.home);
  const sourceStyle: SaveRecord = isRecord(home.style) ? home.style : {};

  return {
    ...save,
    schemaVersion: 5,
    home: {
      ...home,
      style: {
        ...defaults.home.style,
        ...sourceStyle,
        furnitureVariants: { ...defaults.home.style.furnitureVariants },
      },
    },
  };
};

/** Grants only the dedicated starter collection and never changes placements or larger holdings. */
export const grantCottageStarterDecorations = (save: SaveRecord): SaveRecord => {
  const inventory = save.inventory as SaveRecord;
  const itemQuantities = { ...(inventory.itemQuantities as Record<string, number>) };
  const ownedDecorationIds = [...(inventory.ownedDecorationIds as string[])];
  for (const itemId of COTTAGE_STARTER_DECORATION_IDS) {
    itemQuantities[itemId] = Math.max(1, itemQuantities[itemId] ?? 0);
    if (!ownedDecorationIds.includes(itemId)) ownedDecorationIds.push(itemId);
  }

  return {
    ...save,
    inventory: {
      ...inventory,
      itemQuantities,
      // Retained as the legacy ownership mirror required by the current save contract.
      ownedDecorationIds,
    },
  };
};

const migrateV5ToV6: SaveMigration = (save) => ({
  ...grantCottageStarterDecorations(save),
  schemaVersion: 6,
});

const migrateV6ToV7: SaveMigration = (save) => {
  const timestamp =
    typeof save.createdAt === 'string' ? save.createdAt : '1970-01-01T00:00:00.000Z';
  const defaults = createDefaultSave(timestamp);
  const home = mergeRecord(defaults.home, save.home);
  const style: SaveRecord = isRecord(home.style) ? home.style : {};
  const walls: SaveRecord = isRecord(style.walls) ? style.walls : {};
  const furnitureVariants: SaveRecord = isRecord(style.furnitureVariants)
    ? style.furnitureVariants
    : {};
  const selectedStyleIds = [
    ...Object.values(walls).flatMap((wall) =>
      isRecord(wall)
        ? [wall.wallColourId, wall.wallpaperId].filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
    ),
    ...(typeof style.floorStyleId === 'string' ? [style.floorStyleId] : []),
    ...Object.values(furnitureVariants).filter(
      (value): value is string => typeof value === 'string',
    ),
  ];
  const unlockedStyleIds = Array.from(
    new Set([
      ...COTTAGE_STARTER_HOME_STYLE_IDS,
      ...selectedStyleIds.filter(isCottageHomeStyleEntitlementId),
    ]),
  );

  return {
    ...save,
    schemaVersion: 7,
    home: {
      ...home,
      unlockedStyleIds,
    },
  };
};

const migrateV7ToV8: SaveMigration = (save) => {
  const timestamp =
    typeof save.createdAt === 'string' ? save.createdAt : '1970-01-01T00:00:00.000Z';
  const defaults = createDefaultSave(timestamp);

  return {
    ...save,
    schemaVersion: 8,
    shops: mergeRecord(defaults.shops, save.shops),
  };
};

export const SAVE_MIGRATIONS: ReadonlyMap<number, SaveMigration> = new Map([
  [1, migrateV1ToV2],
  [2, migrateV2ToV3],
  [3, migrateV3ToV4],
  [4, migrateV4ToV5],
  [5, migrateV5ToV6],
  [6, migrateV6ToV7],
  [7, migrateV7ToV8],
]);

export function migrateSaveRecord(
  value: unknown,
  migrations: ReadonlyMap<number, SaveMigration> = SAVE_MIGRATIONS,
): SaveRecord | null {
  if (!isRecord(value) || !Number.isInteger(value.schemaVersion)) {
    return null;
  }

  let current = { ...value };
  let version = current.schemaVersion as number;

  if (version < 0 || version > CURRENT_SAVE_SCHEMA_VERSION) {
    return null;
  }

  while (version < CURRENT_SAVE_SCHEMA_VERSION) {
    const migration = migrations.get(version);
    if (!migration) {
      return null;
    }

    current = migration(current);
    if (!Number.isInteger(current.schemaVersion)) {
      return null;
    }

    const nextVersion = current.schemaVersion as number;
    if (nextVersion !== version + 1) {
      return null;
    }

    version = nextVersion;
  }

  return current;
}
import { COTTAGE_STARTER_DECORATION_IDS } from '../../content/cottageStarterDecorations';
import {
  COTTAGE_STARTER_HOME_STYLE_IDS,
  isCottageHomeStyleEntitlementId,
} from '../../content/cottageHomeStyleEntitlements';
