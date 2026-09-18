import type { HomeStyleState } from '../save/saveSchema';

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
  name: string;
  description: string;
  fill: number;
  patternContrast: number;
  starter: true;
}

export type CottageWallpaperPattern = 'none' | 'moon-sprigs' | 'star-scatter' | 'meadow-vines';

export interface CottageWallpaperDefinition {
  id: CottageWallpaperId;
  name: string;
  description: string;
  pattern: CottageWallpaperPattern;
  ink: number;
  accent: number;
  starter: true;
}

export interface CottageFloorStyleDefinition {
  id: CottageFloorStyleId;
  name: string;
  description: string;
  fill: number;
  seam: number;
  grain: number;
  plankWidth: number;
  starter: true;
}

export const DEFAULT_COTTAGE_STYLE: Readonly<HomeStyleState> = {
  wallColourId: 'cottage-wall:moon-cream',
  wallpaperId: 'cottage-wallpaper:plain',
  floorStyleId: 'cottage-floor:honey-oak',
};

export const COTTAGE_WALL_COLOURS: readonly CottageWallColourDefinition[] = [
  {
    id: 'cottage-wall:moon-cream',
    name: 'Moon Cream',
    description: 'Warm cream walls with the cosy look Moonflower Cottage started with.',
    fill: 0xe8cdb6,
    patternContrast: 0xb98b72,
    starter: true,
  },
  {
    id: 'cottage-wall:blush-dawn',
    name: 'Blush Dawn',
    description: 'A soft rosy wall colour, warm without becoming too bright.',
    fill: 0xf2cfd3,
    patternContrast: 0xb97786,
    starter: true,
  },
  {
    id: 'cottage-wall:misty-lilac',
    name: 'Misty Lilac',
    description: 'A pale magical lilac that keeps the room calm and storybook-soft.',
    fill: 0xddd0e8,
    patternContrast: 0x9273aa,
    starter: true,
  },
  {
    id: 'cottage-wall:sea-glass',
    name: 'Sea Glass',
    description: 'A gentle green-blue inspired by smooth glass from Starlight Beach.',
    fill: 0xcbe3dd,
    patternContrast: 0x6d9e98,
    starter: true,
  },
  {
    id: 'cottage-wall:buttercup',
    name: 'Buttercup',
    description: 'A light sunny yellow that makes the cottage feel bright and cheerful.',
    fill: 0xf2dfad,
    patternContrast: 0xb39754,
    starter: true,
  },
];

export const COTTAGE_WALLPAPERS: readonly CottageWallpaperDefinition[] = [
  {
    id: 'cottage-wallpaper:plain',
    name: 'Plain',
    description: 'Just the chosen wall colour, simple and cosy.',
    pattern: 'none',
    ink: 0xffffff,
    accent: 0xffffff,
    starter: true,
  },
  {
    id: 'cottage-wallpaper:moon-sprigs',
    name: 'Moon Sprigs',
    description: 'Tiny moons and leafy sprigs scattered gently across the wall.',
    pattern: 'moon-sprigs',
    ink: 0x76518a,
    accent: 0x90b99e,
    starter: true,
  },
  {
    id: 'cottage-wallpaper:star-scatter',
    name: 'Star Scatter',
    description: 'A quiet dusting of little stars, like bedtime light across the room.',
    pattern: 'star-scatter',
    ink: 0x9a73bb,
    accent: 0xd3a84d,
    starter: true,
  },
  {
    id: 'cottage-wallpaper:meadow-vines',
    name: 'Meadow Vines',
    description: 'Soft curling vines and leaves inspired by the meadow outside.',
    pattern: 'meadow-vines',
    ink: 0x6f9b72,
    accent: 0xb985a2,
    starter: true,
  },
];

export const COTTAGE_FLOOR_STYLES: readonly CottageFloorStyleDefinition[] = [
  {
    id: 'cottage-floor:honey-oak',
    name: 'Honey Oak',
    description: 'Warm honey-coloured boards that preserve the original cottage feel.',
    fill: 0xf7e8d6,
    seam: 0xa77b65,
    grain: 0xcda889,
    plankWidth: 220,
    starter: true,
  },
  {
    id: 'cottage-floor:rosewood',
    name: 'Rosewood',
    description: 'Soft rosy timber with deeper seams for a snug evening feel.',
    fill: 0xe0b9ae,
    seam: 0x8f625d,
    grain: 0xb98278,
    plankWidth: 205,
    starter: true,
  },
  {
    id: 'cottage-floor:whitewashed-oak',
    name: 'Whitewashed Oak',
    description: 'Pale boards that make the cottage feel airy and bright.',
    fill: 0xeee8df,
    seam: 0xb5a89b,
    grain: 0xd2c7bc,
    plankWidth: 235,
    starter: true,
  },
  {
    id: 'cottage-floor:lavender-boards',
    name: 'Lavender Boards',
    description: 'A muted lavender finish with enough warmth to stay cosy.',
    fill: 0xddd2df,
    seam: 0x927b98,
    grain: 0xb9a7bd,
    plankWidth: 215,
    starter: true,
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
    WALL_BY_ID.get(DEFAULT_COTTAGE_STYLE.wallColourId as CottageWallColourId)!
  );
}

export function getCottageWallpaper(id: string): CottageWallpaperDefinition {
  return (
    WALLPAPER_BY_ID.get(id as CottageWallpaperId) ??
    WALLPAPER_BY_ID.get(DEFAULT_COTTAGE_STYLE.wallpaperId as CottageWallpaperId)!
  );
}

export function getCottageFloorStyle(id: string): CottageFloorStyleDefinition {
  return (
    FLOOR_BY_ID.get(id as CottageFloorStyleId) ??
    FLOOR_BY_ID.get(DEFAULT_COTTAGE_STYLE.floorStyleId as CottageFloorStyleId)!
  );
}

export function resolveCottageStyle(style: HomeStyleState): HomeStyleState {
  return {
    wallColourId: getCottageWallColour(style.wallColourId).id,
    wallpaperId: getCottageWallpaper(style.wallpaperId).id,
    floorStyleId: getCottageFloorStyle(style.floorStyleId).id,
  };
}

export function isKnownCottageStyle(style: HomeStyleState): boolean {
  return (
    WALL_BY_ID.has(style.wallColourId as CottageWallColourId) &&
    WALLPAPER_BY_ID.has(style.wallpaperId as CottageWallpaperId) &&
    FLOOR_BY_ID.has(style.floorStyleId as CottageFloorStyleId)
  );
}
