import type Phaser from 'phaser';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import {
  drawUnicornAppearance,
  type UnicornAppearancePalette,
} from '../player/UnicornAppearanceRenderer';
import type { UnicornProductionPose } from '../player/UnicornProductionArt';
import {
  SUPPORTING_RESIDENT_ART_LAYOUT,
  SUPPORTING_RESIDENT_DISPLAY_WIDTH,
} from '../population/SupportingResidentArt';

export const NOVA_RACE_TINT = 0xf09ad1;
export const NOVA_PRESENTATION_TEXTURE_PREFIX = 'nova-modern';

export const NOVA_APPEARANCE: UnicornAppearance = {
  bodyColour: 'pink',
  eyeColour: 'blue',
  maneStyle: 'swept',
  maneColour: 'ice',
  tailStyle: 'plume',
  tailColour: 'lilac',
  hornStyle: 'star',
  marking: 'star',
  accessory: 'ribbon',
};

export const NOVA_PALETTE: UnicornAppearancePalette = {
  body: 0xf08bc8,
  eye: 0x4a78a8,
  mane: 0x69bde3,
  tail: 0x8b75d2,
};

export const NOVA_WORLD_DISPLAY = {
  width: SUPPORTING_RESIDENT_DISPLAY_WIDTH,
  height: SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight,
} as const;

function drawNovaRacingAccents(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
): void {
  // Violet streaks keep the blue/violet racing identity while the shared renderer owns
  // the actual modern unicorn silhouette.
  graphics.fillStyle(0x8b75d2, 0.92);
  graphics.fillEllipse(x + 34 * scale, y - 42 * scale, 8 * scale, 24 * scale);
  graphics.fillEllipse(x + 28 * scale, y - 20 * scale, 7 * scale, 21 * scale);

  // Small gold speed-star accent near the shoulder.
  graphics.fillStyle(0xffdc72, 0.96);
  const starX = x + 8 * scale;
  const starY = y - 6 * scale;
  const radius = 6 * scale;
  const inner = radius * 0.34;
  graphics.fillTriangle(starX, starY - radius, starX - inner, starY, starX + inner, starY);
  graphics.fillTriangle(starX, starY + radius, starX - inner, starY, starX + inner, starY);
  graphics.fillTriangle(starX - radius, starY, starX, starY - inner, starX, starY + inner);
  graphics.fillTriangle(starX + radius, starY, starX, starY - inner, starX, starY + inner);
}

export function getNovaPresentationTextureKey(pose: UnicornProductionPose = 'idle'): string {
  return `${NOVA_PRESENTATION_TEXTURE_PREFIX}:${pose}`;
}

export function ensureNovaPresentationTexture(
  scene: Phaser.Scene,
  pose: UnicornProductionPose = 'idle',
): string {
  const key = getNovaPresentationTextureKey(pose);
  if (scene.textures.exists(key)) {
    return key;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  drawUnicornAppearance(
    graphics,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawX,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawY,
    NOVA_APPEARANCE,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawScale,
    pose,
    NOVA_PALETTE,
  );
  drawNovaRacingAccents(
    graphics,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawX,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawY,
    SUPPORTING_RESIDENT_ART_LAYOUT.drawScale,
  );
  graphics.generateTexture(
    key,
    SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth,
    SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight,
  );
  graphics.destroy();
  return key;
}

export function createNovaPresentationSprite(
  scene: Phaser.Scene,
  name: string,
  pose: UnicornProductionPose = 'idle',
): Phaser.GameObjects.Sprite {
  return scene.add
    .sprite(0, 0, ensureNovaPresentationTexture(scene, pose))
    .setName(name)
    .setOrigin(
      SUPPORTING_RESIDENT_ART_LAYOUT.drawX / SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth,
      SUPPORTING_RESIDENT_ART_LAYOUT.drawY / SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight,
    )
    .setDisplaySize(NOVA_WORLD_DISPLAY.width, NOVA_WORLD_DISPLAY.height);
}
