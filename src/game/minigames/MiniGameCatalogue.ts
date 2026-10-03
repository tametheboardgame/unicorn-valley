import {
  MOONCAP_TRAIL_RACE_ID,
  PETAL_PARADE_RACE_ID,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import type { SceneKey } from '../scenes/SceneManifest';

export const MINI_GAME_IDS = {
  rainbowRunRacing: 'rainbow-run-racing',
  rainbowDisc: 'rainbow-disc',
  sunbeamChess: 'sunbeam-chess',
  wobblyCake: 'wobbly-cake',
  fireflyLantern: 'firefly-lantern',
  pondLeap: 'pond-leap',
  coralBeachcombing: 'coral-beachcombing',
} as const;

export type MiniGameId = (typeof MINI_GAME_IDS)[keyof typeof MINI_GAME_IDS];
export type MiniGameGroup = 'sport' | 'puzzle' | 'making' | 'exploration' | 'race' | 'other';
export type MiniGameAvailability = 'always' | 'explicit-unlock';
export type MiniGameWorldPlacement = 'placed' | 'unplaced';
export type MiniGameSandboxSideEffects = 'none' | 'isolated-records';

export interface MiniGameVariantDefinition {
  id: string;
  title: string;
  justGamesVisible: boolean;
}

export interface MiniGameDefinition {
  id: MiniGameId;
  sceneKey: SceneKey;
  title: string;
  description: string;
  group: MiniGameGroup;
  order: number;
  variants: readonly MiniGameVariantDefinition[];
  justGames: {
    visible: boolean;
    availability: MiniGameAvailability;
  };
  world: {
    placement: MiniGameWorldPlacement;
  };
  sandbox: {
    sideEffects: MiniGameSandboxSideEffects;
  };
}

export const MINI_GAME_CATALOGUE = [
  {
    id: MINI_GAME_IDS.rainbowRunRacing,
    sceneKey: 'RaceScene',
    title: 'Rainbow Run Racing',
    description: 'Choose a valley course and race for the finish.',
    group: 'race',
    order: 10,
    variants: [
      { id: SUNRISE_SPRINT_RACE_ID, title: 'Sunrise Sprint', justGamesVisible: true },
      { id: PETAL_PARADE_RACE_ID, title: 'Petal Parade', justGamesVisible: true },
      { id: CRYSTAL_CASCADE_RACE_ID, title: 'Crystal Cascade', justGamesVisible: true },
      { id: MOONCAP_TRAIL_RACE_ID, title: 'Mooncap Trail', justGamesVisible: true },
      { id: SHORELINE_SURGE_RACE_ID, title: 'Shoreline Surge', justGamesVisible: true },
    ],
    justGames: { visible: true, availability: 'always' },
    world: { placement: 'placed' },
    sandbox: { sideEffects: 'none' },
  },
  {
    id: MINI_GAME_IDS.rainbowDisc,
    sceneKey: 'RainbowDiscActivityScene',
    title: 'Rainbow Disc',
    description: 'Pass the disc through open lanes or practise your throws.',
    group: 'sport',
    order: 20,
    variants: [
      { id: 'match', title: 'Match', justGamesVisible: true },
      { id: 'practice', title: 'Practice', justGamesVisible: true },
    ],
    justGames: { visible: true, availability: 'always' },
    world: { placement: 'placed' },
    sandbox: { sideEffects: 'none' },
  },
  {
    id: MINI_GAME_IDS.sunbeamChess,
    sceneKey: 'ChessPlazaActivityScene',
    title: 'Sunbeam Chess',
    description: 'Play a friendly game of chess in the village.',
    group: 'puzzle',
    order: 30,
    variants: [],
    justGames: { visible: true, availability: 'always' },
    world: { placement: 'placed' },
    sandbox: { sideEffects: 'none' },
  },
  {
    id: MINI_GAME_IDS.wobblyCake,
    sceneKey: 'MapleBakingActivityScene',
    title: 'Wobbly Cake',
    description: 'Measure, stir, stack and decorate a gloriously wobbly cake.',
    group: 'making',
    order: 40,
    variants: [],
    justGames: { visible: true, availability: 'always' },
    world: { placement: 'placed' },
    sandbox: { sideEffects: 'none' },
  },
  {
    id: MINI_GAME_IDS.fireflyLantern,
    sceneKey: 'FireflyLanternScene',
    title: 'Firefly Lantern',
    description: 'Guide glowing fireflies safely into the lantern.',
    group: 'other',
    order: 50,
    variants: [
      { id: 'normal', title: 'Normal', justGamesVisible: true },
      { id: 'multicolour', title: 'Multicolour', justGamesVisible: true },
      { id: 'endless', title: 'Endless', justGamesVisible: true },
    ],
    justGames: { visible: true, availability: 'always' },
    world: { placement: 'placed' },
    sandbox: { sideEffects: 'none' },
  },
  {
    id: MINI_GAME_IDS.pondLeap,
    sceneKey: 'PondLeapActivityScene',
    title: 'Lily Pad Leap',
    description: 'Time each jump and help the pond frog cross the lily pads.',
    group: 'other',
    order: 60,
    variants: [],
    justGames: { visible: true, availability: 'always' },
    world: { placement: 'placed' },
    sandbox: { sideEffects: 'none' },
  },
  {
    id: MINI_GAME_IDS.coralBeachcombing,
    sceneKey: 'CoralBeachcombingActivityScene',
    title: 'Coral Beachcombing',
    description: 'Search the shore for shells, shapes and seaside discoveries.',
    group: 'exploration',
    order: 70,
    variants: [],
    justGames: { visible: true, availability: 'always' },
    world: { placement: 'placed' },
    sandbox: { sideEffects: 'none' },
  },
] as const satisfies readonly MiniGameDefinition[];

const MINI_GAME_BY_ID = new Map<MiniGameId, MiniGameDefinition>(
  MINI_GAME_CATALOGUE.map((definition) => [definition.id, definition] as const),
);

export function isMiniGameId(value: string): value is MiniGameId {
  return MINI_GAME_BY_ID.has(value as MiniGameId);
}

export function getMiniGameDefinition(id: MiniGameId): MiniGameDefinition {
  const definition = MINI_GAME_BY_ID.get(id);
  if (!definition) {
    throw new Error(`Unknown mini-game id: ${id}`);
  }
  return definition;
}

export function getJustGamesDefinitions(): MiniGameDefinition[] {
  return MINI_GAME_CATALOGUE.filter((definition) => definition.justGames.visible)
    .slice()
    .sort((left, right) => left.order - right.order);
}

export function isMiniGameVariant(
  definition: MiniGameDefinition,
  variantId: string,
): boolean {
  return definition.variants.some((variant) => variant.id === variantId);
}
