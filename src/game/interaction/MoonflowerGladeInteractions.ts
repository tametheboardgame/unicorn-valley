import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import type { InteractionTarget } from './InteractionTarget';

type GladeLandmarkId = (typeof MOONFLOWER_GLADE_MAP.landmarks)[number]['id'];

function landmarkApproach(id: GladeLandmarkId): { x: number; y: number } {
  const landmark = MOONFLOWER_GLADE_MAP.landmarks.find((candidate) => candidate.id === id);
  if (!landmark) {
    throw new Error(`Moonflower Glade interaction references missing landmark: ${id}`);
  }

  return landmark.approach;
}

export const MOONFLOWER_GLADE_INTERACTIONS = [
  {
    id: 'interaction:moonflower-cottage-door',
    label: 'Moonflower Cottage',
    actionLabel: 'Go inside',
    position: landmarkApproach('moonflower-cottage'),
    interactionRadius: 155,
    priority: 10,
    result: {
      type: 'scene-transition',
      sceneKey: 'DoorwayStubScene',
      payload: {
        title: 'Moonflower Cottage',
        message:
          'Your cottage interior will become a real place later. For now, the doorway works!',
        returnScene: 'MoonflowerGladeScene',
      },
    },
  },
  {
    id: 'interaction:hollow-tree',
    label: 'Hollow Tree',
    actionLabel: 'Peek inside',
    position: landmarkApproach('hollow-tree'),
    interactionRadius: 175,
    result: {
      type: 'message',
      title: 'The Hollow Tree',
      message: 'There is a tiny purple glimmer deep inside. Something may be hiding here later…',
    },
  },
  {
    id: 'interaction:display-stump',
    label: 'Wonderbook',
    actionLabel: 'Open book',
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
] satisfies readonly InteractionTarget[];
