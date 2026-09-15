import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import type { InteractionTarget } from './InteractionTarget';

type GladeLandmarkId = (typeof MOONFLOWER_GLADE_MAP.landmarks)[number]['id'];
type GladeEntranceId = (typeof MOONFLOWER_GLADE_MAP.entrances)[number]['id'];
type GladeGardenPlotId = (typeof MOONFLOWER_GLADE_MAP.gardenPlots)[number]['id'];

function landmarkApproach(id: GladeLandmarkId): { x: number; y: number } {
  const landmark = MOONFLOWER_GLADE_MAP.landmarks.find((candidate) => candidate.id === id);
  if (!landmark) {
    throw new Error(`Moonflower Glade interaction references missing landmark: ${id}`);
  }

  return landmark.approach;
}

function entranceApproach(id: GladeEntranceId): { x: number; y: number } {
  const entrance = MOONFLOWER_GLADE_MAP.entrances.find((candidate) => candidate.id === id);
  if (!entrance) {
    throw new Error(`Moonflower Glade interaction references missing entrance: ${id}`);
  }

  return entrance.approach;
}

function gardenApproach(id: GladeGardenPlotId): { x: number; y: number } {
  const plot = MOONFLOWER_GLADE_MAP.gardenPlots.find((candidate) => candidate.id === id);
  if (!plot) {
    throw new Error(`Moonflower Glade interaction references missing garden plot: ${id}`);
  }

  return plot.approach;
}

function gardenInteraction(
  plotId: GladeGardenPlotId,
  interactionId: string,
  label: string,
): InteractionTarget {
  return {
    id: interactionId,
    label,
    actionLabel: 'Inspect',
    actionKind: 'inspect',
    position: gardenApproach(plotId),
    interactionRadius: 150,
    priority: 8,
    result: {
      type: 'message',
      title: label,
      message: 'Fresh soil, ready for seeds. This growing patch will be useful for gardening later.',
    },
  };
}

export const MOONFLOWER_GLADE_INTERACTIONS = [
  {
    id: 'interaction:moonflower-cottage-door',
    label: 'Moonflower Cottage',
    actionLabel: 'Go inside',
    actionKind: 'enter',
    position: landmarkApproach('moonflower-cottage'),
    interactionRadius: 155,
    priority: 10,
    result: {
      type: 'scene-transition',
      sceneKey: 'CottageInteriorScene',
    },
  },
  {
    id: 'interaction:western-gate',
    label: 'Old Garden Gate',
    actionLabel: 'Check gate',
    actionKind: 'inspect',
    position: landmarkApproach('western-gate'),
    interactionRadius: 165,
    priority: 9,
    result: {
      type: 'message',
      title: 'Old Garden Gate',
      message:
        'A small silver lock holds the gate shut. It looks like it might open with the right key.',
    },
  },
  gardenInteraction('garden:main', 'interaction:garden-main', 'Cottage Garden'),
  gardenInteraction('garden:upper', 'interaction:garden-upper', 'Upper Garden'),
  gardenInteraction('garden:stream-bank', 'interaction:garden-stream-bank', 'Stream Garden'),
  {
    id: 'interaction:sunbeam-village-gate',
    label: 'Sunbeam Village',
    actionLabel: 'Go towards Rainbow Meadow',
    actionKind: 'enter',
    position: entranceApproach('sunbeam-village'),
    interactionRadius: 180,
    priority: 20,
    result: {
      type: 'scene-transition',
      sceneKey: 'SunbeamVillageScene',
    },
  },
] satisfies readonly InteractionTarget[];
