import type Phaser from 'phaser';
import {
  COTTAGE_SEMANTIC_ANCHOR_IDS,
  resolveCottageSemanticAnchor,
} from '../world/CottageSemanticAnchors';
import { worldDepthForY } from '../world/WorldDepth';

/**
 * H2.9 reserves an intentional architectural bay for a future portal without implementing travel.
 * The presentation is deliberately inert: no input, no destination data and no portal gameplay.
 */
export function renderCottageFuturePortalBay(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const anchor = resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay);
  const graphics = scene.add
    .graphics()
    .setPosition(anchor.position.x, anchor.position.y)
    .setName('cottage-story:future-portal-bay')
    .setDepth(worldDepthForY(anchor.position.y - 120, -0.4));

  graphics.fillStyle(0x765b82, 0.08);
  graphics.fillEllipse(0, 66, 184, 74);
  graphics.lineStyle(7, 0x856477, 0.72);
  graphics.strokeRoundedRect(-88, -104, 176, 174, 70);
  graphics.lineStyle(3, 0xe6c879, 0.58);
  graphics.strokeRoundedRect(-74, -91, 148, 148, 58);

  graphics.fillStyle(0xd8c1df, 0.46);
  graphics.fillCircle(-71, 54, 7);
  graphics.fillCircle(71, 54, 7);
  graphics.fillStyle(0xf2d98c, 0.62);
  graphics.fillCircle(0, -92, 5);

  graphics.lineStyle(3, 0xc6a6d0, 0.42);
  graphics.strokeEllipse(0, 58, 142, 50);
  graphics.lineStyle(2, 0xf1dc9b, 0.45);
  graphics.strokeEllipse(0, 58, 104, 34);

  return graphics;
}
