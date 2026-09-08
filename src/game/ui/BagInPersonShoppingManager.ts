import Phaser from 'phaser';

const SHOP_BUTTON_NAME = 'bag-shop-button';
const SHOP_LABEL_TEXT = '✨ Visit the Shop';

/**
 * The Bag is an inventory surface, not a shop launcher.
 *
 * Shopping is intentionally world-based: players must visit an actual shop in the valley. The
 * underlying legacy InventoryScene still creates its old shop control, so suppress it every frame
 * until that older scene can be simplified without widening this presentation-only remediation.
 */
export class BagInPersonShoppingManager {
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.sync, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.sync, this);
    });
  }

  private readonly sync = (): void => {
    const scene = this.game.scene.keys.InventoryScene;
    if (!scene?.scene.isActive()) {
      return;
    }

    const shopButton = scene.children.getByName(SHOP_BUTTON_NAME);
    if (shopButton instanceof Phaser.GameObjects.Rectangle) {
      shopButton.setVisible(false).setAlpha(0).disableInteractive();
    }

    for (const object of scene.children.list) {
      if (object instanceof Phaser.GameObjects.Text && object.text === SHOP_LABEL_TEXT) {
        object.setVisible(false).setAlpha(0);
      }
    }
  };
}

let manager: BagInPersonShoppingManager | null = null;

export function getBagInPersonShoppingManager(game: Phaser.Game): BagInPersonShoppingManager {
  manager ??= new BagInPersonShoppingManager(game);
  return manager;
}
