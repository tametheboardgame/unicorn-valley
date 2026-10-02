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
    radius: 112,
  },
  {
    id: 'windmill-bell',
    label: 'Windmill bell',
    actionLabel: 'Ring',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.bellPosition,
    radius: 112,
  },
  {
    id: 'windmill-lookout',
    label: 'Windmill Lookout',
    actionLabel: 'Go up',
    actionKind: 'enter',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.lookoutPosition,
    radius: 125,
  },
  {
    id: 'rainbow-pond',
    label: 'Rainbow Pond',
    actionLabel: 'Splash / watch',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.interactionPosition,
    radius: 130,
  },
  {
    id: 'picnic-hill',
    label: 'Picnic Hill',
    actionLabel: 'Sit and look',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.picnicHill.interactionPosition,
    radius: 150,
  },
  {
    id: 'petal-patch',
    label: 'Bouncy flower patch',
    actionLabel: 'Brush past',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.petalPatch,
    radius: 135,
  },
  {
    id: 'flower-circle',
    label: 'Quiet flower circle',
    actionLabel: 'Look closely',
    actionKind: 'inspect',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.flowerCircle,
    radius: 150,
  },
  {
    id: 'butterfly-parade',
    label: 'Meadow butterflies',
    actionLabel: 'Follow',
    actionKind: 'interact',
    position: RAINBOW_MEADOW_LAYOUT.natureFeatures.butterflyParade,
    radius: 145,
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
    // Keep interaction ownership independent from presentation. H4.8 deliberately removes
    // permanent hotspot icons/glows; the shared contextual prompt appears only on approach.
    const container = state.scene.add
      .container(definition.position.x, definition.position.y)
      .setName(`meadow-depth:${definition.id}`)
      .setVisible(false);
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
    this.addPetalPatchVisual(state.scene, objects);
    this.addButterflyParadeVisual(state.scene, objects);
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

    const signBoard = scene.add
      .rectangle(x, y + 74, 112, 42, 0xe7c98f, 1)
      .setStrokeStyle(4, 0x765442, 0.96)
      .setDepth(11)
      .setName('meadow-depth:windmill-landmark');
    const signText = scene.add
      .text(x, y + 74, 'LOOKOUT', {
        color: '#604f63',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setName('meadow-depth:windmill-lookout-sign-text');
    objects.push(signBoard, signText);

    const bellPosition = windmill.bellPosition;
    const bellFrame = scene.add
      .rectangle(bellPosition.x, bellPosition.y - 22, 54, 10, 0x765442, 0.95)
      .setDepth(worldDepthForY(bellPosition.y, 0.08));
    const bell = scene.add
      .ellipse(bellPosition.x, bellPosition.y, 34, 28, 0xd9a83e, 1)
      .setStrokeStyle(3, 0x8f6a2d, 0.95)
      .setDepth(worldDepthForY(bellPosition.y, 0.1))
      .setName('meadow-depth:windmill-bell-physical');
    const clapper = scene.add
      .circle(bellPosition.x, bellPosition.y + 15, 5, 0x765442, 1)
      .setDepth(worldDepthForY(bellPosition.y, 0.11));
    objects.push(bellFrame, bell, clapper);

    const ribbonPosition = windmill.storyPosition;
    const ribbonPost = scene.add
      .rectangle(ribbonPosition.x, ribbonPosition.y + 5, 8, 82, 0x816049, 0.94)
      .setDepth(worldDepthForY(ribbonPosition.y, 0.04));
    objects.push(ribbonPost);
    for (const [index, colour] of [0x78bddd, 0xf2c56c, 0xc69be0].entries()) {
      const ribbon = scene.add
        .rectangle(
          ribbonPosition.x + 20 + index * 8,
          ribbonPosition.y - 25 + index * 13,
          46,
          8,
          colour,
          0.92,
        )
        .setOrigin(0, 0.5)
        .setAngle(index === 1 ? 7 : -5)
        .setDepth(worldDepthForY(ribbonPosition.y, 0.07))
        .setName(index === 0 ? 'meadow-depth:wind-ribbon-physical' : '');
      objects.push(ribbon);
    }

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
    const colours = [0xffd978, 0xf2a3c2, 0x92cfe1, 0xc7a6e2, 0xffefad];
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const flowerX = centre.x + Math.cos(angle) * 95;
      const flowerY = centre.y + Math.sin(angle) * 58;
      const alpha = revealed ? 0.94 : 0.34;
      const depth = worldDepthForY(flowerY, -0.25);
      const petalColour = colours[index % colours.length];
      for (const [offsetX, offsetY] of [
        [-7, 0],
        [7, 0],
        [0, -7],
        [0, 7],
      ] as const) {
        const petal = scene.add
          .ellipse(flowerX + offsetX, flowerY + offsetY, 11, 8, petalColour, alpha)
          .setDepth(depth)
          .setName(index === 0 && offsetX === -7 ? 'meadow-depth:flower-circle-physical' : '');
        objects.push(petal);
      }
      objects.push(scene.add.circle(flowerX, flowerY, 4, 0xf1b84b, alpha).setDepth(depth + 0.01));
    }
  }

  private addPetalPatchVisual(scene: Phaser.Scene, objects: Phaser.GameObjects.GameObject[]): void {
    const centre = RAINBOW_MEADOW_LAYOUT.natureFeatures.petalPatch;
    const colours = [0xf09fbe, 0xffcf73, 0xb8a1df, 0x8bcbd9];
    for (let index = 0; index < 12; index += 1) {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const flowerX = centre.x - 78 + column * 52 + (row % 2) * 12;
      const flowerY = centre.y - 42 + row * 42;
      const colour = colours[index % colours.length];
      const depth = worldDepthForY(flowerY, -0.18);
      objects.push(
        scene.add
          .ellipse(flowerX - 7, flowerY, 16, 10, colour, 0.88)
          .setDepth(depth)
          .setName(index === 0 ? 'meadow-depth:petal-patch-physical' : ''),
        scene.add.ellipse(flowerX + 7, flowerY, 16, 10, colour, 0.88).setDepth(depth),
        scene.add.ellipse(flowerX, flowerY - 7, 10, 16, colour, 0.88).setDepth(depth),
        scene.add.circle(flowerX, flowerY, 4, 0xffe58c, 0.96).setDepth(depth + 0.01),
      );
    }
  }

  private addButterflyParadeVisual(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
  ): void {
    const centre = RAINBOW_MEADOW_LAYOUT.natureFeatures.butterflyParade;
    const colours = [0xf09fc0, 0x8bcfe0, 0xf0c760, 0xb79bdd];
    for (let index = 0; index < 5; index += 1) {
      const butterflyX = centre.x - 80 + index * 40;
      const butterflyY = centre.y + Math.sin(index * 1.4) * 28;
      const depth = worldDepthForY(butterflyY, 0.06);
      const colour = colours[index % colours.length];
      const leftWing = scene.add
        .ellipse(butterflyX - 6, butterflyY, 12, 18, colour, 0.9)
        .setAngle(-24)
        .setDepth(depth)
        .setName(index === 0 ? 'meadow-depth:butterfly-parade-physical' : '');
      const rightWing = scene.add
        .ellipse(butterflyX + 6, butterflyY, 12, 18, colour, 0.9)
        .setAngle(24)
        .setDepth(depth);
      const body = scene.add
        .rectangle(butterflyX, butterflyY + 1, 3, 14, 0x675466, 0.9)
        .setDepth(depth + 0.01);
      objects.push(leftWing, rightWing, body);
    }
  }

  private playPetalBurst(scene: Phaser.Scene, position: Point): void {
    const colours = [0xf2a3c2, 0xffd978, 0x92cfe1, 0xc7a6e2];
    for (let index = 0; index < 8; index += 1) {
      const petal = scene.add
        .ellipse(position.x, position.y, 16, 9, colours[index % colours.length], 0.95)
        .setAngle(index * 37)
        .setDepth(20);
      const angle = (Math.PI * 2 * index) / 8;
      scene.tweens.add({
        targets: petal,
        x: position.x + Math.cos(angle) * 85,
        y: position.y + Math.sin(angle) * 55 - 20,
        angle: petal.angle + 120,
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
