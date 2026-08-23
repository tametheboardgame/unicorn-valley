import type { DiscoveryDefinition } from './contentTypes';

export const STARDEW_DROP_DISCOVERY_ID = 'discovery:woods-stardew-drop';

export const R5_WEATHER_DISCOVERIES = [
  {
    id: STARDEW_DROP_DISCOVERY_ID,
    name: 'Stardew Drop',
    description:
      'A silver-bright drop that only glimmers into view when magical sparkles drift through Whispering Woods.',
    kind: 'secret',
    icon: '💧',
    undiscoveredHint: 'Something near the Mossy Whisper Path seems to wait for a very sparkly sky.',
  },
] as const satisfies readonly DiscoveryDefinition[];
