import type { ResidentPlacementDefinition } from './AmbientPopulationTypes';

/**
 * Functional-regression placements discovered by the 2026-09-05 playthrough.
 *
 * These deliberately carry a higher priority than the older ambient routes so
 * they can repair discoverability without invalidating existing save data or
 * removing the authored resident definitions.
 */
export const R65_FUNCTIONAL_RESIDENT_PLACEMENTS = [
  {
    id: 'resident-placement:maple:village-bakery-discoverable',
    residentId: 'resident:maple',
    sceneKey: 'SunbeamVillageScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 74,
    interactionRadius: 136,
    priority: 180,
    waypoints: [
      { id: 'maple-bakery-door', x: 900, y: 760, pauseMs: 2600 },
      { id: 'maple-bakery-east', x: 1120, y: 800, pauseMs: 1500 },
      { id: 'maple-bakery-path', x: 1210, y: 920, pauseMs: 2100 },
    ],
  },
  {
    id: 'resident-placement:echo:crystal-brook-interactive-route',
    residentId: 'resident:echo',
    sceneKey: 'CrystalBrookScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 66,
    interactionRadius: 150,
    priority: 180,
    waypoints: [
      { id: 'echo-brook-a', x: 2860, y: 1690, pauseMs: 1800 },
      { id: 'echo-brook-b', x: 2990, y: 1760, pauseMs: 1800 },
    ],
  },
  {
    id: 'resident-placement:fern:woods-interactive-route',
    residentId: 'resident:fern',
    sceneKey: 'WhisperingWoodsScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 72,
    interactionRadius: 138,
    priority: 180,
    waypoints: [
      { id: 'fern-woods-a', x: 2550, y: 850, pauseMs: 2200 },
      { id: 'fern-woods-b', x: 2980, y: 820, pauseMs: 1900 },
    ],
  },
] as const satisfies readonly ResidentPlacementDefinition[];
