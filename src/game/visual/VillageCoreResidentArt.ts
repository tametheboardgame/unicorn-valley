import type Phaser from 'phaser';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import type { UnicornAppearancePalette } from '../player/UnicornAppearanceRenderer';
import {
  createResidentAppearanceSprite,
  SUPPORTING_RESIDENT_ART_LAYOUT,
} from '../population/SupportingResidentArt';
import { CORE_NPC_VISUALS } from './CoreNpcProductionArt';

export const VILLAGE_CORE_RESIDENT_IDS = ['willow', 'marigold', 'pebble'] as const;
export type VillageCoreResidentId = (typeof VILLAGE_CORE_RESIDENT_IDS)[number];

interface VillageCoreResidentPresentation {
  appearance: UnicornAppearance;
  palette: UnicornAppearancePalette;
}

export const VILLAGE_CORE_RESIDENT_ART_LAYOUT = SUPPORTING_RESIDENT_ART_LAYOUT;

export const VILLAGE_CORE_RESIDENT_PRESENTATIONS: Readonly<
  Record<VillageCoreResidentId, VillageCoreResidentPresentation>
> = {
  willow: {
    appearance: {
      bodyColour: 'mint',
      eyeColour: 'green',
      maneStyle: 'soft',
      maneColour: 'midnight',
      tailStyle: 'plume',
      tailColour: 'aqua',
      hornStyle: 'moon',
      marking: 'moon',
      accessory: 'flower',
    },
    palette: {
      body: CORE_NPC_VISUALS.willow.body,
      eye: 0x4f8967,
      mane: CORE_NPC_VISUALS.willow.mane,
      tail: CORE_NPC_VISUALS.willow.maneAccent,
    },
  },
  marigold: {
    appearance: {
      bodyColour: 'peach',
      eyeColour: 'amber',
      maneStyle: 'fluffy',
      maneColour: 'gold',
      tailStyle: 'curl',
      tailColour: 'coral',
      hornStyle: 'short',
      marking: 'heart',
      accessory: 'flower',
    },
    palette: {
      body: CORE_NPC_VISUALS.marigold.body,
      eye: 0x9a713d,
      mane: CORE_NPC_VISUALS.marigold.mane,
      tail: CORE_NPC_VISUALS.marigold.maneAccent,
    },
  },
  pebble: {
    appearance: {
      bodyColour: 'pearl',
      eyeColour: 'green',
      maneStyle: 'swept',
      maneColour: 'midnight',
      tailStyle: 'puff',
      tailColour: 'gold',
      hornStyle: 'short',
      marking: 'freckles',
      accessory: 'bell',
    },
    palette: {
      body: CORE_NPC_VISUALS.pebble.body,
      eye: 0x4f8967,
      mane: CORE_NPC_VISUALS.pebble.mane,
      tail: CORE_NPC_VISUALS.pebble.maneAccent,
    },
  },
};

export function isVillageCoreResidentId(id: string): id is VillageCoreResidentId {
  return VILLAGE_CORE_RESIDENT_IDS.includes(id as VillageCoreResidentId);
}

export function createVillageCoreResidentSprite(
  scene: Phaser.Scene,
  id: VillageCoreResidentId,
  name: string,
): Phaser.GameObjects.Sprite {
  const presentation = VILLAGE_CORE_RESIDENT_PRESENTATIONS[id];
  return createResidentAppearanceSprite(
    scene,
    `village-core-resident:${id}:idle`,
    name,
    presentation.appearance,
    presentation.palette,
  );
}
