import Phaser from 'phaser';

const SUPPORTED_SCENES = new Set(['CrystalBrookScene', 'WhisperingWoodsScene']);

interface HintDefinition {
  startsWith: string;
  replacement: string;
  x: number;
  y: number;
}

const HINTS: Readonly<Record<string, HintDefinition>> = {
  CrystalBrookScene: {
    startsWith: 'Follow the water, hop between stones',
    replacement: 'The pale stream is shallow here. Follow it to find little treasures.',
    x: 1640,
    y: 960,
  },
  WhisperingWoodsScene: {
    startsWith: 'The little green lights always follow a safe path.',
    replacement: 'Little green lights mark the safest woodland trail.',
    x: 910,
    y: 1010,
  },
};

export class ExplorationGeometryPresentationManager {
  private readonly processedScenes = new WeakSet<Phaser.Scene>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!SUPPORTED_SCENES.has(scene.scene.key) || this.processedScenes.has(scene)) {
        continue;
      }

      const definition = HINTS[scene.scene.key];
      const legacyHint = scene.children.list.find(
        (object): object is Phaser.GameObjects.Text =>
          object instanceof Phaser.GameObjects.Text &&
          object.text.startsWith(definition.startsWith),
      );
      if (legacyHint) {
        legacyHint
          .setText(definition.replacement)
          .setName('region-world-guidance')
          .setPosition(definition.x, definition.y)
          .setOrigin(0.5)
          .setScrollFactor(1)
          .setDepth(16);
      }

      this.processedScenes.add(scene);
    }
  }
}

let manager: ExplorationGeometryPresentationManager | null = null;

export function getExplorationGeometryPresentationManager(
  game: Phaser.Game,
): ExplorationGeometryPresentationManager {
  manager ??= new ExplorationGeometryPresentationManager(game);
  return manager;
}
