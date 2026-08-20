import type {
  DialogueFlagId,
  DialogueQuestStatus,
  DiscoveryDefinition,
  DiscoveryId,
  QuestId,
} from './contentTypes';
import { WILLOW_GARDEN_PLANTED_FLAG, WILLOW_MOONFLOWERS_QUEST_ID } from './r2Quests';

export type SecretDiscoveryPattern = 'hidden-object' | 'conditional-clue' | 'hidden-path';
export type SecretFeedbackTier = 'twinkle' | 'secret' | 'grand';

export type SecretDiscoveryCondition =
  | {
      type: 'discovery';
      discoveryId: DiscoveryId;
      discovered?: boolean;
    }
  | {
      type: 'quest-status';
      questId: QuestId;
      status: DialogueQuestStatus;
    }
  | {
      type: 'world-flag';
      flagId: DialogueFlagId;
      value: boolean;
    };

export interface SecretDiscoveryDefinition {
  id: `secret:${string}`;
  discoveryId: DiscoveryId;
  sceneKey: string;
  pattern: SecretDiscoveryPattern;
  feedbackTier: SecretFeedbackTier;
  label: string;
  actionLabel: string;
  position: { x: number; y: number };
  interactionRadius: number;
  feedback: string;
  conditions?: readonly SecretDiscoveryCondition[];
  worldFlagId?: DialogueFlagId;
  revealedPath?: readonly { x: number; y: number }[];
}

export const HOLLOW_TREE_STAR_DISCOVERY_ID = 'discovery:secret-hollow-tree-star' as const;
export const MOONFLOWER_SONG_DISCOVERY_ID = 'discovery:secret-moonflower-song' as const;
export const MOONLIT_TRAIL_DISCOVERY_ID = 'discovery:secret-moonlit-trail' as const;
export const MOONLIT_TRAIL_REVEALED_FLAG = 'flag:secret-moonlit-trail-revealed' as const;

export const R4_SECRET_DISCOVERIES = [
  {
    id: HOLLOW_TREE_STAR_DISCOVERY_ID,
    name: 'Hollow Tree Star',
    description: 'A tiny golden star tucked into the old hollow tree, warm as afternoon sunshine.',
    kind: 'secret',
    icon: '🌟',
    undiscoveredHint: 'Old trees sometimes keep tiny treasures.',
  },
  {
    id: MOONFLOWER_SONG_DISCOVERY_ID,
    name: 'Moonflower Song',
    description: 'A soft three-note tune that only the planted moonflowers seem to know.',
    kind: 'secret',
    icon: '🎵',
    undiscoveredHint: 'A cared-for garden may have something to say.',
  },
  {
    id: MOONLIT_TRAIL_DISCOVERY_ID,
    name: 'Moonlit Petal Trail',
    description: 'A hidden trail of glowing petals linking the moonflower field back towards the old tree.',
    kind: 'secret',
    icon: '✨',
    undiscoveredHint: 'Two small secrets might point towards a bigger one.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R4_SECRET_DEFINITIONS = [
  {
    id: 'secret:hollow-tree-star',
    discoveryId: HOLLOW_TREE_STAR_DISCOVERY_ID,
    sceneKey: 'MoonflowerGladeScene',
    pattern: 'hidden-object',
    feedbackTier: 'twinkle',
    label: 'A tiny glint',
    actionLabel: 'Peek',
    position: { x: 2140, y: 700 },
    interactionRadius: 145,
    feedback: 'A secret!\nA little golden star was hiding in the hollow tree. 🌟',
    conditions: [{ type: 'discovery', discoveryId: 'discovery:moonflower-sparkle' }],
  },
  {
    id: 'secret:moonflower-song',
    discoveryId: MOONFLOWER_SONG_DISCOVERY_ID,
    sceneKey: 'MoonflowerGladeScene',
    pattern: 'conditional-clue',
    feedbackTier: 'secret',
    label: 'A humming moonflower',
    actionLabel: 'Listen',
    position: { x: 2025, y: 1285 },
    interactionRadius: 155,
    feedback: 'Secret found!\nThe planted moonflowers sing three tiny notes when you listen closely. 🎵',
    conditions: [
      { type: 'quest-status', questId: WILLOW_MOONFLOWERS_QUEST_ID, status: 'completed' },
      { type: 'world-flag', flagId: WILLOW_GARDEN_PLANTED_FLAG, value: true },
    ],
  },
  {
    id: 'secret:moonlit-petal-trail',
    discoveryId: MOONLIT_TRAIL_DISCOVERY_ID,
    sceneKey: 'MoonflowerGladeScene',
    pattern: 'hidden-path',
    feedbackTier: 'grand',
    label: 'Loose glowing petals',
    actionLabel: 'Follow',
    position: { x: 1760, y: 1420 },
    interactionRadius: 170,
    feedback: 'Big secret!\nThe petals brighten together and reveal a hidden moonlit trail. ✨',
    worldFlagId: MOONLIT_TRAIL_REVEALED_FLAG,
    conditions: [
      { type: 'discovery', discoveryId: HOLLOW_TREE_STAR_DISCOVERY_ID },
      { type: 'discovery', discoveryId: MOONFLOWER_SONG_DISCOVERY_ID },
    ],
    revealedPath: [
      { x: 1760, y: 1420 },
      { x: 1840, y: 1320 },
      { x: 1915, y: 1190 },
      { x: 1995, y: 1060 },
      { x: 2070, y: 930 },
      { x: 2125, y: 815 },
      { x: 2140, y: 700 },
    ],
  },
] as const satisfies readonly SecretDiscoveryDefinition[];
