import Phaser from 'phaser';
import { getFireflyLanternProgress } from './FireflyLanternActivity';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';
import { rememberWorldReturnState } from '../world/WorldArrivalState';
import { setWhisperingWoodsPlayerSpawn } from '../world/WhisperingWoodsMap';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const LANTERN_POSITION = { x: 2480, y: 760 } as const;
const PRESENTATION_NAME = 'firefly-lantern-world-presentation';
const REGISTRY_OWNER = 'firefly-lantern-world';

interface LanternState {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  status: Phaser.GameObjects.Text;
  light: Phaser.GameObjects.Rectangle;
  glow: Phaser.GameObjects.Arc;
  completionSignature: string;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.Physics.Arcade.Sprite ? player : null;
}

export class FireflyLanternWorldManager {
  private readonly saveService = getBrowserSaveService();
  private state: LanternState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    const scene = this.game.scene.getScene('WhisperingWoodsScene');
    if (!scene?.scene.isActive()) {
      this.clearState();
      return;
    }

    const state = this.ensureState(scene);
    this.syncCompletionState(state);
  }

  private ensureState(scene: Phaser.Scene): LanternState {
    if (this.state?.scene === scene && this.state.container.active) {
      return this.state;
    }
    this.clearState();

    const post = scene.add.rectangle(0, 55, 18, 120, 0x625344, 1);
    const hook = scene.add.rectangle(25, -8, 58, 12, 0x625344, 1);
    const lanternGlow = scene.add.circle(52, 28, 56, 0xf7efa3, 0.14);
    const lantern = scene.add.rectangle(52, 28, 52, 66, 0x6d5d45, 1).setStrokeStyle(5, 0xd6c789, 1);
    const light = scene.add.rectangle(52, 28, 30, 42, 0xffed91, 0.88);
    const label = scene.add
      .text(0, 132, 'Firefly Lantern', {
        color: '#dcefd6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#284940ed',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5);
    const status = scene.add
      .text(0, 160, '', {
        color: '#eff7aa',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('firefly-lantern-world-status');
    const container = scene.add
      .container(LANTERN_POSITION.x, LANTERN_POSITION.y, [
        post,
        hook,
        lanternGlow,
        lantern,
        light,
        label,
        status,
      ])
      .setName(PRESENTATION_NAME)
      .setDepth(18);

    for (const [index, [x, y]] of [
      [-45, 5],
      [95, -35],
      [115, 70],
    ].entries()) {
      const mote = scene.add.circle(x, y, 5, 0xfff2a1, 0.9);
      container.add(mote);
      scene.tweens.add({
        targets: mote,
        x: x + (index % 2 === 0 ? 24 : -22),
        y: y - 26,
        alpha: { from: 0.35, to: 1 },
        duration: 950 + index * 170,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    scene.tweens.add({
      targets: lanternGlow,
      alpha: { from: 0.08, to: 0.32 },
      scale: { from: 0.92, to: 1.12 },
      duration: 1150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.state = {
      scene,
      container,
      status,
      light,
      glow: lanternGlow,
      completionSignature: '',
    };
    getSceneInteractionRegistry(scene).replaceOwnerTargets(REGISTRY_OWNER, [
      {
        id: 'interaction:firefly-lantern',
        label: 'Firefly Lantern',
        actionLabel: 'Play',
        actionKind: 'start',
        position: LANTERN_POSITION,
        interactionRadius: 170,
        priority: 20,
        visible: () => container.active,
        result: { type: 'callback', activate: () => this.openActivity(scene) },
      },
    ]);
    this.syncCompletionState(this.state, true);
    return this.state;
  }

  private syncCompletionState(state: LanternState, force = false): void {
    const progress = getFireflyLanternProgress(this.saveService);
    const signature = `${progress.modesUnlocked}|${progress.endlessBest}`;
    if (!force && signature === state.completionSignature) {
      return;
    }
    state.completionSignature = signature;
    if (progress.modesUnlocked) {
      state.status.setText(
        progress.endlessBest > 0
          ? `Lantern Keeper glow • best endless ${progress.endlessBest}`
          : 'Lantern Keeper glow • extra games unlocked',
      );
      state.light.setFillStyle(0xfff3a8, 1);
      state.glow.setFillStyle(0xffef91, 0.24);
    } else {
      state.status.setText('Guide the golden lights home');
      state.light.setFillStyle(0xffed91, 0.88);
      state.glow.setFillStyle(0xf7efa3, 0.14);
    }
  }

  private openActivity(scene: Phaser.Scene): void {
    if (!scene.scene.isActive()) {
      return;
    }
    const player = findPlayer(scene);
    if (player) {
      rememberWorldReturnState('WhisperingWoodsScene', player, setWhisperingWoodsPlayerSpawn);
    }
    scene.scene.start('FireflyLanternScene');
  }

  private clearState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    if (this.state.container.active) {
      this.state.container.destroy(true);
    }
    this.state = null;
  }
}

let manager: FireflyLanternWorldManager | null = null;

export function getFireflyLanternWorldManager(game: Phaser.Game): FireflyLanternWorldManager {
  manager ??= new FireflyLanternWorldManager(game);
  return manager;
}
