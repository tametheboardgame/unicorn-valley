import {
  FERN_FIREFLY_WAY_ACTIVE_FLAG,
  FERN_FIREFLY_WAY_COMPLETE_FLAG,
  TINY_TRACKS_COMPLETE_FLAG,
  WOODS_LIGHT_TRAIL_FLAG,
} from '../../content/r6WhisperingWoodsDepthContent';
import type {
  ResidentPlacementDefinition,
  ResidentTalkVariant,
  SupportingResidentId,
} from './AmbientPopulationTypes';

export const R6_WOODS_RESIDENT_PLACEMENTS = [
  {
    id: 'resident-placement:fern:lantern-clearing-route',
    residentId: 'resident:fern',
    sceneKey: 'WhisperingWoodsScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 68,
    interactionRadius: 126,
    priority: 26,
    waypoints: [
      { id: 'fern-woods-a', x: 2550, y: 850, pauseMs: 1800 },
      { id: 'fern-woods-b', x: 2750, y: 790, pauseMs: 2600 },
      { id: 'fern-woods-c', x: 2980, y: 820, pauseMs: 2100 },
    ],
  },
  {
    id: 'resident-placement:juniper:mooncap-evening',
    residentId: 'resident:juniper',
    sceneKey: 'WhisperingWoodsScene',
    behaviour: 'local-wander',
    routeMode: 'random-neighbour',
    speedPxPerSecond: 64,
    interactionRadius: 120,
    priority: 14,
    activeWhen: { timeStates: ['sunset', 'night'] },
    waypoints: [
      { id: 'juniper-woods-a', x: 980, y: 760, pauseMs: 2400 },
      { id: 'juniper-woods-b', x: 1140, y: 730, pauseMs: 3000 },
      { id: 'juniper-woods-c', x: 1280, y: 820, pauseMs: 1900 },
    ],
  },
] as const satisfies readonly ResidentPlacementDefinition[];

export const R6_WOODS_RESIDENT_TALK_VARIANTS: Partial<
  Record<SupportingResidentId, readonly ResidentTalkVariant[]>
> = {
  'resident:fern': [
    {
      id: 'resident-talk:fern:firefly-way-complete',
      priority: 40,
      activeWhen: {
        worldFlags: [{ id: FERN_FIREFLY_WAY_COMPLETE_FLAG, value: true }],
      },
      lines: [
        'The permanent light trail makes the Grove easy to find without making the Woods feel less mysterious.',
        'The lantern plant still opens when the fireflies gather. I think it likes having company.',
        'Your little Firefly Lantern is the take-home version. The Grove is the enormous version.',
      ],
    },
    {
      id: 'resident-talk:fern:firefly-way-active',
      priority: 30,
      activeWhen: {
        worldFlags: [{ id: FERN_FIREFLY_WAY_ACTIVE_FLAG, value: true }],
      },
      lines: [
        'Patient lights first, friendly old tree second, then the lantern plant inside the Grove.',
        'The fireflies are not rushing us. That is usually a clue in itself.',
      ],
    },
    {
      id: 'resident-talk:fern:light-trail',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: WOODS_LIGHT_TRAIL_FLAG, value: true }],
      },
      lines: [
        'The little trail is still shining. The Woods decided this secret can stay findable.',
      ],
    },
  ],
  'resident:juniper': [
    {
      id: 'resident-talk:juniper:tiny-tracks-complete',
      priority: 25,
      activeWhen: {
        worldFlags: [{ id: TINY_TRACKS_COMPLETE_FLAG, value: true }],
      },
      lines: [
        'I saw the moss-tail too! Only for half a second, but half a second definitely counts.',
        'Tiny tracks are much easier to spot when you stop looking for something enormous.',
      ],
    },
  ],
};
