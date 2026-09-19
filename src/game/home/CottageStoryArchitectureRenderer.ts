import Phaser from 'phaser';
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
  const { x, y } = anchor.position;
  const graphics = scene.add
    .graphics()
    .setName('cottage-story:future-portal-bay')
    .setDepth(worldDepthForY(y - 120, -0.4));

  graphics.fillStyle(0x765b82, 0.08);
  graphics.fillEllipse(x, y + 66, 184, 74);
  graphics.lineStyle(7, 0x856477, 0.72);
  graphics.strokeRoundedRect(x - 88, y - 104, 176, 174, 70);
  graphics.lineStyle(3, 0xe6c879, 0.58);
  graphics.strokeRoundedRect(x - 74, y - 91, 148, 148, 58);

  graphics.fillStyle(0xd8c1df, 0.46);
  graphics.fillCircle(x - 71, y + 54, 7);
  graphics.fillCircle(x + 71, y + 54, 7);
  graphics.fillStyle(0xf2d98c, 0.62);
  graphics.fillCircle(x, y - 92, 5);

  graphics.lineStyle(3, 0xc6a6d0, 0.42);
  graphics.strokeEllipse(x, y + 58, 142, 50);
  graphics.lineStyle(2, 0xf1dc9b, 0.45);
  graphics.strokeEllipse(x, y + 58, 104, 34);

  return graphics;
}
