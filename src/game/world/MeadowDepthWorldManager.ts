import Phaser from 'phaser';
import {
  BREEZE_WINDMILL_QUEST_ID,
  MEADOW_FLOWER_CIRCLE_DISCOVERY_ID,
  MEADOW_FLOWER_CIRCLE_REVEALED_FLAG,
  WINDMILL_LOOKOUT_OPEN_FLAG,
} from '../../content/r6MeadowRunContent';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import { DiscoveryService } from '../discovery/DiscoveryService';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { MeadowWindmillStoryService } from '../story/MeadowWindmillStoryService';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';
import { worldDepthForY } from './WorldDepth';

interface Point {
  x: number;
  y: number;
}

interface MeadowInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  position: Point;
  radius: number;
  icon: string;
}

interface MeadowInteractionRuntime {
  definition: MeadowInteractionDefinition;
  container: Phaser.GameObjects.Container;
}

interface MeadowDepthState {
  scene: Phaser.Scene;
  interactions: MeadowInteractionRuntime[];
  feedback: Phaser.GameObjects.Text;
  persistent: Phaser.GameObjects.Container | null;
  signature: string;
}

const REGISTRY_OWNER = 'meadow-depth';
const FIXED_INTERACTIONS: readonly MeadowInteractionDefinition[] = [
  {
    id: 'windmill-story',
    label: 'Breeze’s wind ribbon',
    actionLabel: 'Look',
    actionKind: 'inspect',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.storyPosition,
    radius: 130,
    icon: '🎐',
  },
  {
    id: 'windmill-bell',
    label: 'Windmill bell',
    actionLabel: 'Ring',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.bellPosition,
    radius: 135,
    icon: '🔔',
  },
  {
    id: 'windmill-lookout',
    label: 'Windmill Lookout',
    actionLabel: 'Go up',
    actionKind: 'enter',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.lookoutPosition,
    radius: 145,
    icon: '🌬️',
  },
  {
    id: 'rainbow-pond',
    label: 'Rainbow Pond',
    actionLabel: 'Splash / watch',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.interactionPosition,
    radius: 130,
    icon: '🐸',
  },
  {
    id: 'picnic-hill',
    label: 'Picnic Hill',
    actionLabel: 'Sit and look',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.picnicHill.interactionPosition,
    radius: 150,
    icon: '🧺',
  },
  {
    id: 'petal-patch',
    label: 'Bouncy flower patch',
    actionLabel: 'Brush past',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.petalPatch,
    radius: 135,
    icon: '🌸',
  },
  {
    id: 'flower-circle',
    label: 'Quiet flower circle',
    actionLabel: 'Look closely',
    actionKind: 'inspect',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.flowerCircle,
    radius: 150,
    icon: '🌼',
  },
  {
    id: 'butterfly-parade',
    label: 'Meadow butterflies',
    actionLabel: 'Follow',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.butterflyParade,
    radius: 145,
    icon: '🦋',
  },
];

export class MeadowDepthWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly story = new MeadowWindmillStoryService(
    this.saveService,
    getBrowserQuestEngine(),
  );
  private readonly discoveries = new DiscoveryService(this.saveService);
  private readonly time = getBrowserAtmosphericTimeService(this.saveService);
  private readonly weather = getBrowserMagicalWeatherService(this.saveService);
  private state: MeadowDepthState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('RainbowMeadowScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }

    const state = this.ensureState(scene);
    this.syncPersistent(state);
  }

  private ensureState(scene: Phaser.Scene): MeadowDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();

    const state: MeadowDepthState = {
      scene,
      interactions: [],
      feedback: scene.add
        .text(640, 116, '', {
          color: '#574a61',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 760 },
          backgroundColor: '#fff9eaf2',
          padding: { x: 17, y: 9 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(188)
        .setVisible(false),
      persistent: null,
      signature: '',
    };
    state.interactions = FIXED_INTERACTIONS.map((definition) =>
      this.createInteraction(state, definition),
    );
    this.state = state;
    this.publishTargets(state);
    this.syncPersistent(state, true);
    return state;
  }

  private createInteraction(
    state: MeadowDepthState,
    definition: MeadowInteractionDefinition,
  ): MeadowInteractionRuntime {
    const glow = state.scene.add.circle(0, 0, 25, 0xffef9c, 0.06).setStrokeStyle(2, 0xffffff, 0.15);
    const icon = state.scene.add
      .text(0, 0, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
      })
      .setOrigin(0.5)
      .setAlpha(0.75);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon])
      .setName(`meadow-depth:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 15, 0.35));

    state.scene.tweens.add({
      targets: [glow, icon],
      alpha: { from: 0.38, to: 0.86 },
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return { definition, container };
  }

  private publishTargets(state: MeadowDepthState): void {
    const targets: InteractionTarget[] = state.interactions.map(({ definition, container }) => ({
      id: `interaction:meadow-depth:${definition.id}`,
      label: definition.label,
      actionLabel: definition.actionLabel,
      actionKind: definition.actionKind,
      position: definition.position,
      interactionRadius: definition.radius,
      priority: definition.actionKind === 'enter' ? 20 : 12,
      visible: () => container.active,
      result: { type: 'callback', activate: () => this.activate(state, definition) },
    }));
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private activate(state: MeadowDepthState, definition: MeadowInteractionDefinition): void {
    switch (definition.id) {
      case 'windmill-story': {
        const result = this.story.talkToBreeze();
        this.showFeedback(state, result.message);
        this.syncPersistent(state, true);
        return;
      }
      case 'windmill-bell':
        this.activateWindmillBell(state);
        return;
      case 'windmill-lookout':
        if (this.story.isLookoutOpen()) {
          state.scene.scene.start('WindmillLookoutScene');
        } else {
          this.showFeedback(
            state,
            'The lookout steps are folded away. Breeze thinks the windmill bell knows how to open them.',
          );
        }
        return;
      case 'rainbow-pond':
        this.activatePond(state);
        return;
      case 'picnic-hill':
        this.showFeedback(
          state,
          'The little rise opens into a sheltered picnic meadow, with flowers around the edge and a clear view across Rainbow Meadow. 🧺',
        );
        return;
      case 'petal-patch':
        this.playPetalBurst(state.scene, definition.position);
        this.showFeedback(
          state,
          'A puff of soft petals jumps into the air, spins around your hooves, then settles back into the grass. 🌸',
        );
        return;
      case 'flower-circle':
        this.activateFlowerCircle(state);
        return;
      case 'butterfly-parade':
        this.activateButterflies(state);
        return;
    }
  }

  private activateWindmillBell(state: MeadowDepthState): void {
    if (this.story.ringWindmillBell()) {
      this.showFeedback(
        state,
        'Ting, ting, taaang! The side gate clicks open and the little steps to Windmill Lookout unfold from behind the tower. 🔔✨',
      );
      state.scene.cameras.main.flash(110, 255, 235, 170, false);
      this.syncPersistent(state, true);
      return;
    }

    const result = this.story.talkToBreeze();
    this.showFeedback(
      state,
      result.state === 'complete'
        ? 'The bell still answers the wind with the same three notes. Breeze gives it an approving nod.'
        : result.message,
    );
  }

  private activatePond(state: MeadowDepthState): void {
    const specialWeather = this.weather.getState() !== 'clear';
    const sunset = this.time.getState() === 'sunset';
    if (specialWeather || sunset) {
      const fresh = this.story.discoverRainbowReflection();
      this.showFeedback(
        state,
        fresh
          ? 'The ripples line up into a complete little rainbow reflection. It hangs there for one breath, even though the sky above looks completely different. 🌈'
          : 'The pond remembers its rainbow trick. A frog plops through the colours and scrambles them again. 🐸',
      );
      state.scene.cameras.main.flash(85, 205, 244, 255, false);
      return;
    }

    this.showFeedback(
      state,
      'Plip! A frog disappears under a lily pad and sends three perfect rings across the water. The pond looks especially reflective in different weather. 🐸',
    );
  }

  private activateFlowerCircle(state: MeadowDepthState): void {
    const specialLight = ['sunset', 'night'].includes(this.time.getState());
    const specialWeather = this.weather.getState() !== 'clear';
    if (!specialLight && !specialWeather) {
      this.showFeedback(
        state,
        'The flowers make an almost-circle, but a few gaps are hard to see in the bright clear light. It feels like the sort of place that changes with the sky.',
      );
      return;
    }

    const fresh = this.story.revealFlowerCircle();
    this.showFeedback(
      state,
      fresh
        ? 'The changed light catches every tiny petal at once. A complete hidden flower circle appears in the grass and glows around you. 🌼✨'
        : 'The hidden flower circle brightens again. Once you know where it is, the Meadow cannot quite hide it.',
    );
    state.scene.cameras.main.flash(100, 255, 238, 174, false);
    this.syncPersistent(state, true);
  }

  private activateButterflies(state: MeadowDepthState): void {
    if (!this.discoveries.hasDiscovery(MEADOW_FLOWER_CIRCLE_DISCOVERY_ID)) {
      this.showFeedback(
        state,
        'Two butterflies drift towards the quieter grass, then double back as if waiting for the right moment.',
      );
      return;
    }

    const fresh = this.story.discoverButterflyParade();
    this.showFeedback(
      state,
      fresh
        ? 'The butterflies loop from the flower patch to the revealed circle in a tiny wobbly parade. Juniper would be delighted. 🦋'
        : 'The little butterfly parade is back. None of them seem to agree on who is leading.',
    );
  }

  private syncPersistent(state: MeadowDepthState, force = false): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const signature = [
      save.world.flags[WINDMILL_LOOKOUT_OPEN_FLAG] === true ? 'lookout' : '',
      save.world.flags[MEADOW_FLOWER_CIRCLE_REVEALED_FLAG] === true ? 'circle' : '',
      this.story.isStoryComplete() ? 'windmill-complete' : '',
    ].join('|');
    if (!force && signature === state.signature) {
      return;
    }

    state.signature = signature;
    state.persistent?.destroy(true);
    const objects: Phaser.GameObjects.GameObject[] = [];
    this.addWindmillVisual(state.scene, objects, this.story.isLookoutOpen());
    this.addFlowerCircleVisual(
      state.scene,
      objects,
      save.world.flags[MEADOW_FLOWER_CIRCLE_REVEALED_FLAG] === true,
    );
    state.persistent = state.scene.add
      .container(0, 0, objects)
      .setName('meadow-depth:persistent-state')
      .setDepth(14);
  }

  private addWindmillVisual(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    open: boolean,
  ): void {
    const windmill = RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill;
    const { x, y } = windmill.position;
    const tower = scene.add
      .rectangle(x, y, 130, 250, 0xe7d09a, 1)
      .setStrokeStyle(7, 0x9a7455, 0.95)
      .setDepth(7);
    const roof = scene.add.triangle(x, y - 160, 0, 80, 78, 0, 156, 80, 0xbb7d68, 1).setDepth(8);
    const hub = scene.add.circle(x, y - 70, 21, 0xf2c85f, 1).setDepth(10);
    objects.push(tower, roof, hub);

    for (const angle of [0, 45, 90, 135]) {
      objects.push(
        scene.add
          .rectangle(x, y - 70, 10, 178, 0xfff0c9, 1)
          .setAngle(angle)
          .setStrokeStyle(2, 0xb68c61, 0.75)
          .setDepth(9),
      );
    }

    const label = scene.add
      .text(x, y - 191, 'WINDMILL LOOKOUT', {
        color: '#60506f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e0df',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setName('meadow-depth:windmill-landmark');
    objects.push(label);

    if (open) {
      const steps = scene.add.graphics().setDepth(6).setName('meadow-depth:windmill-open-path');
      steps.lineStyle(58, 0xf4e2b8, 0.95);
      steps.beginPath();
      steps.moveTo(
        RAINBOW_MEADOW_LAYOUT.hubFeatures.windmillLookout.approach.x,
        RAINBOW_MEADOW_LAYOUT.hubFeatures.windmillLookout.approach.y,
      );
      steps.lineTo(windmill.lookoutPosition.x, windmill.lookoutPosition.y);
      steps.strokePath();
      objects.push(steps);
    }
  }

  private addFlowerCircleVisual(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    revealed: boolean,
  ): void {
    const centre = RAINBOW_MEADOW_LAYOUT.natureFeatures.flowerCircle;
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const flower = scene.add
        .text(
          centre.x + Math.cos(angle) * 95,
          centre.y + Math.sin(angle) * 58,
          revealed ? '🌼' : '·',
          {
            color: '#fff4ac',
            fontFamily: 'system-ui, sans-serif',
            fontSize: revealed ? '20px' : '18px',
          },
        )
        .setOrigin(0.5)
        .setAlpha(revealed ? 0.88 : 0.28)
        .setDepth(6);
      objects.push(flower);
    }
  }

  private playPetalBurst(scene: Phaser.Scene, position: Point): void {
    for (let index = 0; index < 6; index += 1) {
      const petal = scene.add
        .text(position.x, position.y, index % 2 === 0 ? '🌸' : '✦', {
          color: '#fff2ae',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
        })
        .setOrigin(0.5)
        .setDepth(20);
      const angle = (Math.PI * 2 * index) / 6;
      scene.tweens.add({
        targets: petal,
        x: position.x + Math.cos(angle) * 85,
        y: position.y + Math.sin(angle) * 55 - 20,
        alpha: 0,
        duration: 700,
        onComplete: () => petal.destroy(),
      });
    }
  }

  private showFeedback(state: MeadowDepthState, message: string): void {
    const serial = ((state.feedback.getData('feedback-serial') as number | undefined) ?? 0) + 1;
    state.feedback.setData('feedback-serial', serial).setText(message).setVisible(true);
    state.scene.time.delayedCall(3900, () => {
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
    for (const runtime of this.state.interactions) {
      runtime.container.destroy(true);
    }
    this.state.persistent?.destroy(true);
    this.state.feedback.destroy();
    this.state = null;
  }
}

let browserMeadowDepthWorldManager: MeadowDepthWorldManager | null = null;

export function getMeadowDepthWorldManager(game: Phaser.Game): MeadowDepthWorldManager {
  browserMeadowDepthWorldManager ??= new MeadowDepthWorldManager(game);
  return browserMeadowDepthWorldManager;
}

export function getMeadowDepthQuestId(): string {
  return BREEZE_WINDMILL_QUEST_ID;
}
