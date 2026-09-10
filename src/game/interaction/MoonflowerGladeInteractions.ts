import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import type { InteractionTarget } from './InteractionTarget';

type GladeLandmarkId = (typeof MOONFLOWER_GLADE_MAP.landmarks)[number]['id'];
type GladeEntranceId = (typeof MOONFLOWER_GLADE_MAP.entrances)[number]['id'];

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
    id: 'interaction:display-stump',
    label: 'Wonderbook',
    actionLabel: 'Open book',
    actionKind: 'inspect',
    position: landmarkApproach('display-stump'),
    interactionRadius: 145,
    result: {
      type: 'scene-transition',
      sceneKey: 'WonderbookScene',
      payload: {
        returnScene: 'MoonflowerGladeScene',
      },
    },
  },
  {
    id: 'interaction:moonflower-patch',
    label: 'Moonflower Field',
    actionLabel: 'Visit flower patch',
    actionKind: 'enter',
    position: landmarkApproach('moonflower-field'),
    interactionRadius: 180,
    priority: 12,
    result: {
      type: 'scene-transition',
      sceneKey: 'MoonflowerPatchScene',
    },
  },
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
