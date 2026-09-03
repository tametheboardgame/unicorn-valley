import {
  BREEZE_WINDMILL_ACTIVE_FLAG,
  BREEZE_WINDMILL_COMPLETE_FLAG,
  MEADOW_FLOWER_CIRCLE_REVEALED_FLAG,
} from '../../content/r6MeadowRunContent';
import type {
  ResidentPlacementDefinition,
  ResidentTalkVariant,
  SupportingResidentId,
} from './AmbientPopulationTypes';

export const R6_MEADOW_RESIDENT_PLACEMENTS = [
  {
    id: 'resident-placement:breeze:windmill-route',
    residentId: 'resident:breeze',
    sceneKey: 'RainbowMeadowScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 84,
    interactionRadius: 126,
    priority: 24,
    waypoints: [
      { id: 'breeze-windmill-a', x: 820, y: 680, pauseMs: 1700 },
      { id: 'breeze-windmill-b', x: 880, y: 650, pauseMs: 2400 },
      { id: 'breeze-windmill-c', x: 920, y: 630, pauseMs: 2100 },
    ],
  },
  {
    id: 'resident-placement:maple:meadow-picnic',
    residentId: 'resident:maple',
    sceneKey: 'RainbowMeadowScene',
    behaviour: 'activity-loop',
    routeMode: 'ping-pong',
    speedPxPerSecond: 68,
    interactionRadius: 124,
    priority: 18,
    waypoints: [
      { id: 'maple-picnic-a', x: 1430, y: 1320, pauseMs: 2600 },
      { id: 'maple-picnic-b', x: 1510, y: 1380, pauseMs: 3200 },
      { id: 'maple-picnic-c', x: 1590, y: 1340, pauseMs: 2300 },
    ],
  },
  {
    id: 'resident-placement:juniper:meadow-butterflies',
    residentId: 'resident:juniper',
    sceneKey: 'RainbowMeadowScene',
    behaviour: 'local-wander',
    routeMode: 'random-neighbour',
    speedPxPerSecond: 70,
    interactionRadius: 122,
    priority: 17,
    activeWhen: { timeStates: ['morning', 'afternoon'] },
    waypoints: [
      { id: 'juniper-meadow-a', x: 520, y: 1180, pauseMs: 2500 },
      { id: 'juniper-meadow-b', x: 610, y: 1120, pauseMs: 3000 },
      { id: 'juniper-meadow-c', x: 720, y: 1160, pauseMs: 2200 },
    ],
  },
] as const satisfies readonly ResidentPlacementDefinition[];

export const R6_MEADOW_RESIDENT_TALK_VARIANTS: Partial<
  Record<SupportingResidentId, readonly ResidentTalkVariant[]>
> = {
  'resident:breeze': [
    {
      id: 'resident-talk:breeze:windmill-complete',
      priority: 40,
      activeWhen: {
        worldFlags: [{ id: BREEZE_WINDMILL_COMPLETE_FLAG, value: true }],
      },
      lines: [
        'You found the glint from the lookout! I knew the Meadow was hiding a curve in that flower path.',
        'Your little sky pennant looks exactly right when the wind catches it.',
        'Racing is fun, but sometimes the best route is the one where nobody is timing you.',
      ],
    },
    {
      id: 'resident-talk:breeze:windmill-active',
      priority: 30,
      activeWhen: {
        worldFlags: [{ id: BREEZE_WINDMILL_ACTIVE_FLAG, value: true }],
      },
      lines: [
        'The windmill bell likes three clear notes. Listen between the gusts.',
        'Once the lookout opens, look back towards the flowers rather than the race flags.',
      ],
    },
  ],
  'resident:clover': [
    {
      id: 'resident-talk:clover:windmill-complete',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: BREEZE_WINDMILL_COMPLETE_FLAG, value: true }],
      },
      lines: [
        'Breeze says you found a route with no finish line. That sounds like my kind of race.',
        'I tried following the curve you spotted from the windmill. I got distracted by three excellent flowers.',
        'When the Rainbow Cup gets going, I am absolutely claiming the wobbliest route.',
      ],
    },
  ],
  'resident:juniper': [
    {
      id: 'resident-talk:juniper:flower-circle',
      priority: 25,
      activeWhen: {
        worldFlags: [{ id: MEADOW_FLOWER_CIRCLE_REVEALED_FLAG, value: true }],
      },
      lines: [
        'You found the flower circle! The butterflies have been using it like a tiny roundabout.',
        'I counted seven kinds of petal in that circle and then lost count because a beetle walked past.',
        'It really does show up differently when the sky changes. I knew I was not imagining it.',
      ],
    },
  ],
  'resident:maple': [
    {
      id: 'resident-talk:maple:meadow-picnic',
      priority: 10,
      activeWhen: {},
      lines: [
        'Picnic Hill has the perfect slope: enough view, not enough slope for buns to escape.',
        'I am testing whether snacks taste more colourful in Rainbow Meadow.',
        'If the race crowd gets hungry later, I have plans. Extremely crumbly plans.',
      ],
    },
  ],
};
