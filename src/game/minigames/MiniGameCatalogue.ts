import { isSceneKey, type SceneKey } from '../scenes/SceneKeys';

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

export type MiniGameCatalogueIssueCode =
  | 'duplicate-id'
  | 'invalid-scene-key'
  | 'missing-just-games-exposure'
  | 'duplicate-variant-id'
  | 'invalid-variant'
  | 'missing-visible-variant';

export interface MiniGameCatalogueIssue {
  code: MiniGameCatalogueIssueCode;
  message: string;
  gameId?: string;
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
      {
        id: 'race-course:rainbow-run-sunrise-sprint',
        title: 'Sunrise Sprint',
        justGamesVisible: true,
      },
      {
        id: 'race-course:rainbow-meadow-petal-parade',
        title: 'Petal Parade',
        justGamesVisible: true,
      },
      {
        id: 'race-course:crystal-brook-crystal-cascade',
        title: 'Crystal Cascade',
        justGamesVisible: true,
      },
      {
        id: 'race-course:whispering-woods-mooncap-trail',
        title: 'Mooncap Trail',
        justGamesVisible: true,
      },
      {
        id: 'race-course:starlight-beach-shoreline-surge',
        title: 'Shoreline Surge',
        justGamesVisible: true,
      },
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

export function getMiniGameCatalogueIssues(
  definitions: readonly MiniGameDefinition[],
): MiniGameCatalogueIssue[] {
  const issues: MiniGameCatalogueIssue[] = [];
  const gameIds = new Set<string>();

  for (const definition of definitions) {
    if (gameIds.has(definition.id)) {
      issues.push({
        code: 'duplicate-id',
        gameId: definition.id,
        message: 'Duplicate mini-game id: ' + definition.id,
      });
    }
    gameIds.add(definition.id);

    if (!isSceneKey(definition.sceneKey)) {
      issues.push({
        code: 'invalid-scene-key',
        gameId: definition.id,
        message: 'Unknown SceneKey for mini-game ' + definition.id + ': ' + definition.sceneKey,
      });
    }

    if (!definition.justGames.visible) {
      issues.push({
        code: 'missing-just-games-exposure',
        gameId: definition.id,
        message: 'Mini-game is missing required Just Games exposure: ' + definition.id,
      });
    }

    const variantIds = new Set<string>();
    let visibleVariantCount = 0;
    for (const variant of definition.variants) {
      if (variant.id.trim().length === 0 || variant.title.trim().length === 0) {
        issues.push({
          code: 'invalid-variant',
          gameId: definition.id,
          message: 'Mini-game has a variant with an empty id or title: ' + definition.id,
        });
      }

      if (variantIds.has(variant.id)) {
        issues.push({
          code: 'duplicate-variant-id',
          gameId: definition.id,
          message: 'Duplicate variant id for ' + definition.id + ': ' + variant.id,
        });
      }
      variantIds.add(variant.id);

      if (variant.justGamesVisible) {
        visibleVariantCount += 1;
      }
    }

    if (definition.variants.length > 0 && visibleVariantCount === 0) {
      issues.push({
        code: 'missing-visible-variant',
        gameId: definition.id,
        message: 'Mini-game has variants but none are available to Just Games: ' + definition.id,
      });
    }
  }

  return issues;
}

export function assertMiniGameCatalogueIntegrity(
  definitions: readonly MiniGameDefinition[] = MINI_GAME_CATALOGUE,
): void {
  const issues = getMiniGameCatalogueIssues(definitions);
  if (issues.length === 0) {
    return;
  }

  throw new Error(
    ['Invalid mini-game catalogue:', ...issues.map((issue) => '- ' + issue.message)].join('\n'),
  );
}

assertMiniGameCatalogueIntegrity();

const MINI_GAME_BY_ID = new Map<MiniGameId, MiniGameDefinition>(
  MINI_GAME_CATALOGUE.map((definition) => [definition.id, definition] as const),
);

export function isMiniGameId(value: string): value is MiniGameId {
  return MINI_GAME_BY_ID.has(value as MiniGameId);
}

export function getMiniGameDefinition(id: MiniGameId): MiniGameDefinition {
  const definition = MINI_GAME_BY_ID.get(id);
  if (!definition) {
    throw new Error('Unknown mini-game id: ' + id);
  }
  return definition;
}

export function getJustGamesDefinitions(): MiniGameDefinition[] {
  return MINI_GAME_CATALOGUE.filter((definition) => definition.justGames.visible)
    .slice()
    .sort((left, right) => left.order - right.order);
}

export function isMiniGameVariant(definition: MiniGameDefinition, variantId: string): boolean {
  return definition.variants.some((variant) => variant.id === variantId);
}
