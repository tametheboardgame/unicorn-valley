import Phaser from 'phaser';
import { ensureNovaPresentationTexture, NOVA_RACE_TINT } from './NovaPresentation';

export const VISUAL_TIGHTENING_DETAIL_NAME = 'visual-tightening-detail';
const VISUAL_TIGHTENING_ANCHOR_NAME = 'visual-tightening-anchor';

const VISUAL_TIGHTENING_SUPPORTED_SCENES = new Set<string>(['NovaTutorialRaceScene', 'RaceScene']);

function markDetail<T extends Phaser.GameObjects.GameObject>(object: T): T {
  object.setName(VISUAL_TIGHTENING_DETAIL_NAME);
  return object;
}

function applyCanonicalNovaToRace(scene: Phaser.Scene): void {
  ensureNovaPresentationTexture(scene, 'gallop-a');
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
    .setTexture(ensureNovaPresentationTexture(scene, 'gallop-a'))
    .setDisplaySize(displayWidth, displayHeight)
    .clearTint()
    .setAlpha(1)
    .setName('nova-modern-racer');
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
      if (!VISUAL_TIGHTENING_SUPPORTED_SCENES.has(scene.scene.key)) {
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
