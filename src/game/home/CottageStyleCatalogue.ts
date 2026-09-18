import type { CottageWallKey, HomeStyleState, HomeWallStyleState } from '../save/saveSchema';
import {
  DEFAULT_COTTAGE_FURNITURE_VARIANTS,
  isKnownCottageFurnitureVariant,
  resolveCottageFurnitureVariant,
} from './CottageFurnitureVariantCatalogue';

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

export const DEFAULT_COTTAGE_WALL_STYLE: Readonly<HomeWallStyleState> = {
  wallColourId: 'cottage-wall:moon-cream',
  wallpaperId: 'cottage-wallpaper:plain',
};

export const DEFAULT_COTTAGE_STYLE: Readonly<HomeStyleState> = {
  walls: {
    back: { ...DEFAULT_COTTAGE_WALL_STYLE },
    left: { ...DEFAULT_COTTAGE_WALL_STYLE },
    right: { ...DEFAULT_COTTAGE_WALL_STYLE },
    front: { ...DEFAULT_COTTAGE_WALL_STYLE },
  },
  floorStyleId: 'cottage-floor:honey-oak',
  furnitureVariants: { ...DEFAULT_COTTAGE_FURNITURE_VARIANTS },
};

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

const WALL_BY_ID = new Map(COTTAGE_WALL_COLOURS.map((definition) => [definition.id, definition]));
const WALLPAPER_BY_ID = new Map(
  COTTAGE_WALLPAPERS.map((definition) => [definition.id, definition]),
);
const FLOOR_BY_ID = new Map(COTTAGE_FLOOR_STYLES.map((definition) => [definition.id, definition]));

export function getCottageWallColour(id: string): CottageWallColourDefinition {
  return (
    WALL_BY_ID.get(id as CottageWallColourId) ??
    WALL_BY_ID.get(DEFAULT_COTTAGE_WALL_STYLE.wallColourId as CottageWallColourId)!
  );
}

export function getCottageWallpaper(id: string): CottageWallpaperDefinition {
  return (
    WALLPAPER_BY_ID.get(id as CottageWallpaperId) ??
    WALLPAPER_BY_ID.get(DEFAULT_COTTAGE_WALL_STYLE.wallpaperId as CottageWallpaperId)!
  );
}

export function getCottageFloorStyle(id: string): CottageFloorStyleDefinition {
  return (
    FLOOR_BY_ID.get(id as CottageFloorStyleId) ??
    FLOOR_BY_ID.get(DEFAULT_COTTAGE_STYLE.floorStyleId as CottageFloorStyleId)!
  );
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
    furnitureVariants: {
      bed: resolveCottageFurnitureVariant('bed', style.furnitureVariants.bed),
      sofa: resolveCottageFurnitureVariant('sofa', style.furnitureVariants.sofa),
      teaSet: resolveCottageFurnitureVariant('teaSet', style.furnitureVariants.teaSet),
      fireplace: resolveCottageFurnitureVariant('fireplace', style.furnitureVariants.fireplace),
    },
  };
}

export function isKnownCottageStyle(style: HomeStyleState): boolean {
  return (
    COTTAGE_WALL_KEYS.every((wallKey) => {
      const wall = style.walls[wallKey];
      return (
        WALL_BY_ID.has(wall.wallColourId as CottageWallColourId) &&
        WALLPAPER_BY_ID.has(wall.wallpaperId as CottageWallpaperId)
      );
    }) &&
    FLOOR_BY_ID.has(style.floorStyleId as CottageFloorStyleId) &&
    isKnownCottageFurnitureVariant('bed', style.furnitureVariants.bed) &&
    isKnownCottageFurnitureVariant('sofa', style.furnitureVariants.sofa) &&
    isKnownCottageFurnitureVariant('teaSet', style.furnitureVariants.teaSet) &&
    isKnownCottageFurnitureVariant('fireplace', style.furnitureVariants.fireplace)
  );
}
