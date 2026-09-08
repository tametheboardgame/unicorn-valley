import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';

const REVISION = 'wp18j-spacing-v2';

function byName<T extends Phaser.GameObjects.GameObject>(
  scene: Phaser.Scene,
  name: string,
): T | null {
  return (scene.children.list.find((object) => object.name === name) as T | undefined) ?? null;
}

function textByValue(scene: Phaser.Scene, value: string): Phaser.GameObjects.Text | null {
  return (
    (scene.children.list.find(
      (object) => object instanceof Phaser.GameObjects.Text && object.text === value,
    ) as Phaser.GameObjects.Text | undefined) ?? null
  );
}

function markOnce(object: Phaser.GameObjects.GameObject, callback: () => void): void {
  if (object.getData(REVISION) === true) {
    return;
  }
  callback();
  object.setData(REVISION, true);
}

function normaliseExplorationNavigation(scene: Phaser.Scene): void {
  for (const name of [
    'exploration-shell-map-icon',
    'exploration-shell-bag-icon',
    'exploration-shell-book-icon',
    'exploration-shell-settings-nav-icon',
    'exploration-shell-map-label',
    'exploration-shell-bag-label',
    'exploration-shell-book-label',
    'exploration-shell-settings-nav-label',
  ]) {
    const object = byName<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform>(
      scene,
      name,
    );
    object?.setScale(1);
  }
}

function polishInventoryFrame(scene: Phaser.Scene, isMap: boolean): void {
  const shell = byName<Phaser.GameObjects.Graphics>(scene, 'inventory-modal-panel');
  if (shell) {
    markOnce(shell, () => {
      shell.clear();
      shell.fillStyle(0x211827, 0.22);
      shell.fillRoundedRect(50, 42, 1184, 650, 32);
      shell.fillStyle(isMap ? 0x8f7153 : 0x875671, 1);
      shell.fillRoundedRect(40, 30, 1200, 660, 34);
      shell.lineStyle(4, isMap ? 0xd7b878 : 0xc98eb7, 0.92);
      shell.strokeRoundedRect(40, 30, 1200, 660, 34);
      shell.fillStyle(0xfff5df, 1);
      shell.fillRoundedRect(58, 48, 1164, 624, 24);
      shell.fillStyle(isMap ? 0xead5a8 : 0xead4ee, 0.2);
      shell.fillRoundedRect(74, 54, 1132, 54, 16);
      shell.lineStyle(2, isMap ? 0xc8a66c : 0xddbdcf, 0.35);
      shell.lineBetween(76, 116, 1204, 116);
    });
  }

  const title = byName<Phaser.GameObjects.Text>(scene, 'inventory-modal-title');
  title?.setPosition(640, 76).setFontSize(34);

  const badge = byName<Phaser.GameObjects.Text>(scene, 'inventory-view-badge');
  badge?.setPosition(122, 76).setFontSize(16).setPadding(12, 8);

  const closeButton = byName<Phaser.GameObjects.Rectangle>(scene, 'bag-close-button');
  if (closeButton) {
    closeButton.setPosition(1170, 76).setDisplaySize(82, 70).setAlpha(0.001);
  }

  const legacyCloseLabel = textByValue(scene, '✕ Close');
  legacyCloseLabel?.setVisible(false);

  if (!byName(scene, 'wp18j-inventory-close-visual')) {
    const colour = isMap ? 0xead5a8 : 0xefd6ec;
    const stroke = isMap ? 0xb58d56 : 0xb985bc;
    const ink = isMap ? '#5d4936' : '#5d4369';
    const visual = scene.add
      .graphics()
      .setName('wp18j-inventory-close-visual')
      .setDepth(10);
    visual.fillStyle(0x3b2b3f, 0.14);
    visual.fillRoundedRect(1143, 52, 58, 58, 22);
    visual.fillStyle(colour, 1);
    visual.fillRoundedRect(1140, 49, 58, 58, 22);
    visual.lineStyle(3, stroke, 0.95);
    visual.strokeRoundedRect(1140, 49, 58, 58, 22);
    scene.add
      .text(1169, 77, '×', {
        color: ink,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setName('wp18j-inventory-close-icon')
      .setOrigin(0.5)
      .setDepth(11);
  }
}

function polishBag(scene: Phaser.Scene): void {
  const satchel = byName<Phaser.GameObjects.Graphics>(scene, 'bag-themed-satchel');
  if (satchel) {
    markOnce(satchel, () => {
      satchel.clear();
      satchel.fillStyle(0x4b3045, 0.11);
      satchel.fillRoundedRect(123, 123, 1033, 472, 26);
      satchel.fillStyle(0xb77b8f, 0.19);
      satchel.fillRoundedRect(116, 116, 1037, 472, 26);
      satchel.lineStyle(2, 0x925971, 0.58);
      satchel.strokeRoundedRect(116, 116, 1037, 472, 26);
      satchel.fillStyle(0xe4bbc6, 0.2);
      satchel.fillRoundedRect(132, 124, 1005, 50, 15);
    });
  }

  const listPanel = byName<Phaser.GameObjects.Graphics>(scene, 'bag-list-panel');
  if (listPanel) {
    markOnce(listPanel, () => {
      listPanel.clear();
      listPanel.fillStyle(0x573d4f, 0.08);
      listPanel.fillRoundedRect(146, 200, 710, 385, 20);
      listPanel.fillStyle(0xfff7e7, 1);
      listPanel.fillRoundedRect(140, 194, 710, 385, 20);
      listPanel.lineStyle(2, 0xc28da0, 0.62);
      listPanel.strokeRoundedRect(140, 194, 710, 385, 20);
    });
  }

  const detailPanel = byName<Phaser.GameObjects.Graphics>(scene, 'bag-detail-panel');
  if (detailPanel) {
    markOnce(detailPanel, () => {
      detailPanel.clear();
      detailPanel.fillStyle(0x573d4f, 0.09);
      detailPanel.fillRoundedRect(875, 200, 272, 385, 20);
      detailPanel.fillStyle(0xf7e8e3, 1);
      detailPanel.fillRoundedRect(869, 194, 272, 385, 20);
      detailPanel.lineStyle(2, 0xb87a94, 0.7);
      detailPanel.strokeRoundedRect(869, 194, 272, 385, 20);
      detailPanel.fillStyle(0xe2b6c3, 0.2);
      detailPanel.fillRoundedRect(887, 208, 236, 40, 12);
    });
  }

  for (const object of scene.children.list) {
    if (object.name.startsWith('bag-pocket:') && object instanceof Phaser.GameObjects.Rectangle) {
      object.setScale(0.92, 0.88);
    }
    if (
      object.name.startsWith('bag-pocket-shadow:') &&
      object instanceof Phaser.GameObjects.Rectangle
    ) {
      object.setScale(0.93, 0.88);
    }
  }

  const shimmer = byName<Phaser.GameObjects.Text>(scene, 'bag-shimmer-balance');
  shimmer?.setFontSize(15).setPadding(12, 6);

  const shopButton = byName<Phaser.GameObjects.Rectangle>(scene, 'bag-shop-button');
  shopButton?.setPosition(1005, 630).setScale(0.88, 0.86);
  const shopLabel = textByValue(scene, '✨ Visit the Shop');
  shopLabel?.setPosition(1005, 630).setFontSize(17);
}

function polishMap(scene: Phaser.Scene): void {
  const parchment = byName<Phaser.GameObjects.Graphics>(scene, 'bag-map-parchment');
  if (parchment) {
    markOnce(parchment, () => {
      parchment.clear();
      parchment.fillStyle(0x3f3028, 0.12);
      parchment.fillRoundedRect(118, 142, 1056, 450, 22);
      parchment.fillStyle(0xe7c98d, 1);
      parchment.fillRoundedRect(110, 134, 1060, 450, 22);
      parchment.lineStyle(3, 0xa47a4c, 0.72);
      parchment.strokeRoundedRect(110, 134, 1060, 450, 22);
      parchment.fillStyle(0xf8e9bd, 1);
      parchment.fillRoundedRect(124, 148, 1032, 422, 17);
      parchment.fillStyle(0xc9dba3, 0.23);
      parchment.fillEllipse(315, 330, 310, 210);
      parchment.fillStyle(0xb9d3c8, 0.24);
      parchment.fillEllipse(760, 430, 420, 240);
      parchment.fillStyle(0xe8c1a1, 0.22);
      parchment.fillEllipse(955, 265, 280, 170);
      parchment.lineStyle(2, 0x9ab2a5, 0.35);
      parchment.lineBetween(150, 520, 330, 470);
      parchment.lineBetween(330, 470, 520, 510);
      parchment.lineBetween(520, 510, 760, 420);
      parchment.lineBetween(760, 420, 1120, 386);
    });
  }

  const subtitle = textByValue(scene, '✦ Paths, places and little mysteries ✦');
  subtitle?.setPosition(640, 121).setFontSize(14);
}

function polishInventoryScene(scene: Phaser.Scene): void {
  const isMap = byName(scene, 'bag-map-parchment') !== null;
  polishInventoryFrame(scene, isMap);
  if (isMap) {
    polishMap(scene);
  } else {
    polishBag(scene);
  }
}

export class Wp18jResponsiveUiPolishManager {
  private readonly throttle = new RefreshThrottle(80);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.sync, this);
  }

  private readonly sync = (): void => {
    if (!this.throttle.shouldRun(this.game.loop.time)) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      normaliseExplorationNavigation(scene);
      if (scene.scene.key === 'InventoryScene') {
        polishInventoryScene(scene);
      }
    }
  };
}

let manager: Wp18jResponsiveUiPolishManager | null = null;

export function getWp18jResponsiveUiPolishManager(
  game: Phaser.Game,
): Wp18jResponsiveUiPolishManager {
  manager ??= new Wp18jResponsiveUiPolishManager(game);
  return manager;
}
