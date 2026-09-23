import Phaser from 'phaser';
import type { SupportingResidentDefinition } from '../population/AmbientPopulationTypes';
import {
  createSupportingResidentRoleSprite,
  createSupportingResidentSprite,
} from '../population/SupportingResidentArt';
import { worldDepthForY } from '../world/WorldDepth';

export type VillageInteriorRoleAccessory = 'chef-hat' | 'apron' | 'satchel';

export interface VillageInteriorResidentPresentationOptions {
  x: number;
  y: number;
  displaySize?: { width: number; height: number };
  accessories?: readonly VillageInteriorRoleAccessory[];
}

export interface VillageInteriorResidentPresentation {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
}

/**
 * Adds location-specific role presentation around the canonical supporting-resident sprite.
 * The unicorn itself still comes from SupportingResidentArt, so interiors do not fork NPC art.
 */
export function createVillageInteriorResidentPresentation(
  scene: Phaser.Scene,
  resident: SupportingResidentDefinition,
  options: VillageInteriorResidentPresentationOptions,
): VillageInteriorResidentPresentation {
  const accessories = options.accessories ?? [];
  const usesIntegratedBakerVisual =
    accessories.includes('chef-hat') && accessories.includes('apron');
  const sprite = (
    usesIntegratedBakerVisual
      ? createSupportingResidentRoleSprite(scene, resident, 'baker')
      : createSupportingResidentSprite(scene, resident)
  ).setPosition(0, 0);
  const size = options.displaySize ?? { width: 152, height: 128 };
  sprite.setDisplaySize(size.width, size.height);

  const objects: Phaser.GameObjects.GameObject[] = [sprite];
  for (const accessory of accessories) {
    if (accessory === 'chef-hat' || accessory === 'apron') {
      continue;
    }
    objects.push(...createRoleAccessory(scene, accessory));
  }

  const container = scene.add
    .container(options.x, options.y, objects)
    .setName(`village-interior-resident:${resident.id}`)
    .setDepth(worldDepthForY(options.y + 52, 0.4));
  container.setData('resident-id', resident.id);
  container.setData('role-accessories', [...(options.accessories ?? [])]);
  return { container, sprite };
}

function createRoleAccessory(
  scene: Phaser.Scene,
  accessory: VillageInteriorRoleAccessory,
): Phaser.GameObjects.GameObject[] {
  if (accessory !== 'satchel') {
    return [];
  }

  const satchel = scene.add.graphics().setName('village-interior-role:satchel');
  satchel.lineStyle(4, 0x7a5b4b, 0.95);
  satchel.lineBetween(-28, -46, 26, 18);
  satchel.fillStyle(0xa9785c, 1);
  satchel.fillRoundedRect(12, 6, 38, 30, 7);
  return [satchel];
}
