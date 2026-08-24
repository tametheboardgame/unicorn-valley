import Phaser from 'phaser';
import {
  WORLD_INTERACTION_PROMPT,
  WorldInteractionInput,
} from '../interaction/WorldInteractionInput';
import { rememberWorldReturnState } from '../world/WorldArrivalState';
import { setWhisperingWoodsPlayerSpawn } from '../world/WhisperingWoodsMap';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const LANTERN_POSITION = { x: 2480, y: 760 } as const;
const PRESENTATION_NAME = 'firefly-lantern-world-presentation';

interface LanternState {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  interaction: WorldInteractionInput;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.Physics.Arcade.Sprite ? player : null;
}

export class FireflyLanternWorldManager {
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
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      LANTERN_POSITION.x,
      LANTERN_POSITION.y,
    );
    state.prompt.setVisible(distance <= 230);

    if (distance <= 170 && state.interaction.justPressed()) {
      this.openActivity(scene);
    }
  }

  private ensureState(scene: Phaser.Scene): LanternState {
    if (this.state?.scene === scene && this.state.container.active) {
      return this.state;
    }
    this.clearState();

    const interaction = new WorldInteractionInput(scene);
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
    const prompt = scene.add
      .text(0, 174, `${WORLD_INTERACTION_PROMPT}: Play`, {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#efffeef2',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = scene.add.zone(25, 45, 190, 230);
    const container = scene.add
      .container(LANTERN_POSITION.x, LANTERN_POSITION.y, [
        post,
        hook,
        lanternGlow,
        lantern,
        light,
        label,
        prompt,
        zone,
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

    interaction.bindPointer(zone, () => {
      const player = findPlayer(scene);
      if (!player) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        LANTERN_POSITION.x,
        LANTERN_POSITION.y,
      );
      if (distance <= 190) {
        this.openActivity(scene);
      }
    });

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
      prompt,
      interaction,
    };
    return this.state;
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
    this.state.interaction.destroy();
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
