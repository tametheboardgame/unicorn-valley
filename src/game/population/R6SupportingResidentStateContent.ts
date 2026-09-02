import type {
  ResidentStoryAnchorDefinition,
  ResidentTalkVariant,
  SupportingResidentId,
} from './AmbientPopulationTypes';

const WILLOW_GARDEN_PLANTED_FLAG = 'flag:willow-garden-planted';

export const R6_AMBIENT_RESIDENT_STORY_ANCHORS = [
  {
    id: 'resident-anchor:juniper:willow-garden',
    residentId: 'resident:juniper',
    sceneKey: 'MoonflowerGladeScene',
    position: { x: 1130, y: 1440 },
    interactionRadius: 120,
    activeWhen: {
      worldFlags: [{ id: WILLOW_GARDEN_PLANTED_FLAG, value: true }],
    },
  },
] as const satisfies readonly ResidentStoryAnchorDefinition[];

export const R6_SUPPORTING_RESIDENT_TALK_VARIANTS: Partial<
  Record<SupportingResidentId, readonly ResidentTalkVariant[]>
> = {
  'resident:juniper': [
    {
      id: 'resident-talk:juniper:willow-garden',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: WILLOW_GARDEN_PLANTED_FLAG, value: true }],
      },
      lines: [
        "Willow's moonflowers are doing brilliantly. I counted three tiny new buds!",
        'The garden smells different now. Sweet, but also a little bit sparkly.',
        'I am keeping watch for the first butterfly that notices the new flowers.',
      ],
    },
  ],
};
