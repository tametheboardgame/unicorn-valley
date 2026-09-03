import Phaser from 'phaser';
import { LUMA_COMPANION_HATCHED_FLAG } from '../../content/r4EggArc';
import {
  WorldInteractionInput,
  WORLD_INTERACTION_PROMPT,
} from '../interaction/WorldInteractionInput';
import { getBrowserSaveService } from '../save/browserSaveService';

interface CottageTouchPoint {
  id: string;
  label: string;
  actionLabel: string;
  position: { x: number; y: number };
  radius: number;
  message: () => string;
}

interface RuntimePoint {
  definition: CottageTouchPoint;
  prompt: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
}

interface CottageDepthState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  points: RuntimePoint[];
  feedback: Phaser.GameObjects.Text;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  return (
    (scene.children.list.find(
      (object) =>
        object instanceof Phaser.Physics.Arcade.Sprite &&
        object.texture.key.startsWith('player-unicorn-'),
    ) as Phaser.Physics.Arcade.Sprite | undefined) ?? null
  );
}

function distance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

export class CottageDepthWorldManager {
  private readonly saveService = getBrowserSaveService();
  private state: CottageDepthState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('CottageInteriorScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }

    const state = this.ensureState(scene);
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    let nearest: RuntimePoint | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const point of state.points) {
      const pointDistance = distance(player, point.definition.position);
      point.prompt.setVisible(pointDistance <= point.definition.radius + 72);
      if (pointDistance <= point.definition.radius && pointDistance < nearestDistance) {
        nearest = point;
        nearestDistance = pointDistance;
      }
    }

    if (nearest && state.input.justPressed()) {
      this.showFeedback(state, nearest.definition.message());
    }
  }

  private ensureState(scene: Phaser.Scene): CottageDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();

    const state: CottageDepthState = {
      scene,
      input: new WorldInteractionInput(scene),
      points: [],
      feedback: scene.add
        .text(900, 108, '', {
          color: '#5b465d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 760 },
          backgroundColor: '#fff7eaf0',
          padding: { x: 16, y: 9 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(180)
        .setVisible(false),
    };

    const points: readonly CottageTouchPoint[] = [
      {
        id: 'bed',
        label: 'Moonflower bed',
        actionLabel: 'Flop',
        position: { x: 325, y: 700 },
        radius: 100,
        message: () =>
          'You flop onto the Moonflower blanket for exactly one cosy moment. The little moon shapes crinkle, then puff back up. 🌙',
      },
      {
        id: 'sofa',
        label: 'Cosy sofa',
        actionLabel: 'Sit',
        position: { x: 1175, y: 725 },
        radius: 100,
        message: () =>
          'The sofa gives a very serious little poof when you sit down. It is clearly proud of being the comfiest seat in the Cottage.',
      },
      {
        id: 'fireplace',
        label: 'Cottage fire',
        actionLabel: 'Warm hooves',
        position: { x: 225, y: 250 },
        radius: 100,
        message: () =>
          'The fire pops softly and turns one ember bright gold. Warm hooves achieved. 🔥',
      },
      {
        id: 'window',
        label: 'Moonflower window',
        actionLabel: 'Look outside',
        position: { x: 1000, y: 125 },
        radius: 100,
        message: () =>
          'Through the window you can see the Glade path and a sliver of the stream. Home looks different after every adventure.',
      },
      {
        id: 'companion-corner',
        label: 'Companion corner',
        actionLabel: 'Check',
        position: { x: 175, y: 700 },
        radius: 100,
        message: () => {
          const save = this.saveService.load();
          return save?.world.flags[LUMA_COMPANION_HATCHED_FLAG]
            ? 'Luma’s corner has tiny hoofprints, a warm blanket and one suspiciously sparkly feather. Somebody has definitely been cosy here. ✨'
            : 'A soft little corner near the bed is ready for somebody special to call home one day.';
        },
      },
    ];

    state.points = points.map((definition) => this.createPoint(state, definition));
    this.state = state;
    return state;
  }

  private createPoint(state: CottageDepthState, definition: CottageTouchPoint): RuntimePoint {
    const prompt = state.scene.add
      .text(
        definition.position.x,
        definition.position.y - 60,
        `${definition.actionLabel}: ${definition.label}  ·  ${WORLD_INTERACTION_PROMPT}`,
        {
          color: '#5d496c',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#fff9edea',
          padding: { x: 8, y: 5 },
        },
      )
      .setOrigin(0.5)
      .setDepth(120)
      .setVisible(false)
      .setName(`cottage-depth:${definition.id}:prompt`);
    const zone = state.scene.add
      .zone(definition.position.x, definition.position.y, 170, 150)
      .setName(`cottage-depth:${definition.id}`);
    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      if (player && distance(player, definition.position) <= definition.radius) {
        this.showFeedback(state, definition.message());
      }
    });
    return { definition, prompt, zone };
  }

  private showFeedback(state: CottageDepthState, message: string): void {
    const serial = ((state.feedback.getData('feedback-serial') as number | undefined) ?? 0) + 1;
    state.feedback.setData('feedback-serial', serial).setText(message).setVisible(true);
    state.scene.time.delayedCall(3600, () => {
      if (state.feedback.active && state.feedback.getData('feedback-serial') === serial) {
        state.feedback.setVisible(false);
      }
    });
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    for (const point of this.state.points) {
      point.prompt.destroy();
      point.zone.destroy();
    }
    this.state.feedback.destroy();
    this.state.input.destroy();
    this.state = null;
  }
}

let browserCottageDepthWorldManager: CottageDepthWorldManager | null = null;

export function getCottageDepthWorldManager(game: Phaser.Game): CottageDepthWorldManager {
  browserCottageDepthWorldManager ??= new CottageDepthWorldManager(game);
  return browserCottageDepthWorldManager;
}
