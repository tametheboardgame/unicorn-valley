import Phaser from 'phaser';
import type { ItemDefinition } from '../../content/contentTypes';
import { getItemPresentation } from '../inventory/InventoryService';
import { UI_COLOURS, UI_FONT, createUiShadow } from './uiTheme';

export class ItemCard {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    item: ItemDefinition,
    quantity: number,
  ) {
    const presentation = getItemPresentation(item);
    const shadow = createUiShadow(scene, x, y, width, 136, 0, 0.16);
    const panel = scene.add
      .rectangle(x, y, width, 136, UI_COLOURS.cream, 0.99)
      .setName(`inventory-production-card:${item.id}`)
      .setStrokeStyle(4, UI_COLOURS.ribbonStrong, 0.98);
    const ribbon = scene.add
      .rectangle(x - width / 2 + 9, y, 18, 104, UI_COLOURS.ribbon, 0.95)
      .setStrokeStyle(2, UI_COLOURS.ribbonStrong, 0.82);
    const iconHalo = scene.add.circle(x - width / 2 + 72, y, 49, UI_COLOURS.gold, 0.34);
    const iconCircle = scene.add
      .circle(x - width / 2 + 72, y, 42, UI_COLOURS.lavender, 1)
      .setStrokeStyle(4, UI_COLOURS.white, 0.96);
    const icon = scene.add
      .text(iconCircle.x, iconCircle.y, presentation.icon, {
        fontFamily: UI_FONT,
        fontSize: '38px',
      })
      .setOrigin(0.5);
    const name = scene.add.text(x - width / 2 + 132, y - 48, item.name, {
      color: UI_COLOURS.ink,
      fontFamily: UI_FONT,
      fontSize: '22px',
      fontStyle: 'bold',
    });
    const category = scene.add.text(
      x - width / 2 + 132,
      y - 15,
      presentation.category.replace('-', ' '),
      {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      },
    );
    const description = scene.add.text(x - width / 2 + 132, y + 12, presentation.description, {
      color: UI_COLOURS.softInk,
      fontFamily: UI_FONT,
      fontSize: '15px',
      wordWrap: { width: width - 235 },
    });
    const quantityText = scene.add
      .text(x + width / 2 - 38, y - 45, `×${quantity}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
        backgroundColor: '#f5e5b8',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(1, 0);

    this.objects.push(
      shadow,
      panel,
      ribbon,
      iconHalo,
      iconCircle,
      icon,
      name,
      category,
      description,
      quantityText,
    );
  }

  public destroy(): void {
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
  }
}
