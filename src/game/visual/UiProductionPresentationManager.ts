import Phaser from 'phaser';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';

const UI_SCENES = new Set([
  'InventoryScene',
  'ShopScene',
  'CottageDecorateScene',
  'WonderbookScene',
]);

interface FrameSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  label: string;
  labelCentered?: boolean;
}

const FRAME_SPECS: Readonly<Record<string, FrameSpec>> = {
  InventoryScene: {
    x: 72,
    y: 28,
    width: 1136,
    height: 664,
    depth: 30,
    label: 'MY BAG',
  },
  ShopScene: {
    x: 52,
    y: 22,
    width: 1176,
    height: 676,
    depth: 20,
    label: 'TWINKLE & THREAD',
  },
  CottageDecorateScene: {
    x: 72,
    y: 12,
    width: 1136,
    height: 696,
    depth: 20,
    label: 'COTTAGE DECORATING',
  },
  WonderbookScene: {
    x: 62,
    y: 44,
    width: 1136,
    height: 576,
    depth: 14,
    label: 'ADVENTURE SCRAPBOOK',
    labelCentered: true,
  },
};

function anchorName(sceneKey: string): string {
  return `ui-production:${sceneKey}:anchor`;
}

function hasAnchor(scene: Phaser.Scene): boolean {
  return scene.children.list.some(({ name }) => name === anchorName(scene.scene.key));
}

function createFrame(scene: Phaser.Scene, spec: FrameSpec): void {
  const graphics = scene.add.graphics().setScrollFactor(0);
  graphics.lineStyle(3, UI_COLOURS.goldStrong, 0.72);
  graphics.strokeRoundedRect(spec.x, spec.y, spec.width, spec.height, 26);
  graphics.lineStyle(2, UI_COLOURS.ribbonStrong, 0.58);
  graphics.strokeRoundedRect(spec.x + 9, spec.y + 9, spec.width - 18, spec.height - 18, 22);

  for (let offset = 32; offset < spec.width - 28; offset += 44) {
    graphics.fillStyle(offset % 88 === 32 ? UI_COLOURS.ribbon : UI_COLOURS.gold, 0.46);
    graphics.fillCircle(spec.x + offset, spec.y + 7, 3);
    graphics.fillCircle(spec.x + offset, spec.y + spec.height - 7, 3);
  }

  const labelX = spec.labelCentered ? spec.x + spec.width / 2 : spec.x + 28;
  const label = scene.add
    .text(labelX, spec.y + spec.height - 17, `✦ ${spec.label} ✦`, {
      color: UI_COLOURS.creamText,
      fontFamily: UI_FONT,
      fontSize: '11px',
      fontStyle: 'bold',
      backgroundColor: '#76518acc',
      padding: { x: 9, y: 4 },
    })
    .setOrigin(spec.labelCentered ? 0.5 : 0, 0.5)
    .setScrollFactor(0);
  const sparkle = scene.add
    .text(spec.x + spec.width - 30, spec.y + 24, '✦', {
      color: '#ffe6a6',
      fontFamily: UI_FONT,
      fontSize: '22px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  const ornaments = scene.add
    .container(0, 0, [graphics, label, sparkle])
    .setName(`ui-production:${scene.scene.key}:ornaments`)
    .setDepth(spec.depth);

  scene.tweens.add({
    targets: sparkle,
    alpha: { from: 0.45, to: 1 },
    scale: { from: 0.92, to: 1.08 },
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });

  ornaments.setVisible(true);
}

export class UiProductionPresentationManager {
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.sync, this);
  }

  private readonly sync = (): void => {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!UI_SCENES.has(scene.scene.key) || hasAnchor(scene)) {
        continue;
      }
      const spec = FRAME_SPECS[scene.scene.key];
      if (!spec) {
        continue;
      }
      scene.add.zone(-64, -64, 2, 2).setName(anchorName(scene.scene.key)).setVisible(false);
      createFrame(scene, spec);
    }
  };
}

let browserUiProductionPresentationManager: UiProductionPresentationManager | null = null;

export function getUiProductionPresentationManager(
  game: Phaser.Game,
): UiProductionPresentationManager {
  browserUiProductionPresentationManager ??= new UiProductionPresentationManager(game);
  return browserUiProductionPresentationManager;
}
