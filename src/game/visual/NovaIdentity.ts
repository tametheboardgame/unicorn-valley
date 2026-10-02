import type Phaser from 'phaser';
import {
  createNovaPresentationSprite,
  ensureNovaPresentationTexture,
  NOVA_RACE_TINT,
} from './NovaPresentation';

/**
 * @deprecated H4.6 unified Nova under NovaPresentation.
 * Keep this shim only while older race-era imports are retired.
 */
export const NOVA_IDENTITY_TEXTURE_KEY = 'nova-modern:gallop-a';
export { NOVA_RACE_TINT };

export function ensureNovaIdentityTexture(scene: Phaser.Scene): string {
  return ensureNovaPresentationTexture(scene, 'gallop-a');
}

export function createNovaIdentitySprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Sprite {
  return createNovaPresentationSprite(scene, 'nova-modern-compat', 'gallop-a').setPosition(x, y);
}
