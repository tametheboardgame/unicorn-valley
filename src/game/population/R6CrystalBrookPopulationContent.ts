import {
  CRYSTAL_GROTTO_GLOWING_FLAG,
  ECHO_CRYSTAL_SONG_ACTIVE_FLAG,
  ECHO_CRYSTAL_SONG_COMPLETE_FLAG,
} from '../../content/r6CrystalBrookDepthContent';
import type {
  ResidentPlacementDefinition,
  ResidentTalkVariant,
  SupportingResidentId,
} from './AmbientPopulationTypes';

export const R6_CRYSTAL_BROOK_RESIDENT_PLACEMENTS = [
  {
    id: 'resident-placement:echo:grotto-route',
    residentId: 'resident:echo',
    sceneKey: 'CrystalBrookScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 72,
    interactionRadius: 126,
    priority: 25,
    waypoints: [
      { id: 'echo-brook-a', x: 2860, y: 1690, pauseMs: 2200 },
      { id: 'echo-brook-b', x: 2990, y: 1760, pauseMs: 2800 },
      { id: 'echo-brook-c', x: 3180, y: 1650, pauseMs: 2100 },
    ],
  },
] as const satisfies readonly ResidentPlacementDefinition[];

export const R6_CRYSTAL_BROOK_RESIDENT_TALK_VARIANTS: Partial<
  Record<SupportingResidentId, readonly ResidentTalkVariant[]>
> = {
  'resident:echo': [
    {
      id: 'resident-talk:echo:crystal-song-complete',
      priority: 40,
      activeWhen: {
        worldFlags: [{ id: ECHO_CRYSTAL_SONG_COMPLETE_FLAG, value: true }],
      },
      lines: [
        'The grotto kept our three notes. It sounds fuller every time the water moves now.',
        'Your Crystal Chime is the small version. The grotto is the very, very large version.',
        'Ripple says the Brook had room for one more song all along. I think they are right.',
      ],
    },
    {
      id: 'resident-talk:echo:crystal-song-active',
      priority: 30,
      activeWhen: {
        worldFlags: [{ id: ECHO_CRYSTAL_SONG_ACTIVE_FLAG, value: true }],
      },
      lines: [
        'Deep hum first. Bright ping second. Tiny bell last. I am trying not to hum the answer too loudly.',
        'The cave crystals are all different sizes, so their notes are different too.',
      ],
    },
    {
      id: 'resident-talk:echo:grotto-glowing',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: CRYSTAL_GROTTO_GLOWING_FLAG, value: true }],
      },
      lines: [
        'The Grotto is glowing even before I get there now. That feels like a very good sign.',
      ],
    },
  ],
};
