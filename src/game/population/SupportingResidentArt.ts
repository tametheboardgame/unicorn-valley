import type Phaser from 'phaser';
import type { UnicornProductionPose } from '../player/UnicornProductionArt';
import { drawUnicornAppearance } from '../player/UnicornAppearanceRenderer';
import type { SupportingResidentDefinition } from './AmbientPopulationTypes';

const TEXTURE_WIDTH = 220;
const TEXTURE_HEIGHT = 190;
const DRAW_X = 55;
const DRAW_Y = 106;
const DRAW_SCALE = 0.72;

export function getSupportingResidentTextureKey(
  resident: SupportingResidentDefinition,
  pose: UnicornProductionPose,
): string {
  return `supporting-resident:${resident.id}:${pose}`;
}

export function ensureSupportingResidentTexture(
  scene: Phaser.Scene,
  resident: SupportingResidentDefinition,
  pose: UnicornProductionPose,
): string {
  const key = getSupportingResidentTextureKey(resident, pose);
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  drawUnicornAppearance(graphics, DRAW_X, DRAW_Y, resident.appearance, DRAW_SCALE, pose);
  graphics.generateTexture(key, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  graphics.destroy();
  return key;
}

export function createSupportingResidentSprite(
  scene: Phaser.Scene,
  resident: SupportingResidentDefinition,
): Phaser.GameObjects.Sprite {
  return scene.add
    .sprite(0, 0, ensureSupportingResidentTexture(scene, resident, 'idle'))
    .setName(`supporting-resident-sprite:${resident.id}`)
    .setOrigin(0.5, 0.78)
    .setDisplaySize(126, 109);
}
