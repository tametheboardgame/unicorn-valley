import type { CharacterDefinition, DialogueDefinition, DiscoveryDefinition } from './contentTypes';
import type { SecretDiscoveryDefinition } from './r4Secrets';

export const LUMI_CHARACTER_ID = 'character:lumi' as const;
export const FIREFLY_SPIRAL_DISCOVERY_ID = 'discovery:woods-firefly-spiral' as const;
export const HUMMING_BARK_DISCOVERY_ID = 'discovery:woods-humming-bark' as const;
export const STARWELL_DISCOVERY_ID = 'discovery:woods-starwell' as const;
export const STARWELL_REVEALED_FLAG = 'flag:r5-woods-starwell-revealed' as const;
export const LUMI_INTRO_RELATIONSHIP_FLAG = 'r5:lumi-intro-complete' as const;

export const R5_LUMI_CHARACTERS = [
  {
    id: LUMI_CHARACTER_ID,
    name: 'Lumi',
    role: 'Quiet keeper of the Woods lights and collector of curious night-time patterns',
  },
] as const satisfies readonly CharacterDefinition[];

export const R5_LUMI_DISCOVERIES = [
  {
    id: FIREFLY_SPIRAL_DISCOVERY_ID,
    name: 'Firefly Spiral',
    description: 'A cluster of fireflies loops in the same tiny spiral whenever the Woods grows especially quiet.',
    kind: 'secret',
    icon: '✨',
    undiscoveredHint: 'The lights in Lantern Clearing sometimes move together instead of drifting apart.',
  },
  {
    id: HUMMING_BARK_DISCOVERY_ID,
    name: 'Humming Bark',
    description: 'One old tree gives off a soft note when the glowferns beneath it brighten.',
    kind: 'secret',
    icon: '🌳',
    undiscoveredHint: 'Near the Glowfern Arch, one trunk sounds different when the ferns shine.',
  },
  {
    id: STARWELL_DISCOVERY_ID,
    name: 'The Starwell',
    description: 'A hidden hollow where reflected firefly light makes the dark water look full of tiny stars.',
    kind: 'secret',
    icon: '🌌',
    undiscoveredHint: 'Two strange Woods clues may be pointing towards the same hidden place.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R5_LUMI_SECRETS = [
  {
    id: 'secret:woods-firefly-spiral',
    discoveryId: FIREFLY_SPIRAL_DISCOVERY_ID,
    sceneKey: 'WhisperingWoodsScene',
    pattern: 'conditional-clue',
    feedbackTier: 'secret',
    label: 'Fireflies moving together',
    actionLabel: 'Watch',
    position: { x: 2740, y: 760 },
    interactionRadius: 155,
    feedback: 'Something unusual!\nThe fireflies loop into a perfect spiral, then drift apart again. ✨',
  },
  {
    id: 'secret:woods-humming-bark',
    discoveryId: HUMMING_BARK_DISCOVERY_ID,
    sceneKey: 'WhisperingWoodsScene',
    pattern: 'conditional-clue',
    feedbackTier: 'secret',
    label: 'A softly humming tree',
    actionLabel: 'Listen',
    position: { x: 2110, y: 940 },
    interactionRadius: 150,
    feedback: 'Another odd clue!\nThe old bark hums the same three notes as the bright glowferns. 🌳',
  },
  {
    id: 'secret:woods-starwell',
    discoveryId: STARWELL_DISCOVERY_ID,
    sceneKey: 'WhisperingWoodsScene',
    pattern: 'hidden-path',
    feedbackTier: 'grand',
    label: 'A trail of matching lights',
    actionLabel: 'Follow',
    position: { x: 2920, y: 1640 },
    interactionRadius: 175,
    feedback: 'Big secret!\nThe clues line up and a hidden path opens onto the Starwell. 🌌',
    worldFlagId: STARWELL_REVEALED_FLAG,
    conditions: [
      { type: 'discovery', discoveryId: FIREFLY_SPIRAL_DISCOVERY_ID },
      { type: 'discovery', discoveryId: HUMMING_BARK_DISCOVERY_ID },
    ],
    revealedPath: [
      { x: 2520, y: 1290 },
      { x: 2620, y: 1390 },
      { x: 2730, y: 1480 },
      { x: 2830, y: 1560 },
      { x: 2920, y: 1640 },
    ],
  },
] as const satisfies readonly SecretDiscoveryDefinition[];

export const R5_LUMI_DIALOGUES = [
  {
    id: 'dialogue:lumi-starwell-intro',
    name: 'Lumi and the Starwell',
    startNodeId: 'dialogue-node:lumi-starwell-intro-1',
    nodes: [
      {
        id: 'dialogue-node:lumi-starwell-intro-1',
        type: 'line',
        speakerId: LUMI_CHARACTER_ID,
        text: 'You followed the spiral and the humming tree all the way here. Most visitors notice one clue and hurry past the other.',
        nextNodeId: 'dialogue-node:lumi-starwell-intro-2',
      },
      {
        id: 'dialogue-node:lumi-starwell-intro-2',
        type: 'line',
        speakerId: LUMI_CHARACTER_ID,
        text: 'I am Lumi. I look after the little lights when they gather around the Starwell, but they chose to show you the path themselves.',
        nextNodeId: 'dialogue-node:lumi-starwell-intro-3',
      },
      {
        id: 'dialogue-node:lumi-starwell-intro-3',
        type: 'line',
        speakerId: LUMI_CHARACTER_ID,
        text: 'The Woods is not trying to trick you. It just likes being noticed slowly. Come back sometimes and the lights may arrange themselves differently.',
      },
    ],
  },
  {
    id: 'dialogue:lumi-starwell-followup',
    name: 'Lumi at the Starwell - Follow-up',
    startNodeId: 'dialogue-node:lumi-starwell-followup-1',
    nodes: [
      {
        id: 'dialogue-node:lumi-starwell-followup-1',
        type: 'line',
        speakerId: LUMI_CHARACTER_ID,
        text: 'The Starwell remembers you now. The fireflies are much less secretive once they decide someone pays attention.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
