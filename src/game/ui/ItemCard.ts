import Phaser from 'phaser';
import type { ItemDefinition } from '../../content/contentTypes';
import { getItemPresentation } from '../inventory/InventoryService';

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
    const panel = scene.add
      .rectangle(x, y, width, 136, 0xfffbef, 0.98)
      .setStrokeStyle(4, 0xd9b7dc, 0.95);
    const iconCircle = scene.add.circle(x - width / 2 + 72, y, 43, 0xf0dbf0, 1);
    const icon = scene.add
      .text(iconCircle.x, iconCircle.y, presentation.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
      })
      .setOrigin(0.5);
    const name = scene.add.text(x - width / 2 + 132, y - 48, item.name, {
      color: '#5a4265',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
    });
    const category = scene.add.text(
      x - width / 2 + 132,
      y - 15,
      presentation.category.replace('-', ' '),
      {
        color: '#9a6d91',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
      },
    );
    const description = scene.add.text(x - width / 2 + 132, y + 12, presentation.description, {
      color: '#725e78',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      wordWrap: { width: width - 235 },
    });
    const quantityText = scene.add
      .text(x + width / 2 - 38, y - 45, `×${quantity}`, {
        color: '#72537d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        backgroundColor: '#f3e2f1',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(1, 0);

    this.objects.push(panel, iconCircle, icon, name, category, description, quantityText);
  }

  public destroy(): void {
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
  }
}
