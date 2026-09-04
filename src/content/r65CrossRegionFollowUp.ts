import { LUMI_CHARACTER_ID } from './r5LumiWoodsStory';
import { CORAL_CHARACTER_ID } from './r65StarlightBeach';
import type {
  DialogueDefinition,
  DiscoveryDefinition,
  ItemDefinition,
  QuestDefinition,
} from './contentTypes';

export const LIGHT_FOUND_SEA_QUEST_ID = 'quest:lumi-coral-light-found-sea' as const;
export const LIGHT_FOUND_SEA_COMPLETE_FLAG = 'flag:r65-wp13-light-found-sea-complete' as const;

export const MOONLIT_SHELL_GLIMMER_DISCOVERY_ID = 'discovery:moonlit-shell-glimmer' as const;
export const STARWELL_SEA_REFLECTION_DISCOVERY_ID = 'discovery:starwell-sea-reflection' as const;

export const SHORE_AND_STARWELL_LANTERN_ITEM_ID = 'item:shore-and-starwell-lantern' as const;
export const LUMI_LIGHT_FOUND_SEA_DIALOGUE_ID = 'dialogue:lumi-light-found-sea' as const;

export const R65_CROSS_REGION_FOLLOW_UP_ITEMS = [
  {
    id: SHORE_AND_STARWELL_LANTERN_ITEM_ID,
    name: 'Shore and Starwell Lantern',
    description:
      'Coral and Lumi made a tiny lantern from a pearly shell and a firefly-safe glass glow, linking Moonlit Point to the Starwell.',
    category: 'decoration',
    icon: '🏮',
    discoveryId: STARWELL_SEA_REFLECTION_DISCOVERY_ID,
  },
] as const satisfies readonly ItemDefinition[];

export const R65_CROSS_REGION_FOLLOW_UP_DISCOVERIES = [
  {
    id: MOONLIT_SHELL_GLIMMER_DISCOVERY_ID,
    name: 'Moonlit Shell Glimmer',
    description:
      'A familiar Starlight shell below Moonlit Point flashes with a soft green light that looks much more like a Woods firefly than sea sparkle.',
    kind: 'secret',
    icon: '🐚',
    undiscoveredHint:
      'After Coral’s shell story and a proper visit with Lumi, Moonlit Point may have a new light worth noticing.',
  },
  {
    id: STARWELL_SEA_REFLECTION_DISCOVERY_ID,
    name: 'Sea-light in the Starwell',
    description:
      'The Starwell catches the shell’s pale wave pattern and sends the same green sparkle dancing across its dark water.',
    kind: 'secret',
    icon: '🌌',
    undiscoveredHint: 'Lumi thinks the strange beach glimmer should be compared with the Starwell itself.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R65_CROSS_REGION_FOLLOW_UP_DIALOGUES = [
  {
    id: LUMI_LIGHT_FOUND_SEA_DIALOGUE_ID,
    name: 'Lumi and the Light That Found the Sea',
    startNodeId: 'dialogue-node:lumi-light-found-sea-1',
    nodes: [
      {
        id: 'dialogue-node:lumi-light-found-sea-1',
        type: 'line',
        speakerId: LUMI_CHARACTER_ID,
        text: 'Coral found green light in a shell at Moonlit Point? That sounds like the Starwell has been travelling without going anywhere.',
        nextNodeId: 'dialogue-node:lumi-light-found-sea-2',
      },
      {
        id: 'dialogue-node:lumi-light-found-sea-2',
        type: 'line',
        speakerId: LUMI_CHARACTER_ID,
        text: 'Bring the memory of that glimmer right to the water. The Starwell reflects patterns, not just stars, and it already knows you well enough to answer.',
        nextNodeId: 'dialogue-node:lumi-light-found-sea-3',
      },
      {
        id: 'dialogue-node:lumi-light-found-sea-3',
        type: 'line',
        speakerId: LUMI_CHARACTER_ID,
        text: 'If the same light appears here, tell Coral. I like the idea that a little Woods light found its way all the way to the sea.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];

export const R65_CROSS_REGION_FOLLOW_UP_QUESTS = [
  {
    id: LIGHT_FOUND_SEA_QUEST_ID,
    name: 'Lumi, Coral and the Light That Found the Sea',
    steps: [
      { type: 'unlock-discovery', discoveryId: MOONLIT_SHELL_GLIMMER_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: CORAL_CHARACTER_ID },
      { type: 'talk-to-character', characterId: LUMI_CHARACTER_ID },
      { type: 'unlock-discovery', discoveryId: STARWELL_SEA_REFLECTION_DISCOVERY_ID },
      { type: 'talk-to-character', characterId: CORAL_CHARACTER_ID },
      { type: 'award-item', itemId: SHORE_AND_STARWELL_LANTERN_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: LUMI_CHARACTER_ID, amount: 8 },
      { type: 'award-friendship', characterId: CORAL_CHARACTER_ID, amount: 8 },
      { type: 'set-world-flag', flagId: LIGHT_FOUND_SEA_COMPLETE_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];
