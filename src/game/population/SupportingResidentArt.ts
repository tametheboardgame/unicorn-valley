import type Phaser from 'phaser';
import type { UnicornProductionPose } from '../player/UnicornProductionArt';
import { drawUnicornAppearance } from '../player/UnicornAppearanceRenderer';
import type { SupportingResidentDefinition } from './AmbientPopulationTypes';

// Shared by every ambient/moving supporting resident. Keep this canvas wide enough for the
// widest production tail in every walk pose. Juniper exposed the clipping defect, but the
// safe bounds intentionally protect all supporting residents rather than special-casing her.
export const SUPPORTING_RESIDENT_ART_LAYOUT = {
  textureWidth: 288,
  textureHeight: 190,
  drawX: 96,
  drawY: 106,
  drawScale: 0.72,
  displayHeight: 109,
} as const;

const DISPLAY_WIDTH = Math.round(
  (SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth / SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight) *
    SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight,
);

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
  drawUnicornAppearance(
    graphics,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawX,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawY,
    resident.appearance,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawScale,
    pose,
  );
  graphics.generateTexture(
    key,
    SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth,
    SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight,
  );
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
    .setDisplaySize(DISPLAY_WIDTH, SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight);
}
