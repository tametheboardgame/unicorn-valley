import type { DiscoveryDefinition } from './contentTypes';
import type { SecretDiscoveryDefinition } from './r4Secrets';

export const WHISPERING_WOODS_REGION_DISCOVERY_ID = 'discovery:whispering-woods' as const;
export const MOONCAP_GROVE_DISCOVERY_ID = 'discovery:woods-mooncap-grove' as const;
export const GLOWFERN_ARCH_DISCOVERY_ID = 'discovery:woods-glowfern-arch' as const;
export const MOSSY_WHISPER_PATH_DISCOVERY_ID = 'discovery:woods-mossy-whisper-path' as const;
export const MOSSY_WHISPER_PATH_REVEALED_FLAG = 'flag:r5-woods-mossy-path-revealed' as const;

export const R5_WHISPERING_WOODS_DISCOVERIES = [
  {
    id: WHISPERING_WOODS_REGION_DISCOVERY_ID,
    name: 'Whispering Woods',
    description: 'A shaded woodland where soft lights, mushrooms and rustling leaves make the paths feel quietly magical.',
    icon: '🌲',
  },
  {
    id: MOONCAP_GROVE_DISCOVERY_ID,
    name: 'Mooncap Grove',
    description: 'A patch of pale mushrooms that glow like tiny moons beneath the trees.',
    icon: '🍄',
  },
  {
    id: GLOWFERN_ARCH_DISCOVERY_ID,
    name: 'Glowfern Arch',
    description: 'Two old roots meet above the path while bright ferns light the way underneath.',
    icon: '🌿',
  },
  {
    id: MOSSY_WHISPER_PATH_DISCOVERY_ID,
    name: 'Mossy Whisper Path',
    description: 'A hidden side path marked by little green lights and a trail of silver leaves.',
    kind: 'secret',
    icon: '✨',
    undiscoveredHint: 'A few silver leaves seem to point away from the main path.',
  },
] as const satisfies readonly DiscoveryDefinition[];

export const R5_WHISPERING_WOODS_SECRETS = [
  {
    id: 'secret:woods-mossy-whisper-path',
    discoveryId: MOSSY_WHISPER_PATH_DISCOVERY_ID,
    sceneKey: 'WhisperingWoodsScene',
    pattern: 'hidden-path',
    feedbackTier: 'secret',
    label: 'Silver leaves',
    actionLabel: 'Follow',
    position: { x: 2550, y: 1510 },
    interactionRadius: 170,
    feedback: 'Secret path found!\nThe silver leaves brighten and show a mossy way between the roots. ✨',
    worldFlagId: MOSSY_WHISPER_PATH_REVEALED_FLAG,
    revealedPath: [
      { x: 2280, y: 1320 },
      { x: 2380, y: 1390 },
      { x: 2470, y: 1460 },
      { x: 2550, y: 1510 },
      { x: 2670, y: 1560 },
      { x: 2810, y: 1590 },
    ],
  },
] as const satisfies readonly SecretDiscoveryDefinition[];
