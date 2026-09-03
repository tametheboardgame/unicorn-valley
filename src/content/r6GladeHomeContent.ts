import type { DiscoveryDefinition, ItemDefinition, QuestDefinition } from './contentTypes';
import type { SecretDiscoveryDefinition } from './r4Secrets';

export const PIP_HOLLOW_TREE_QUEST_ID = 'quest:pip-hollow-tree-whispers' as const;
export const HOLLOW_TREE_STORY_ACTIVE_FLAG = 'flag:r6-hollow-tree-story-active' as const;
export const HOLLOW_TREE_NOOK_OPEN_FLAG = 'flag:r6-hollow-tree-nook-open' as const;
export const HOLLOW_TREE_MARKS_DISCOVERY_ID = 'discovery:hollow-tree-whisper-marks' as const;
export const HOLLOW_TREE_BRIDGE_ECHO_DISCOVERY_ID = 'discovery:hollow-tree-bridge-echo' as const;
export const HOLLOW_TREE_NOOK_DISCOVERY_ID = 'discovery:hollow-tree-nook' as const;
export const HOLLOW_TREE_HEART_DISCOVERY_ID = 'discovery:hollow-tree-heart-light' as const;

export const JUNIPER_BUTTERFLY_FIRST_DISCOVERY_ID = 'discovery:juniper-butterfly-glint' as const;
export const JUNIPER_BUTTERFLY_BRIDGE_DISCOVERY_ID = 'discovery:juniper-butterfly-bridge' as const;
export const JUNIPER_HIDDEN_MOONPETAL_DISCOVERY_ID = 'discovery:juniper-hidden-moonpetal' as const;
export const JUNIPER_BUTTERFLY_TRAIL_FLAG = 'flag:r6-juniper-butterfly-trail-revealed' as const;

export const HOLLOW_TREE_STAR_JAR_ITEM_ID = 'item:hollow-tree-star-jar' as const;
export const BUTTERFLY_WINDOW_CHARM_ITEM_ID = 'item:butterfly-window-charm' as const;

export const R6_GLADE_HOME_ITEMS = [
  {
    id: HOLLOW_TREE_STAR_JAR_ITEM_ID,
    name: 'Hollow Tree Star Jar',
    description:
      'A tiny warm jar of harmless tree-light from the Hollow Tree Nook. It glows softly on a cottage shelf.',
    category: 'decoration',
    icon: '🌟',
  },
  {
    id: BUTTERFLY_WINDOW_CHARM_ITEM_ID,
    name: 'Butterfly Window Charm',
    description:
      'A little moonpetal-and-ribbon charm that catches the light like the butterfly trail near home.',
    category: 'decoration',
    icon: '🦋',
  },
] as const satisfies readonly ItemDefinition[];

export const R6_GLADE_HOME_DISCOVERIES = [
  {
    id: HOLLOW_TREE_MARKS_DISCOVERY_ID,
    name: 'Whisper Marks',
    description:
      'Three soft spiral marks inside the Hollow Tree seem to brighten when the Glade is quiet.',
    kind: 'secret',
    icon: '🌀',
    undiscoveredHint: 'The old hollow tree may have more to show than its first little star.',
  },
  {
    id: HOLLOW_TREE_BRIDGE_ECHO_DISCOVERY_ID,
    name: 'Bridge Echo',
    description:
      'A tiny three-note echo under Moonflower Bridge answers the pattern hidden in the old tree.',
    kind: 'secret',
    icon: '🎵',
    undiscoveredHint:
      'Pip thinks the tree’s marks might be pointing towards somewhere water can answer back.',
  },
  {
    id: HOLLOW_TREE_NOOK_DISCOVERY_ID,
    name: 'Hollow Tree Nook',
    description:
      'A real little room inside the old tree, tucked between glowing roots and shelves worn smooth by time.',
    kind: 'secret',
    icon: '🌳',
    undiscoveredHint: 'Two matching clues may open the old tree properly.',
  },
  {
    id: HOLLOW_TREE_HEART_DISCOVERY_ID,
    name: 'Heart-light Shelf',
    description:
      'A shelf deep inside the Hollow Tree holds a gentle light that feels warm without being hot.',
    kind: 'secret',
    icon: '💛',
    undiscoveredHint: 'The newly opened Hollow Tree Nook has one particularly warm glow inside.',
  },
  {
    id: JUNIPER_BUTTERFLY_FIRST_DISCOVERY_ID,
    name: 'Juniper’s Butterfly Glint',
    description:
      'A violet butterfly keeps landing beside the garden, then waiting as though it wants to be followed.',
    kind: 'secret',
    icon: '🦋',
    undiscoveredHint:
      'Juniper notices a butterfly near the garden that never seems to fly away in a straight line.',
  },
  {
    id: JUNIPER_BUTTERFLY_BRIDGE_DISCOVERY_ID,
    name: 'Butterfly Bridge Pause',
    description:
      'The same butterfly settles on Moonflower Bridge and flashes its wings towards the far bank.',
    kind: 'secret',
    icon: '🌉',
    undiscoveredHint: 'The violet butterfly’s first stop may not be its last.',
  },
  {
    id: JUNIPER_HIDDEN_MOONPETAL_DISCOVERY_ID,
    name: 'Hidden Moonpetal',
    description:
      'A tiny moonpetal flower grows in a quiet patch that the butterfly seems to visit every day.',
    kind: 'secret',
    icon: '🌸',
    undiscoveredHint: 'Follow the butterfly past the bridge and watch where it finally settles.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R6_GLADE_HOME_QUESTS = [
  {
    id: PIP_HOLLOW_TREE_QUEST_ID,
    name: 'Pip and the Hollow Tree Whispers',
    steps: [
      { type: 'unlock-discovery', discoveryId: HOLLOW_TREE_MARKS_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: HOLLOW_TREE_STORY_ACTIVE_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: HOLLOW_TREE_BRIDGE_ECHO_DISCOVERY_ID },
      { type: 'unlock-discovery', discoveryId: HOLLOW_TREE_NOOK_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: HOLLOW_TREE_NOOK_OPEN_FLAG, value: true },
      { type: 'unlock-discovery', discoveryId: HOLLOW_TREE_HEART_DISCOVERY_ID },
      { type: 'set-world-flag', flagId: HOLLOW_TREE_STORY_ACTIVE_FLAG, value: false },
      { type: 'award-friendship', characterId: 'character:pip', amount: 14 },
      { type: 'award-item', itemId: HOLLOW_TREE_STAR_JAR_ITEM_ID, quantity: 1 },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export const R6_GLADE_HOME_SECRET_DEFINITIONS = [
  {
    id: 'secret:juniper-butterfly-glint',
    discoveryId: JUNIPER_BUTTERFLY_FIRST_DISCOVERY_ID,
    sceneKey: 'MoonflowerGladeScene',
    pattern: 'conditional-clue',
    feedbackTier: 'twinkle',
    label: 'A patient violet butterfly',
    actionLabel: 'Watch',
    position: { x: 650, y: 1700 },
    interactionRadius: 145,
    feedback:
      'A little secret!\nThe violet butterfly lands, waits for you to notice, then flutters towards the bridge. 🦋',
    conditions: [{ type: 'discovery', discoveryId: 'discovery:moonflower-sparkle' }],
  },
  {
    id: 'secret:juniper-butterfly-bridge',
    discoveryId: JUNIPER_BUTTERFLY_BRIDGE_DISCOVERY_ID,
    sceneKey: 'MoonflowerGladeScene',
    pattern: 'conditional-clue',
    feedbackTier: 'secret',
    label: 'Butterfly on the bridge rail',
    actionLabel: 'Follow',
    position: { x: 1535, y: 900 },
    interactionRadius: 150,
    feedback:
      'The trail continues!\nThe butterfly flashes its wings twice, then skips towards a quiet flower patch away from the field gate. 🌉',
    conditions: [{ type: 'discovery', discoveryId: JUNIPER_BUTTERFLY_FIRST_DISCOVERY_ID }],
  },
  {
    id: 'secret:juniper-hidden-moonpetal',
    discoveryId: JUNIPER_HIDDEN_MOONPETAL_DISCOVERY_ID,
    sceneKey: 'MoonflowerGladeScene',
    pattern: 'hidden-path',
    feedbackTier: 'grand',
    label: 'A final flutter in the flowers',
    actionLabel: 'Look closely',
    position: { x: 1200, y: 1650 },
    interactionRadius: 165,
    feedback:
      'Butterfly secret found!\nA hidden moonpetal opens where the butterfly lands, leaving a tiny ribbon charm behind. 🌸🦋',
    worldFlagId: JUNIPER_BUTTERFLY_TRAIL_FLAG,
    rewardItemId: BUTTERFLY_WINDOW_CHARM_ITEM_ID,
    rewardQuantity: 1,
    conditions: [{ type: 'discovery', discoveryId: JUNIPER_BUTTERFLY_BRIDGE_DISCOVERY_ID }],
  },
] as const satisfies readonly SecretDiscoveryDefinition[];
