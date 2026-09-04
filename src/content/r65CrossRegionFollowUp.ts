import type { DiscoveryDefinition, ItemDefinition, QuestDefinition } from './contentTypes';
import { LUMI_CHARACTER_ID } from './r5LumiWoodsStory';
import { CORAL_CHARACTER_ID } from './r65StarlightBeach';

export const LIGHT_FOUND_SEA_QUEST_ID = 'quest:lumi-coral-light-found-sea' as const;
export const LIGHT_FOUND_SEA_COMPLETE_FLAG = 'flag:r65-wp13-light-found-sea-complete' as const;

export const MOONLIT_SHELL_GLIMMER_DISCOVERY_ID = 'discovery:moonlit-shell-glimmer' as const;
export const CORAL_SEA_LIGHT_THEORY_DISCOVERY_ID = 'discovery:coral-sea-light-theory' as const;
export const LUMI_STARWELL_LIGHT_CLUE_DISCOVERY_ID =
  'discovery:lumi-starwell-light-clue' as const;
export const STARWELL_SEA_REFLECTION_DISCOVERY_ID = 'discovery:starwell-sea-reflection' as const;
export const SHORE_STARWELL_LANTERN_MEMORY_DISCOVERY_ID =
  'discovery:shore-starwell-lantern-memory' as const;

export const SHORE_AND_STARWELL_LANTERN_ITEM_ID = 'item:shore-and-starwell-lantern' as const;

export const R65_CROSS_REGION_FOLLOW_UP_ITEMS = [
  {
    id: SHORE_AND_STARWELL_LANTERN_ITEM_ID,
    name: 'Shore and Starwell Lantern',
    description:
      'Coral and Lumi made a tiny lantern from a pearly shell and a firefly-safe glass glow, linking Moonlit Point to the Starwell.',
    category: 'decoration',
    icon: '🏮',
    discoveryId: SHORE_STARWELL_LANTERN_MEMORY_DISCOVERY_ID,
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
    id: CORAL_SEA_LIGHT_THEORY_DISCOVERY_ID,
    name: 'Coral’s Wandering-light Theory',
    description:
      'Coral recognises the shell but not its green glimmer. She wonders whether a light from somewhere inland has found its way to the shore.',
    icon: '💡',
    undiscoveredHint: 'Coral may have an idea about the strange green shell-light.',
  },
  {
    id: LUMI_STARWELL_LIGHT_CLUE_DISCOVERY_ID,
    name: 'Lumi’s Starwell Light Clue',
    description:
      'Lumi says the Starwell sometimes reflects patterns from far beyond the Woods and asks you to compare the beach glimmer with its water.',
    icon: '✨',
    undiscoveredHint: 'The Woods light-keeper may recognise Coral’s unusual green glimmer.',
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
  {
    id: SHORE_STARWELL_LANTERN_MEMORY_DISCOVERY_ID,
    name: 'The Light That Found the Sea',
    description:
      'Coral and Lumi leave a shell-and-firefly lantern at Shell Cove, a permanent little link between Starlight Beach and the Starwell.',
    icon: '🏮',
    undiscoveredHint: 'Take the Starwell answer back to Coral at Starlight Beach.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R65_CROSS_REGION_FOLLOW_UP_QUESTS = [
  {
    id: LIGHT_FOUND_SEA_QUEST_ID,
    name: 'Lumi, Coral and the Light That Found the Sea',
    steps: [
      { type: 'unlock-discovery', discoveryId: MOONLIT_SHELL_GLIMMER_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: CORAL_SEA_LIGHT_THEORY_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: LUMI_STARWELL_LIGHT_CLUE_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: STARWELL_SEA_REFLECTION_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: SHORE_STARWELL_LANTERN_MEMORY_DISCOVERY_ID },
      { type: 'award-item', itemId: SHORE_AND_STARWELL_LANTERN_ITEM_ID, quantity: 1 },
      { type: 'award-friendship', characterId: LUMI_CHARACTER_ID, amount: 8 },
      { type: 'award-friendship', characterId: CORAL_CHARACTER_ID, amount: 8 },
      { type: 'set-world-flag', flagId: LIGHT_FOUND_SEA_COMPLETE_FLAG, value: true },
    ],
  },
] as const satisfies readonly QuestDefinition[];
