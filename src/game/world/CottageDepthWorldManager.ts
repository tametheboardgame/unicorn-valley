import Phaser from 'phaser';
import { LUMA_COMPANION_HATCHED_FLAG } from '../../content/r4EggArc';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';

interface CottageTouchPoint {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  position: { x: number; y: number };
  radius: number;
  message: () => string;
}

interface RuntimePoint {
  definition: CottageTouchPoint;
  marker: Phaser.GameObjects.Zone;
}

interface CottageDepthState {
  scene: Phaser.Scene;
  points: RuntimePoint[];
  feedback: Phaser.GameObjects.Text;
}

const REGISTRY_OWNER = 'cottage-depth';

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
    this.ensureState(scene);
  }

  private ensureState(scene: Phaser.Scene): CottageDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();

    const state: CottageDepthState = {
      scene,
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
        actionKind: 'interact',
        position: { x: 325, y: 700 },
        radius: 100,
        message: () =>
          'You flop onto the Moonflower blanket for exactly one cosy moment. The little moon shapes crinkle, then puff back up. 🌙',
      },
      {
        id: 'sofa',
        label: 'Cosy sofa',
        actionLabel: 'Sit',
        actionKind: 'interact',
        position: { x: 1175, y: 725 },
        radius: 100,
        message: () =>
          'The sofa gives a very serious little poof when you sit down. It is clearly proud of being the comfiest seat in the Cottage.',
      },
      {
        id: 'fireplace',
        label: 'Cottage fire',
        actionLabel: 'Warm hooves',
        actionKind: 'interact',
        position: { x: 225, y: 250 },
        radius: 100,
        message: () =>
          'The fire pops softly and turns one ember bright gold. Warm hooves achieved. 🔥',
      },
      {
        id: 'window',
        label: 'Moonflower window',
        actionLabel: 'Look outside',
        actionKind: 'inspect',
        position: { x: 1000, y: 125 },
        radius: 100,
        message: () =>
          'Through the window you can see the Glade path and a sliver of the stream. Home looks different after every adventure.',
      },
      {
        id: 'companion-corner',
        label: 'Companion corner',
        actionLabel: 'Check',
        actionKind: 'inspect',
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

    state.points = points.map((definition) => ({
      definition,
      // Preserve the authored world marker/name for diagnostics and layout ownership without
      // giving it its own input handler. The shared interaction coordinator owns activation.
      marker: scene.add
        .zone(definition.position.x, definition.position.y, 170, 150)
        .setName(`cottage-depth:${definition.id}`),
    }));
    this.state = state;
    this.publishTargets(state);
    return state;
  }

  private publishTargets(state: CottageDepthState): void {
    const targets: InteractionTarget[] = state.points.map(({ definition }) => ({
      id: `interaction:cottage:${definition.id}`,
      label: definition.label,
      actionLabel: definition.actionLabel,
      actionKind: definition.actionKind,
      position: definition.position,
      interactionRadius: definition.radius,
      priority: 10,
      result: {
        type: 'callback',
        activate: () => this.showFeedback(state, definition.message()),
      },
    }));
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
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
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const point of this.state.points) {
      point.marker.destroy();
    }
    this.state.feedback.destroy();
    this.state = null;
  }
}

let browserCottageDepthWorldManager: CottageDepthWorldManager | null = null;

export function getCottageDepthWorldManager(game: Phaser.Game): CottageDepthWorldManager {
  browserCottageDepthWorldManager ??= new CottageDepthWorldManager(game);
  return browserCottageDepthWorldManager;
}
