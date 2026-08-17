import type { InteractionTarget } from '../interaction/InteractionTarget';

export const FIRST_DISCOVERY_ID = 'discovery:moonflower-sparkle' as const;
export const FIRST_DISCOVERY_FLAG = 'flag:first-sparkle-found';
export const PIP_POSITION = { x: 970, y: 825 } as const;
export const FIRST_SPARKLE_POSITION = { x: 1120, y: 1030 } as const;
export const FIRST_SPARKLE_COLLECTION_RADIUS = 78;

export function createPipInteraction(hasFirstDiscovery: boolean): InteractionTarget {
  return {
    id: 'interaction:pip',
    label: 'Pip',
    actionLabel: 'Talk',
    position: PIP_POSITION,
    interactionRadius: 185,
    priority: 20,
    result: {
      type: 'dialogue',
      dialogueId: hasFirstDiscovery ? 'dialogue:pip-first-discovery' : 'dialogue:pip-welcome',
    },
  };
}
