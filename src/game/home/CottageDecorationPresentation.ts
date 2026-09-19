import type Phaser from 'phaser';
import type { ItemId } from '../../content/contentTypes';
import { getCottageDecorationProfile } from './CottageDecorationCatalogue';

type DecorationArt =
  | Phaser.GameObjects.Ellipse
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Star;

/** Item-coloured cottage art; names stay in the editor rather than floating in the room. */
export function renderCottageDecoration(
  scene: Phaser.Scene,
  itemId: ItemId,
  x: number,
  y: number,
  scale = 1,
): DecorationArt[] {
  const colour = getCottageDecorationProfile(itemId)?.previewColour ?? 0xb99ad2;
  const floorItem = itemId.includes('rug') || itemId.includes('cushion');
  const base = floorItem
    ? scene.add.ellipse(x, y, 120 * scale, 58 * scale, colour)
    : scene.add.rectangle(x, y, 64 * scale, 64 * scale, colour);
  const detail = scene.add.star(
    x,
    y,
    itemId.includes('ribbon') ? 12 : 5,
    8 * scale,
    22 * scale,
    0xffefad,
  );
  const objects = [base.setStrokeStyle(4 * scale, 0xffffff, 0.75), detail];
  for (const object of objects) object.setName(`cottage-decoration-art:${itemId}`);
  return objects;
}
