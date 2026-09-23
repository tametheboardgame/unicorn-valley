import type Phaser from 'phaser';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  MOONFLOWER_GLADE_LOCATION_ID,
  saveLocationCheckpoint,
} from '../save/saveLocationCheckpoint';
import {
  startMarigoldConversation,
  startPebbleConversation,
  startWillowConversation,
} from '../story/WorldStoryConversations';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';
import {
  setSunbeamVillagePlayerSpawn,
  SUNBEAM_VILLAGE_MAP,
} from '../world/SunbeamVillageMap';
import { SUNBEAM_VILLAGE_LAYOUT } from '../world/SunbeamVillageLayout';
import type { InteractionTarget } from './InteractionTarget';
import { getSceneInteractionRegistry } from './SceneInteractionRegistry';

export const SUNBEAM_VILLAGE_INTERACTION_OWNER = 'sunbeam-village';

function landmarkApproach(id: string): { x: number; y: number } {
  const landmark = SUNBEAM_VILLAGE_MAP.landmarks.find((candidate) => candidate.id === id);
  if (!landmark) {
    throw new Error(`Sunbeam Village interaction references missing landmark: ${id}`);
  }
  return landmark.approach;
}

function entrancePosition(id: string): { x: number; y: number } {
  const entrance = SUNBEAM_VILLAGE_MAP.entrances.find((candidate) => candidate.id === id);
  if (!entrance) {
    throw new Error(`Sunbeam Village interaction references missing entrance: ${id}`);
  }
  return entrance.position;
}

function npcPosition(id: string): { x: number; y: number } {
  const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === id);
  if (!marker) {
    throw new Error(`Sunbeam Village interaction references missing NPC marker: ${id}`);
  }
  return marker.position;
}

function residenceApproach(id: string): { x: number; y: number } {
  const residence = SUNBEAM_VILLAGE_LAYOUT.residences.find((candidate) => candidate.id === id);
  if (!residence) {
    throw new Error(`Sunbeam Village interaction references missing residence: ${id}`);
  }
  return residence.approach;
}

function enterInterior(
  scene: Phaser.Scene,
  interiorId: 'bakery' | 'accessory-shop' | 'library',
  returnPosition: { x: number; y: number },
): void {
  setSunbeamVillagePlayerSpawn(returnPosition);
  scene.scene.start('VillageInteriorScene', {
    interiorId,
    returnScene: 'SunbeamVillageScene',
  });
}

function leaveVillage(
  scene: Phaser.Scene,
  destination: 'moonflower-glade' | 'rainbow-meadow',
): void {
  if (destination === 'moonflower-glade') {
    const villageEntrance = MOONFLOWER_GLADE_MAP.entrances.find(
      (entrance) => entrance.id === 'sunbeam-village',
    );
    if (villageEntrance) {
      setMoonflowerGladePlayerSpawn(villageEntrance.approach);
    }
    saveLocationCheckpoint(getBrowserSaveService(), MOONFLOWER_GLADE_LOCATION_ID);
    scene.scene.start('MoonflowerGladeScene');
    return;
  }

  const villageEntrance = RAINBOW_MEADOW_MAP.entrances.find(
    (entrance) => entrance.id === 'sunbeam-village',
  );
  if (villageEntrance) {
    setRainbowMeadowPlayerSpawn(villageEntrance.approach);
  }
  saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_MEADOW_LOCATION_ID);
  scene.scene.start('RainbowMeadowScene');
}

export function createSunbeamVillageInteractions(scene: Phaser.Scene): InteractionTarget[] {
  return [
    {
      id: 'interaction:village-bakery',
      label: 'Sunbeam Bakery',
      actionLabel: 'Enter',
      actionKind: 'enter',
      position: landmarkApproach('bakery'),
      interactionRadius: 155,
      result: {
        type: 'callback',
        activate: () => enterInterior(scene, 'bakery', landmarkApproach('bakery')),
      },
    },
    {
      id: 'interaction:village-accessory-shop',
      label: 'Twinkle & Thread',
      actionLabel: 'Enter',
      actionKind: 'enter',
      position: landmarkApproach('accessory-shop'),
      interactionRadius: 155,
      result: {
        type: 'callback',
        activate: () =>
          enterInterior(scene, 'accessory-shop', landmarkApproach('accessory-shop')),
      },
    },
    {
      id: 'interaction:village-library',
      label: 'Story House',
      actionLabel: 'Enter',
      actionKind: 'enter',
      position: landmarkApproach('library'),
      interactionRadius: 160,
      result: {
        type: 'callback',
        activate: () => enterInterior(scene, 'library', landmarkApproach('library')),
      },
    },
    {
      id: 'interaction:village-fountain',
      label: 'Sunbeam Fountain',
      actionLabel: 'Make a wish',
      actionKind: 'inspect',
      position: landmarkApproach('sunbeam-fountain'),
      interactionRadius: 145,
      result: {
        type: 'message',
        title: 'Sunbeam Fountain',
        message: 'The water catches a tiny rainbow when you get close. Maybe wishes linger here.',
      },
    },
    {
      id: 'interaction:village-willow',
      label: 'Willow',
      actionLabel: 'Talk',
      actionKind: 'talk',
      position: npcPosition('willow'),
      interactionRadius: 150,
      priority: 30,
      result: { type: 'callback', activate: () => startWillowConversation(scene) },
    },
    {
      id: 'interaction:village-marigold',
      label: 'Marigold',
      actionLabel: 'Talk',
      actionKind: 'talk',
      position: npcPosition('marigold'),
      interactionRadius: 150,
      priority: 30,
      result: { type: 'callback', activate: () => startMarigoldConversation(scene) },
    },
    {
      id: 'interaction:village-pebble',
      label: 'Pebble',
      actionLabel: 'Talk',
      actionKind: 'talk',
      position: npcPosition('pebble'),
      interactionRadius: 150,
      priority: 30,
      result: { type: 'callback', activate: () => startPebbleConversation(scene) },
    },
    {
      id: 'interaction:village-residence-rosehip',
      label: 'Rosehip Cottage',
      actionLabel: 'Knock',
      actionKind: 'interact',
      position: residenceApproach('rosehip-cottage'),
      interactionRadius: 135,
      result: {
        type: 'message',
        title: 'Rosehip Cottage',
        message: "A handwritten card by the door says, 'Out in the valley. Tea another day!'",
      },
    },
    {
      id: 'interaction:village-residence-bluebell',
      label: 'Bluebell Cottage',
      actionLabel: 'Knock',
      actionKind: 'interact',
      position: residenceApproach('bluebell-cottage'),
      interactionRadius: 135,
      result: {
        type: 'message',
        title: 'Bluebell Cottage',
        message:
          'Warm light glows behind the curtains. A little note asks visitors to wait for an invitation before coming in.',
      },
    },
    {
      id: 'interaction:village-residence-sunpetal',
      label: 'Sunpetal Cottage',
      actionLabel: 'Knock',
      actionKind: 'interact',
      position: residenceApproach('sunpetal-cottage'),
      interactionRadius: 135,
      result: {
        type: 'message',
        title: 'Sunpetal Cottage',
        message: "Tiny boots and a watering can rest by the step. This is someone's home, not a shop.",
      },
    },
    {
      id: 'interaction:village-south-gate',
      label: 'Candyland Gate',
      actionLabel: 'Inspect',
      actionKind: 'inspect',
      position: SUNBEAM_VILLAGE_LAYOUT.boundaryFence.lockedSouthGate.approach,
      interactionRadius: 150,
      result: {
        type: 'message',
        title: 'Candyland',
        message:
          'Candyland is opening soon! The unicorn theme park is still getting its rides, treats and sparkles ready for visitors.',
      },
    },
    {
      id: 'interaction:village-glade-gate',
      label: 'Moonflower Glade',
      actionLabel: 'Go home',
      actionKind: 'enter',
      activationMode: 'automatic',
      position: entrancePosition('moonflower-glade'),
      interactionRadius: 130,
      priority: 20,
      result: {
        type: 'callback',
        activate: () => leaveVillage(scene, 'moonflower-glade'),
      },
    },
    {
      id: 'interaction:village-meadow-gate',
      label: 'Rainbow Meadow',
      actionLabel: 'Visit meadow',
      actionKind: 'enter',
      activationMode: 'automatic',
      position: entrancePosition('rainbow-meadow'),
      interactionRadius: 130,
      priority: 20,
      result: {
        type: 'callback',
        activate: () => leaveVillage(scene, 'rainbow-meadow'),
      },
    },
  ];
}

export function registerSunbeamVillageInteractions(scene: Phaser.Scene): void {
  getSceneInteractionRegistry(scene).replaceOwnerTargets(
    SUNBEAM_VILLAGE_INTERACTION_OWNER,
    createSunbeamVillageInteractions(scene),
  );
}
