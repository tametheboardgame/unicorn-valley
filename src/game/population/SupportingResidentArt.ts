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

export function resolveSupportingResidentDisplaySize(presentationScale = 1): {
  width: number;
  height: number;
} {
  return {
    width: SUPPORTING_RESIDENT_DISPLAY_WIDTH * presentationScale,
    height: SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight * presentationScale,
  };
}

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

export type SupportingResidentRoleVisual = 'baker';

function drawBakerRoleVisual(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
  // Apron is painted directly over the torso in the resident texture so it scales and moves
  // with the unicorn instead of floating as a scene-space prop.
  graphics.lineStyle(3 * scale, 0xd5ad88, 0.9);
  graphics.lineBetween(x + 8 * scale, y - 4 * scale, x + 22 * scale, y + 7 * scale);
  graphics.lineBetween(x + 22 * scale, y + 7 * scale, x + 36 * scale, y - 4 * scale);
  graphics.fillStyle(0xfff8e8, 0.98);
  graphics.fillRoundedRect(x + 4 * scale, y + 2 * scale, 46 * scale, 48 * scale, 10 * scale);
  graphics.strokeRoundedRect(x + 4 * scale, y + 2 * scale, 46 * scale, 48 * scale, 10 * scale);
  graphics.fillStyle(0xe8a8b8, 0.95);
  graphics.fillRoundedRect(x + 17 * scale, y + 25 * scale, 22 * scale, 10 * scale, 4 * scale);

  // Small tilted chef hat follows the canonical head geometry and deliberately sits to the
  // rear of the horn rather than covering it.
  graphics.fillStyle(0xfffcf2, 1);
  graphics.lineStyle(2.5 * scale, 0xd8c9b7, 0.92);
  graphics.fillRoundedRect(x + 37 * scale, y - 70 * scale, 39 * scale, 13 * scale, 6 * scale);
  graphics.strokeRoundedRect(x + 37 * scale, y - 70 * scale, 39 * scale, 13 * scale, 6 * scale);
  for (const [dx, dy, radius] of [
    [43, -72, 10],
    [55, -79, 12],
    [68, -73, 10],
  ] as const) {
    graphics.fillCircle(x + dx * scale, y + dy * scale, radius * scale);
  }
}

function getSupportingResidentRoleTextureKey(
  resident: SupportingResidentDefinition,
  pose: UnicornProductionPose,
  role: SupportingResidentRoleVisual,
): string {
  return `supporting-resident:${resident.id}:${pose}:role:${role}`;
}

export function ensureSupportingResidentRoleTexture(
  scene: Phaser.Scene,
  resident: SupportingResidentDefinition,
  pose: UnicornProductionPose,
  role: SupportingResidentRoleVisual,
): string {
  const key = getSupportingResidentRoleTextureKey(resident, pose, role);
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
  if (role === 'baker') {
    drawBakerRoleVisual(
      graphics,
      SUPPORTING_RESIDENT_ART_LAYOUT.drawX,
      SUPPORTING_RESIDENT_ART_LAYOUT.drawY,
      SUPPORTING_RESIDENT_ART_LAYOUT.drawScale,
    );
  }
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

export function createSupportingResidentRoleSprite(
  scene: Phaser.Scene,
  resident: SupportingResidentDefinition,
  role: SupportingResidentRoleVisual,
): Phaser.GameObjects.Sprite {
  return createResidentAppearanceSprite(
    scene,
    ensureSupportingResidentRoleTexture(scene, resident, 'idle', role),
    `supporting-resident-sprite:${resident.id}`,
    resident.appearance,
  );
}
