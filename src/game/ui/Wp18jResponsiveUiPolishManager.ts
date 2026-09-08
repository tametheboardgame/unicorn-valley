import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';

const REVISION = 'wp18j-spacing-v3';
const BAG_ROW_REVISION = 'wp18j-bag-row-v3';

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
    // This manager exists to repair the pressed scale if a modal pauses the scene before pointerup.
    // Do not continuously re-apply scale 1 to already-correct text/icons because that needlessly
    // invalidates their transforms while the camera is moving and can present as a tiny HUD wobble.
    if (object && (object.scaleX !== 1 || object.scaleY !== 1)) {
      object.setScale(1);
    }
  }
}

function ensureCloseIcon(scene: Phaser.Scene, isMap: boolean): void {
  const closeButton = byName<Phaser.GameObjects.Rectangle>(scene, 'bag-close-button');
  if (closeButton) {
    closeButton.setPosition(1172, 76).setDisplaySize(82, 70).setAlpha(0.001);
  }

  const legacyCloseLabel = textByValue(scene, '✕ Close');
  legacyCloseLabel?.setVisible(false);

  byName(scene, 'wp18j-inventory-close-visual')?.destroy();

  const ink = isMap ? '#5d4936' : '#5d4369';
  const existingIcon = byName<Phaser.GameObjects.Text>(scene, 'wp18j-inventory-close-icon');
  if (existingIcon) {
    existingIcon.setPosition(1172, 76).setColor(ink).setFontSize(38).setVisible(true);
    return;
  }

  scene.add
    .text(1172, 76, '×', {
      color: ink,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
    })
    .setName('wp18j-inventory-close-icon')
    .setOrigin(0.5)
    .setDepth(11);
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

  ensureCloseIcon(scene, isMap);
}

function moveBagHeaderRowDown(scene: Phaser.Scene): void {
  for (const object of scene.children.list) {
    if (object.getData(BAG_ROW_REVISION) === true) {
      continue;
    }
    if (!('x' in object) || !('y' in object)) {
      continue;
    }

    const transform = object as Phaser.GameObjects.GameObject &
      Phaser.GameObjects.Components.Transform;
    const isPocketRow =
      transform.x >= 150 && transform.x <= 870 && transform.y >= 143 && transform.y <= 150;
    if (!isPocketRow) {
      continue;
    }

    transform.setY(transform.y + 10);
    object.setData(BAG_ROW_REVISION, true);
  }

  const shimmer = byName<Phaser.GameObjects.Text>(scene, 'bag-shimmer-balance');
  if (shimmer && shimmer.getData(BAG_ROW_REVISION) !== true) {
    shimmer.setY(shimmer.y + 10);
    shimmer.setData(BAG_ROW_REVISION, true);
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
      satchel.fillRoundedRect(132, 124, 1005, 54, 15);
    });
  }

  const listPanel = byName<Phaser.GameObjects.Graphics>(scene, 'bag-list-panel');
  if (listPanel) {
    markOnce(listPanel, () => {
      listPanel.clear();
      listPanel.fillStyle(0x573d4f, 0.08);
      listPanel.fillRoundedRect(146, 204, 710, 381, 20);
      listPanel.fillStyle(0xfff7e7, 1);
      listPanel.fillRoundedRect(140, 198, 710, 381, 20);
      listPanel.lineStyle(2, 0xc28da0, 0.62);
      listPanel.strokeRoundedRect(140, 198, 710, 381, 20);
    });
  }

  const detailPanel = byName<Phaser.GameObjects.Graphics>(scene, 'bag-detail-panel');
  if (detailPanel) {
    markOnce(detailPanel, () => {
      detailPanel.clear();
      detailPanel.fillStyle(0x573d4f, 0.09);
      detailPanel.fillRoundedRect(875, 204, 272, 381, 20);
      detailPanel.fillStyle(0xf7e8e3, 1);
      detailPanel.fillRoundedRect(869, 198, 272, 381, 20);
      detailPanel.lineStyle(2, 0xb87a94, 0.7);
      detailPanel.strokeRoundedRect(869, 198, 272, 381, 20);
      detailPanel.fillStyle(0xe2b6c3, 0.2);
      detailPanel.fillRoundedRect(887, 212, 236, 40, 12);
    });
  }

  moveBagHeaderRowDown(scene);

  for (const object of scene.children.list) {
    if (object.name.startsWith('bag-pocket:') && object instanceof Phaser.GameObjects.Rectangle) {
      object.setScale(0.92, 0.84);
    }
    if (
      object.name.startsWith('bag-pocket-shadow:') &&
      object instanceof Phaser.GameObjects.Rectangle
    ) {
      object.setScale(0.93, 0.84);
    }
  }

  const shimmer = byName<Phaser.GameObjects.Text>(scene, 'bag-shimmer-balance');
  shimmer?.setFontSize(15).setPadding(12, 6);

  const shopButton = byName<Phaser.GameObjects.Rectangle>(scene, 'bag-shop-button');
  shopButton?.setPosition(1005, 632).setScale(0.86, 0.82);
  const shopLabel = textByValue(scene, '✨ Visit the Shop');
  shopLabel?.setPosition(1005, 632).setFontSize(17);
}

function installMapPanning(scene: Phaser.Scene): void {
  if (byName(scene, 'wp18j-map-pan-zone')) {
    return;
  }

  const parchment = byName<Phaser.GameObjects.Graphics>(scene, 'bag-map-parchment');
  const mapContent = byName<Phaser.GameObjects.Container>(scene, 'bag-map-content');
  if (!parchment || !mapContent) {
    return;
  }

  const parchmentIndex = scene.children.list.indexOf(parchment);
  const contentIndex = scene.children.list.indexOf(mapContent);
  if (parchmentIndex < 0 || contentIndex <= parchmentIndex) {
    return;
  }

  const movingObjects = scene.children.list
    .slice(parchmentIndex + 1, contentIndex)
    .filter((object) => {
      if (object.name === 'bag-map-guidance') {
        return false;
      }
      if (!(object instanceof Phaser.GameObjects.Text)) {
        return true;
      }
      return (
        object.text !== '✦ Paths, places and little mysteries ✦' &&
        !object.text.startsWith('Solid trails are open')
      );
    });

  mapContent.add(movingObjects).setDepth(2);

  const maskShape = scene.add.graphics().setName('wp18j-map-pan-mask').setVisible(false);
  maskShape.fillStyle(0xffffff, 1);
  maskShape.fillRoundedRect(124, 148, 1032, 422, 17);
  const mask = maskShape.createGeometryMask();
  mapContent.setMask(mask);

  const zone = scene.add
    .zone(640, 359, 1032, 422)
    .setName('wp18j-map-pan-zone')
    .setInteractive({ useHandCursor: true })
    .setDepth(8);
  scene.input.setDraggable(zone);

  zone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
    zone.setData('content-start-x', mapContent.x);
    zone.setData('content-start-y', mapContent.y);
    zone.setData('pointer-start-x', pointer.x);
    zone.setData('pointer-start-y', pointer.y);
  });
  zone.on('drag', (pointer: Phaser.Input.Pointer) => {
    const contentStartX = Number(zone.getData('content-start-x') ?? 0);
    const contentStartY = Number(zone.getData('content-start-y') ?? 0);
    const pointerStartX = Number(zone.getData('pointer-start-x') ?? pointer.x);
    const pointerStartY = Number(zone.getData('pointer-start-y') ?? pointer.y);
    mapContent.setPosition(
      Phaser.Math.Clamp(contentStartX + pointer.x - pointerStartX, -150, 90),
      Phaser.Math.Clamp(contentStartY + pointer.y - pointerStartY, -90, 70),
    );
  });

  scene.add
    .text(1046, 164, '↔ Drag map to explore', {
      color: '#725039',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      backgroundColor: '#fff0ccd9',
      padding: { x: 8, y: 4 },
    })
    .setName('wp18j-map-pan-hint')
    .setOrigin(0.5)
    .setDepth(9);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    mask.destroy();
  });
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
  installMapPanning(scene);
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
