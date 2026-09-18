import type { CottageWallKey, HomeStyleState, HomeWallStyleState } from '../save/saveSchema';

export type CottageWallColourId =
  | 'cottage-wall:moon-cream'
  | 'cottage-wall:blush-dawn'
  | 'cottage-wall:misty-lilac'
  | 'cottage-wall:sea-glass'
  | 'cottage-wall:buttercup';

export type CottageWallpaperId =
  | 'cottage-wallpaper:plain'
  | 'cottage-wallpaper:moon-sprigs'
  | 'cottage-wallpaper:star-scatter'
  | 'cottage-wallpaper:meadow-vines';

export type CottageFloorStyleId =
  | 'cottage-floor:honey-oak'
  | 'cottage-floor:rosewood'
  | 'cottage-floor:whitewashed-oak'
  | 'cottage-floor:lavender-boards';

export interface CottageWallColourDefinition {
  id: CottageWallColourId;
  fill: number;
}

export type CottageWallpaperPattern = 'none' | 'moon-sprigs' | 'star-scatter' | 'meadow-vines';

export interface CottageWallpaperDefinition {
  id: CottageWallpaperId;
  pattern: CottageWallpaperPattern;
  ink: number;
  accent: number;
}

export interface CottageFloorStyleDefinition {
  id: CottageFloorStyleId;
  fill: number;
  seam: number;
  grain: number;
  plankWidth: number;
}

export const COTTAGE_WALL_KEYS = [
  'back',
  'left',
  'right',
  'front',
] as const satisfies readonly CottageWallKey[];

export const COTTAGE_WALL_COLOURS: readonly CottageWallColourDefinition[] = [
  {
    id: 'cottage-wall:moon-cream',
    fill: 0xe8cdb6,
  },
  {
    id: 'cottage-wall:blush-dawn',
    fill: 0xf2cfd3,
  },
  {
    id: 'cottage-wall:misty-lilac',
    fill: 0xddd0e8,
  },
  {
    id: 'cottage-wall:sea-glass',
    fill: 0xcbe3dd,
  },
  {
    id: 'cottage-wall:buttercup',
    fill: 0xf2dfad,
  },
];

export const COTTAGE_WALLPAPERS: readonly CottageWallpaperDefinition[] = [
  {
    id: 'cottage-wallpaper:plain',
    pattern: 'none',
    ink: 0xffffff,
    accent: 0xffffff,
  },
  {
    id: 'cottage-wallpaper:moon-sprigs',
    pattern: 'moon-sprigs',
    ink: 0x76518a,
    accent: 0x90b99e,
  },
  {
    id: 'cottage-wallpaper:star-scatter',
    pattern: 'star-scatter',
    ink: 0x9a73bb,
    accent: 0xd3a84d,
  },
  {
    id: 'cottage-wallpaper:meadow-vines',
    pattern: 'meadow-vines',
    ink: 0x6f9b72,
    accent: 0xb985a2,
  },
];

export const COTTAGE_FLOOR_STYLES: readonly CottageFloorStyleDefinition[] = [
  {
    id: 'cottage-floor:honey-oak',
    fill: 0xf7e8d6,
    seam: 0xa77b65,
    grain: 0xcda889,
    plankWidth: 220,
  },
  {
    id: 'cottage-floor:rosewood',
    fill: 0xe0b9ae,
    seam: 0x8f625d,
    grain: 0xb98278,
    plankWidth: 205,
  },
  {
    id: 'cottage-floor:whitewashed-oak',
    fill: 0xeee8df,
    seam: 0xb5a89b,
    grain: 0xd2c7bc,
    plankWidth: 235,
  },
  {
    id: 'cottage-floor:lavender-boards',
    fill: 0xddd2df,
    seam: 0x927b98,
    grain: 0xb9a7bd,
    plankWidth: 215,
  },
];

export function getCottageWallColour(id: string): CottageWallColourDefinition {
  return COTTAGE_WALL_COLOURS.find((definition) => definition.id === id) ?? COTTAGE_WALL_COLOURS[0]!;
}

export function getCottageWallpaper(id: string): CottageWallpaperDefinition {
  return COTTAGE_WALLPAPERS.find((definition) => definition.id === id) ?? COTTAGE_WALLPAPERS[0]!;
}

export function getCottageFloorStyle(id: string): CottageFloorStyleDefinition {
  return COTTAGE_FLOOR_STYLES.find((definition) => definition.id === id) ?? COTTAGE_FLOOR_STYLES[0]!;
}

export function resolveCottageWallStyle(style: HomeWallStyleState): HomeWallStyleState {
  return {
    wallColourId: getCottageWallColour(style.wallColourId).id,
    wallpaperId: getCottageWallpaper(style.wallpaperId).id,
  };
}

export function resolveCottageStyle(style: HomeStyleState): HomeStyleState {
  return {
    walls: {
      back: resolveCottageWallStyle(style.walls.back),
      left: resolveCottageWallStyle(style.walls.left),
      right: resolveCottageWallStyle(style.walls.right),
      front: resolveCottageWallStyle(style.walls.front),
    },
    floorStyleId: getCottageFloorStyle(style.floorStyleId).id,
    furnitureVariants: { ...style.furnitureVariants },
  };
}

export function isKnownCottageStyle(style: HomeStyleState): boolean {
  return (
    COTTAGE_WALL_KEYS.every((wallKey) => {
      const wall = style.walls[wallKey];
      return (
        COTTAGE_WALL_COLOURS.some(({ id }) => id === wall.wallColourId) &&
        COTTAGE_WALLPAPERS.some(({ id }) => id === wall.wallpaperId)
      );
    }) && COTTAGE_FLOOR_STYLES.some(({ id }) => id === style.floorStyleId)
  );
}
