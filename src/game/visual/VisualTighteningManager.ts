import Phaser from 'phaser';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { worldDepthForY } from '../world/WorldDepth';
import {
  createNovaIdentitySprite,
  ensureNovaIdentityTexture,
  NOVA_RACE_TINT,
} from './NovaIdentity';

export const VISUAL_TIGHTENING_DETAIL_NAME = 'visual-tightening-detail';
const VISUAL_TIGHTENING_ANCHOR_NAME = 'visual-tightening-anchor';

const SUPPORTED_SCENES = new Set([
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CottageInteriorScene',
  'NovaTutorialRaceScene',
  'RaceScene',
]);

function markDetail<T extends Phaser.GameObjects.GameObject>(object: T): T {
  object.setName(VISUAL_TIGHTENING_DETAIL_NAME);
  return object;
}

function addWindow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  frameColour: number,
  boxColour: number,
): void {
  markDetail(
    scene.add
      .rectangle(x, y, 84, 72, 0xbcebf1, 0.88)
      .setStrokeStyle(7, frameColour, 0.95)
      .setDepth(8),
  );
  markDetail(scene.add.rectangle(x, y, 5, 62, 0xffffff, 0.6).setDepth(8.2));
  markDetail(scene.add.rectangle(x, y, 72, 5, 0xffffff, 0.6).setDepth(8.2));
  markDetail(scene.add.rectangle(x, y + 46, 98, 18, boxColour, 0.95).setDepth(8.3));
  for (const offset of [-24, 0, 24]) {
    markDetail(scene.add.circle(x + offset, y + 39, 8, 0xffb7d2, 0.96).setDepth(8.4));
  }
}

function addForegroundMoonflower(scene: Phaser.Scene, x: number, y: number, scale: number): void {
  markDetail(
    scene.add.rectangle(x, y + 24 * scale, 7 * scale, 54 * scale, 0x5f9b67, 0.95).setDepth(13),
  );
  for (const [offsetX, offsetY] of [
    [0, -18],
    [18, -5],
    [12, 14],
    [-12, 14],
    [-18, -5],
  ] as const) {
    markDetail(
      scene.add
        .ellipse(x + offsetX * scale, y + offsetY * scale, 28 * scale, 38 * scale, 0xe0b3ff, 0.94)
        .setDepth(13.2),
    );
  }
  markDetail(scene.add.circle(x, y, 12 * scale, 0xffdca1, 1).setDepth(13.4));
}

function decorateGlade(scene: Phaser.Scene): void {
  markDetail(scene.add.rectangle(688, 302, 54, 105, 0x8b6658, 1).setDepth(9));
  markDetail(scene.add.rectangle(688, 250, 68, 18, 0x735249, 1).setDepth(10));

  for (const x of [405, 640]) {
    markDetail(scene.add.rectangle(x, 440, 5, 60, 0xffffff, 0.56).setDepth(11));
    markDetail(scene.add.rectangle(x, 440, 66, 5, 0xffffff, 0.56).setDepth(11));
    markDetail(scene.add.rectangle(x, 486, 94, 18, 0x8f654f, 0.92).setDepth(11));
    for (const offset of [-24, 0, 24]) {
      markDetail(scene.add.circle(x + offset, 478, 8, 0xffb5d3, 0.95).setDepth(11.2));
    }
  }

  for (const x of [432, 506, 580, 654]) {
    markDetail(scene.add.ellipse(x, 326, 58, 14, 0xd6b5e8, 0.36).setDepth(11));
  }

  for (const [x, y] of [
    [1288, 590],
    [1512, 690],
    [1296, 1220],
    [1502, 1330],
  ] as const) {
    for (const offset of [-12, 0, 12]) {
      markDetail(
        scene.add
          .rectangle(x + offset, y - 16 - Math.abs(offset) * 0.35, 5, 42, 0x5d9b68, 0.9)
          .setAngle(offset * 0.45)
          .setDepth(5),
      );
    }
    markDetail(scene.add.ellipse(x, y + 7, 68, 20, 0xbda986, 0.48).setDepth(4.5));
  }

  markDetail(scene.add.ellipse(850, 1099, 76, 28, 0x9f7757, 0.5).setDepth(11));
  markDetail(scene.add.ellipse(850, 1099, 43, 16, 0xe0bb86, 0.46).setDepth(11.1));

  // The two cottage flowers were originally painted below the cottage body. Repaint them in front.
  addForegroundMoonflower(scene, 350, 650, 1.15);
  addForegroundMoonflower(scene, 760, 650, 1.05);
}

function decorateVillage(scene: Phaser.Scene): void {
  const buildings = [
    { x: 900, y: 470, width: 450, frame: 0x99614f, box: 0xb97355 },
    { x: 1500, y: 430, width: 430, frame: 0x8e6489, box: 0xb77cae },
    { x: 2110, y: 480, width: 490, frame: 0x527a93, box: 0x668da7 },
  ] as const;

  for (const building of buildings) {
    const windowOffset = building.width * 0.29;
    addWindow(scene, building.x - windowOffset, building.y + 34, building.frame, building.box);
    addWindow(scene, building.x + windowOffset, building.y + 34, building.frame, building.box);
    markDetail(
      scene.add
        .rectangle(building.x, building.y - 126, building.width - 58, 9, 0xffffff, 0.28)
        .setDepth(8.1),
    );
    markDetail(
      scene.add
        .rectangle(building.x, building.y + 151, building.width - 34, 16, building.frame, 0.32)
        .setDepth(8.1),
    );
  }

  for (const radius of [54, 70]) {
    markDetail(
      scene.add
        .ellipse(1500, 1050, radius * 2, radius * 0.55, 0xe9ffff, 0.28)
        .setStrokeStyle(3, 0xffffff, 0.3)
        .setDepth(9.2),
    );
  }
  for (const [x, y, size] of [
    [1474, 1017, 8],
    [1528, 1024, 7],
    [1503, 1002, 6],
  ] as const) {
    markDetail(scene.add.circle(x, y, size, 0xe9ffff, 0.55).setDepth(9.3));
  }
}

function replaceMeadowNova(scene: Phaser.Scene): void {
  const marker = RAINBOW_MEADOW_MAP.npcMarkers.find((item) => item.id === 'nova');
  if (!marker) {
    return;
  }

  const oldNova = scene.children.list.find(
    (object): object is Phaser.GameObjects.Container =>
      object instanceof Phaser.GameObjects.Container &&
      Math.abs(object.x - marker.position.x) < 2 &&
      Math.abs(object.y - marker.position.y) < 12 &&
      object.list.length >= 7,
  );
  oldNova?.setVisible(false);

  const nova = createNovaIdentitySprite(scene, marker.position.x, marker.position.y)
    .setDisplaySize(120, 96)
    .setDepth(worldDepthForY(marker.position.y + 48, 0.24));
  markDetail(nova);
  nova.setName('nova-canonical-world');
  scene.tweens.add({
    targets: nova,
    y: marker.position.y - 5,
    duration: 1050,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });
}

function decorateMeadow(scene: Phaser.Scene): void {
  for (const [width, height, alpha] of [
    [330, 88, 0.24],
    [225, 62, 0.2],
  ] as const) {
    markDetail(
      scene.add
        .ellipse(1570, 610, width, height, 0xe6ffff, alpha)
        .setStrokeStyle(4, 0xffffff, alpha + 0.08)
        .setDepth(5.1),
    );
  }
  for (const [x, y] of [
    [1325, 645],
    [1805, 590],
  ] as const) {
    for (const offset of [-14, 0, 14]) {
      markDetail(
        scene.add
          .rectangle(x + offset, y - 18, 5, 46 + Math.abs(offset), 0x568f59, 0.9)
          .setAngle(offset * 0.38)
          .setDepth(worldDepthForY(y, -0.2)),
      );
    }
  }

  for (let x = 2415, index = 0; x <= 2785; x += 46, index += 1) {
    markDetail(
      scene.add
        .circle(x, 505, 17, index % 2 === 0 ? 0xf2a0b7 : 0xc79bdd, 0.98)
        .setDepth(worldDepthForY(650, 0.15)),
    );
  }
  markDetail(
    scene.add.rectangle(2600, 530, 360, 9, 0xffffff, 0.32).setDepth(worldDepthForY(650, 0.2)),
  );

  const ribbonXs = [2410, 2460, 2510, 2560, 2610];
  const ribbonColours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
  for (let index = 0; index < ribbonXs.length; index += 1) {
    const x = ribbonXs[index];
    const colour = ribbonColours[index];
    markDetail(scene.add.circle(x, 1372, 12, colour, 0.96).setDepth(worldDepthForY(1430, 0.25)));
    markDetail(
      scene.add
        .triangle(x, 1408, 0, 0, 22, 0, 11, 38, colour, 0.92)
        .setDepth(worldDepthForY(1430, 0.26)),
    );
  }

  replaceMeadowNova(scene);
}

function decorateCottage(scene: Phaser.Scene): void {
  for (const y of [260, 300, 380]) {
    markDetail(scene.add.rectangle(285, y, 225, 4, 0xe3b29d, 0.34).setDepth(7.1));
  }
  for (const x of [220, 285, 350]) {
    markDetail(scene.add.rectangle(x, 285, 4, 48, 0xe3b29d, 0.25).setDepth(7.1));
  }
  for (const x of [235, 335]) {
    markDetail(scene.add.rectangle(x, 183, 7, 32, 0xf7e5bb, 0.96).setDepth(8.1));
    markDetail(scene.add.circle(x, 163, 8, 0xffcf72, 0.72).setDepth(8.2));
  }

  markDetail(scene.add.rectangle(335, 590, 95, 48, 0xfffaf0, 0.96).setDepth(8.2));
  markDetail(scene.add.rectangle(445, 590, 95, 48, 0xfffaf0, 0.96).setDepth(8.2));
  markDetail(scene.add.rectangle(390, 645, 250, 7, 0xf1d7e7, 0.42).setDepth(8.2));

  markDetail(scene.add.rectangle(1245, 706, 6, 118, 0xe4f1ea, 0.25).setDepth(8.2));
  markDetail(scene.add.rectangle(1110, 735, 28, 122, 0x648e7e, 0.88).setDepth(7.5));
  markDetail(scene.add.rectangle(1380, 735, 28, 122, 0x648e7e, 0.88).setDepth(7.5));

  markDetail(
    scene.add.circle(845, 493, 18, 0xfff6e5, 0.96).setStrokeStyle(3, 0xb88267, 0.8).setDepth(8.2),
  );
  markDetail(
    scene.add.circle(955, 493, 18, 0xfff6e5, 0.96).setStrokeStyle(3, 0xb88267, 0.8).setDepth(8.2),
  );
  markDetail(scene.add.ellipse(900, 500, 150, 102, 0xfff4dd, 0.12).setDepth(7.2));

  for (const x of [1460, 1515, 1570]) {
    markDetail(scene.add.circle(x, 330, 7, 0xf4d79f, 0.92).setDepth(8.2));
  }
}

function applyCanonicalNovaToRace(scene: Phaser.Scene): void {
  ensureNovaIdentityTexture(scene);
  const nova = scene.children.list.find(
    (object) =>
      object instanceof Phaser.GameObjects.Sprite && object.tintTopLeft === NOVA_RACE_TINT,
  );
  if (!(nova instanceof Phaser.GameObjects.Sprite)) {
    return;
  }

  const displayWidth = nova.displayWidth;
  const displayHeight = nova.displayHeight;
  nova
    .setTexture(ensureNovaIdentityTexture(scene))
    .setDisplaySize(displayWidth, displayHeight)
    .clearTint()
    .setAlpha(1)
    .setName('nova-canonical-racer');
}

function decorateRace(scene: Phaser.Scene): void {
  const groundY = scene.scene.key === 'NovaTutorialRaceScene' ? 570 : 575;
  const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];

  for (let x = 520, index = 0; x <= 3900; x += 520, index += 1) {
    markDetail(scene.add.rectangle(x, groundY + 87, 6, 42, 0x5c8f58, 0.8).setDepth(7));
    markDetail(
      scene.add.circle(x, groundY + 62, 10, colours[index % colours.length], 0.86).setDepth(7.2),
    );
    markDetail(
      scene.add
        .circle(x + 13, groundY + 66, 7, colours[(index + 1) % colours.length], 0.78)
        .setDepth(7.2),
    );
  }

  for (let x = 700, index = 0; x <= 3500; x += 700, index += 1) {
    markDetail(scene.add.rectangle(x, groundY - 155, 6, 88, 0x755548, 0.9).setDepth(7));
    markDetail(
      scene.add
        .triangle(x + 3, groundY - 201, 0, 0, 58, 16, 0, 32, colours[index % colours.length], 0.88)
        .setDepth(7.2),
    );
  }

  applyCanonicalNovaToRace(scene);
}

function applyVisualTightening(scene: Phaser.Scene): void {
  switch (scene.scene.key) {
    case 'MoonflowerGladeScene':
      decorateGlade(scene);
      break;
    case 'SunbeamVillageScene':
      decorateVillage(scene);
      break;
    case 'RainbowMeadowScene':
      decorateMeadow(scene);
      break;
    case 'CottageInteriorScene':
      decorateCottage(scene);
      break;
    case 'NovaTutorialRaceScene':
    case 'RaceScene':
      decorateRace(scene);
      break;
  }
}

export class VisualTighteningManager {
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!SUPPORTED_SCENES.has(scene.scene.key)) {
        continue;
      }

      const alreadyApplied = scene.children.list.some(
        (object) => object.name === VISUAL_TIGHTENING_ANCHOR_NAME,
      );
      if (alreadyApplied) {
        continue;
      }

      scene.add.zone(-64, -64, 2, 2).setName(VISUAL_TIGHTENING_ANCHOR_NAME).setVisible(false);
      applyVisualTightening(scene);
    }
  }
}

let browserVisualTighteningManager: VisualTighteningManager | null = null;

export function getVisualTighteningManager(game: Phaser.Game): VisualTighteningManager {
  browserVisualTighteningManager ??= new VisualTighteningManager(game);
  return browserVisualTighteningManager;
}
