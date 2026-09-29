import Phaser from 'phaser';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { SUNBEAM_VILLAGE_LAYOUT } from '../world/SunbeamVillageLayout';

const REGISTRY_OWNER = 'sunbeam-chess-plaza';

export class ChessPlazaWorldManager {
  private activeScene: Phaser.Scene | null = null;
  private launchPending = false;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.clearTarget();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('SunbeamVillageScene');
    if (!scene?.scene.isActive()) {
      this.clearTarget();
      return;
    }
    if (this.activeScene === scene) {
      return;
    }

    this.clearTarget();
    this.activeScene = scene;
    const { table } = SUNBEAM_VILLAGE_LAYOUT.chessPlaza;
    getSceneInteractionRegistry(scene).replaceOwnerTargets(REGISTRY_OWNER, [
      {
        id: 'interaction:activity:sunbeam-chess',
        label: 'Sunbeam chess table',
        actionLabel: 'Play chess',
        actionKind: 'start',
        position: { ...table.interaction },
        interactionRadius: table.interactionRadius,
        priority: 24,
        visible: () => scene.scene.isActive(),
        result: {
          type: 'callback',
          activate: () => void this.launchChess(scene),
        },
      },
    ]);
  }

  private async launchChess(scene: Phaser.Scene): Promise<void> {
    if (this.launchPending) {
      return;
    }
    this.launchPending = true;
    try {
      if (!this.game.scene.keys.ChessPlazaActivityScene) {
        const { ChessPlazaActivityScene } = await import('./ChessPlazaActivityScene');
        this.game.scene.add('ChessPlazaActivityScene', ChessPlazaActivityScene);
      }
      scene.scene.launch('ChessPlazaActivityScene', { returnScene: 'SunbeamVillageScene' });
      scene.scene.pause();
    } finally {
      this.launchPending = false;
    }
  }

  private clearTarget(): void {
    if (this.activeScene) {
      getSceneInteractionRegistry(this.activeScene).clearOwner(REGISTRY_OWNER);
    }
    this.activeScene = null;
  }
}

let manager: ChessPlazaWorldManager | null = null;

export function getChessPlazaWorldManager(game: Phaser.Game): ChessPlazaWorldManager {
  manager ??= new ChessPlazaWorldManager(game);
  return manager;
}
