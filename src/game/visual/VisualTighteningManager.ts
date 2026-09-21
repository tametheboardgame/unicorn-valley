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

const SUPPORTED_SCENES = new Set(['RainbowMeadowScene', 'NovaTutorialRaceScene', 'RaceScene']);

function markDetail<T extends Phaser.GameObjects.GameObject>(object: T): T {
  object.setName(VISUAL_TIGHTENING_DETAIL_NAME);
  return object;
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
    case 'RainbowMeadowScene':
      decorateMeadow(scene);
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
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
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
