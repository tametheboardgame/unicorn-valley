import type Phaser from 'phaser';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import type { UnicornProductionPose } from '../player/UnicornProductionArt';
import {
  drawUnicornAppearance,
  type UnicornAppearancePalette,
} from '../player/UnicornAppearanceRenderer';
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

export const SUPPORTING_RESIDENT_DISPLAY_WIDTH = Math.round(
  (SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth / SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight) *
    SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight,
);

export function getSupportingResidentTextureKey(
  resident: SupportingResidentDefinition,
  pose: UnicornProductionPose,
): string {
  return `supporting-resident:${resident.id}:${pose}`;
}

export function ensureResidentAppearanceTexture(
  scene: Phaser.Scene,
  key: string,
  appearance: UnicornAppearance,
  pose: UnicornProductionPose,
  palette?: UnicornAppearancePalette,
): string {
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  drawUnicornAppearance(
    graphics,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawX,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawY,
    appearance,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawScale,
    pose,
    palette,
  );
  graphics.generateTexture(
    key,
    SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth,
    SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight,
  );
  graphics.destroy();
  return key;
}

export function ensureSupportingResidentTexture(
  scene: Phaser.Scene,
  resident: SupportingResidentDefinition,
  pose: UnicornProductionPose,
): string {
  return ensureResidentAppearanceTexture(
    scene,
    getSupportingResidentTextureKey(resident, pose),
    resident.appearance,
    pose,
  );
}

export function createResidentAppearanceSprite(
  scene: Phaser.Scene,
  key: string,
  name: string,
  appearance: UnicornAppearance,
  palette?: UnicornAppearancePalette,
): Phaser.GameObjects.Sprite {
  return scene.add
    .sprite(
      0,
      0,
      scene.textures.exists(key)
        ? key
        : ensureResidentAppearanceTexture(scene, key, appearance, 'idle', palette),
    )
    .setName(name)
    .setOrigin(0.5, 0.78)
    .setDisplaySize(
      SUPPORTING_RESIDENT_DISPLAY_WIDTH,
      SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight,
    );
}

export function createSupportingResidentSprite(
  scene: Phaser.Scene,
  resident: SupportingResidentDefinition,
): Phaser.GameObjects.Sprite {
  return createResidentAppearanceSprite(
    scene,
    ensureSupportingResidentTexture(scene, resident, 'idle'),
    `supporting-resident-sprite:${resident.id}`,
    resident.appearance,
  );
}
