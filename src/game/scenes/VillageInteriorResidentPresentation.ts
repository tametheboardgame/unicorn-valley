import Phaser from 'phaser';
import type { SupportingResidentDefinition } from '../population/AmbientPopulationTypes';
import { createSupportingResidentSprite } from '../population/SupportingResidentArt';
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
  const sprite = createSupportingResidentSprite(scene, resident).setPosition(0, 0);
  const size = options.displaySize ?? { width: 152, height: 128 };
  sprite.setDisplaySize(size.width, size.height);

  const objects: Phaser.GameObjects.GameObject[] = [sprite];
  for (const accessory of options.accessories ?? []) {
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
  if (accessory === 'chef-hat') {
    const crown = scene.add.graphics().setName('village-interior-role:chef-hat');
    crown.fillStyle(0xfffbef, 1);
    crown.lineStyle(2, 0xd8c7ae, 0.9);
    crown.fillRoundedRect(11, -58, 42, 14, 6);
    crown.strokeRoundedRect(11, -58, 42, 14, 6);
    crown.fillCircle(19, -60, 11);
    crown.fillCircle(31, -66, 13);
    crown.fillCircle(44, -60, 11);
    return [crown];
  }

  if (accessory === 'apron') {
    const apron = scene.add.graphics().setName('village-interior-role:apron');
    apron.fillStyle(0xfff6dc, 0.98);
    apron.lineStyle(2, 0xd9b783, 0.9);
    apron.lineBetween(-11, -23, 4, -10);
    apron.lineBetween(4, -10, 19, -22);
    apron.fillRoundedRect(-16, -13, 38, 39, 8);
    apron.strokeRoundedRect(-16, -13, 38, 39, 8);
    apron.fillStyle(0xe7a4b2, 0.9);
    apron.fillRoundedRect(-6, 5, 18, 9, 4);
    return [apron];
  }

  const satchel = scene.add.graphics().setName('village-interior-role:satchel');
  satchel.lineStyle(4, 0x7a5b4b, 0.95);
  satchel.lineBetween(-28, -46, 26, 18);
  satchel.fillStyle(0xa9785c, 1);
  satchel.fillRoundedRect(12, 6, 38, 30, 7);
  return [satchel];
}
