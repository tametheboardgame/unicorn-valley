import Phaser from 'phaser';
import {
  FERN_FIREFLY_WAY_COMPLETE_FLAG,
  FIREFLY_GROVE_OPEN_FLAG,
  TINY_TRACKS_COMPLETE_FLAG,
  WOODS_LIGHT_TRAIL_FLAG,
} from '../../content/r6WhisperingWoodsDepthContent';
import {
  getBrowserAtmosphericTimeService,
  type AtmosphericTimeState,
} from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import {
  WORLD_INTERACTION_PROMPT,
  WorldInteractionInput,
} from '../interaction/WorldInteractionInput';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { WoodsDepthStoryService } from '../story/WoodsDepthStoryService';
import { worldDepthForY } from './WorldDepth';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface Point {
  x: number;
  y: number;
}

interface WoodsInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  position: Point;
  radius: number;
  icon: string;
}

interface WoodsInteractionRuntime {
  definition: WoodsInteractionDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
}

interface WoodsDepthState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  interactions: WoodsInteractionRuntime[];
  feedback: Phaser.GameObjects.Text;
  persistent: Phaser.GameObjects.Container | null;
  signature: string;
}

const INTERACTIONS: readonly WoodsInteractionDefinition[] = [
  {
    id: 'fern-firefly-clue',
    label: 'Fern’s patient fireflies',
    actionLabel: 'Listen with Fern',
    position: { x: 2850, y: 1150 },
    radius: 130,
    icon: '✨',
  },
  {
    id: 'firefly-grove',
    label: 'Firefly Grove',
    actionLabel: 'Go inside',
    position: { x: 3130, y: 780 },
    radius: 160,
    icon: '🌿',
  },
  {
    id: 'fern-light-trail',
    label: 'Patient light trail',
    actionLabel: 'Follow',
    position: { x: 2860, y: 970 },
    radius: 145,
    icon: '🌟',
  },
  {
    id: 'mooncap-sequence',
    label: 'Mooncap Grove',
    actionLabel: 'Touch the mooncaps',
    position: { x: 1180, y: 620 },
    radius: 150,
    icon: '🍄',
  },
  {
    id: 'firefly-gather',
    label: 'Drifting fireflies',
    actionLabel: 'Stand quietly',
    position: { x: 2260, y: 820 },
    radius: 145,
    icon: '✦',
  },
  {
    id: 'leaf-pile',
    label: 'Soft leaf pile',
    actionLabel: 'Rustle',
    position: { x: 1740, y: 1270 },
    radius: 145,
    icon: '🍂',
  },
  {
    id: 'tiny-tracks',
    label: 'Tiny mossy tracks',
    actionLabel: 'Inspect',
    position: { x: 1030, y: 820 },
    radius: 145,
    icon: '🐾',
  },
  {
    id: 'hollow-log',
    label: 'Hollow mossy log',
    actionLabel: 'Peek inside',
    position: { x: 1460, y: 760 },
    radius: 145,
    icon: '🪵',
  },
  {
    id: 'moss-tail',
    label: 'A leafy little rustle',
    actionLabel: 'Wait and watch',
    position: { x: 1740, y: 720 },
    radius: 145,
    icon: '🌿',
  },
  {
    id: 'mushroom-ring',
    label: 'Mooncap Ring',
    actionLabel: 'Watch the ring',
    position: { x: 2150, y: 1580 },
    radius: 155,
    icon: '🍄',
  },
  {
    id: 'hidden-leaf-path',
    label: 'Tidy fallen leaves',
    actionLabel: 'Follow the leaves',
    position: { x: 3100, y: 1800 },
    radius: 140,
    icon: '🍁',
  },
];

function findPlayer(scene: Phaser.Scene): Point | null {
  const object = scene.children.getByName(WORLD_PLAYER_NAME) as
    | (Phaser.GameObjects.GameObject & Partial<Point>)
    | null;
  if (object && typeof object.x === 'number' && typeof object.y === 'number') {
    return { x: object.x, y: object.y };
  }
  return null;
}

function distance(left: Point, right: Point): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

export class WoodsDepthWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly story = new WoodsDepthStoryService(this.saveService, getBrowserQuestEngine());
  private readonly time = getBrowserAtmosphericTimeService(this.saveService);
  private readonly weather = getBrowserMagicalWeatherService(this.saveService);
  private state: WoodsDepthState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('WhisperingWoodsScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }

    const state = this.ensureState(scene);
    this.syncPersistent(state);
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    let nearest: WoodsInteractionRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const runtime of state.interactions) {
      const pointDistance = distance(player, runtime.definition.position);
      const inInteractionRange = pointDistance <= runtime.definition.radius;
      runtime.prompt.setVisible(pointDistance <= runtime.definition.radius + 80);
      if (runtime.zone.input) {
        runtime.zone.input.enabled = inInteractionRange;
      }
      if (inInteractionRange && pointDistance < nearestDistance) {
        nearest = runtime;
        nearestDistance = pointDistance;
      }
    }

    if (nearest && state.input.justPressed()) {
      this.activate(state, nearest.definition);
    }
  }

  private ensureState(scene: Phaser.Scene): WoodsDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();
    const state: WoodsDepthState = {
      scene,
      input: new WorldInteractionInput(scene),
      interactions: [],
      feedback: scene.add
        .text(640, 116, '', {
          color: '#36564e',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 780 },
          backgroundColor: '#f2fff0f2',
          padding: { x: 17, y: 9 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(188)
        .setVisible(false),
      persistent: null,
      signature: '',
    };
    state.interactions = INTERACTIONS.map((definition) =>
      this.createInteraction(state, definition),
    );
    this.state = state;
    this.syncPersistent(state, true);
    return state;
  }

  private createInteraction(
    state: WoodsDepthState,
    definition: WoodsInteractionDefinition,
  ): WoodsInteractionRuntime {
    const glow = state.scene.add.circle(0, 0, 24, 0xc9f5a5, 0.07);
    const icon = state.scene.add
      .text(0, 0, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
      })
      .setOrigin(0.5)
      .setAlpha(0.72);
    const prompt = state.scene.add
      .text(
        0,
        47,
        `${definition.actionLabel}: ${definition.label}  ·  ${WORLD_INTERACTION_PROMPT}`,
        {
          color: '#dcefd6',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#284940ed',
          padding: { x: 8, y: 5 },
        },
      )
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 180, 150);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon, prompt, zone])
      .setName(`woods-depth:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 15, 0.35));

    state.input.bindPointer(zone, () => {
      const player = findPlayer(state.scene);
      if (player && distance(player, definition.position) <= definition.radius) {
        this.activate(state, definition);
      }
    });
    if (zone.input) {
      zone.input.enabled = false;
    }
    return { definition, container, prompt, zone };
  }

  private activate(state: WoodsDepthState, definition: WoodsInteractionDefinition): void {
    switch (definition.id) {
      case 'fern-firefly-clue': {
        const result = this.story.talkToFern();
        this.showFeedback(state, result.message);
        this.syncPersistent(state, true);
        return;
      }
      case 'firefly-grove':
        if (this.story.isGroveOpen()) {
          state.scene.scene.start('FireflyGroveScene');
        } else {
          this.showFeedback(
            state,
            'A close row of ferns hides a narrow way east. Fern keeps watching the fireflies beside it.',
          );
        }
        return;
      case 'fern-light-trail':
        this.activateLightTrail(state);
        return;
      case 'mooncap-sequence':
        this.showFeedback(
          state,
          'One mooncap glows, then the next, then the next. The last one waits until you stop moving before it lights. 🍄✨',
        );
        state.scene.cameras.main.flash(55, 205, 242, 190, false);
        return;
      case 'firefly-gather':
        this.showFeedback(
          state,
          'You stand still. Three fireflies drift closer, circle your horn once, then float back to their friends. ✨',
        );
        return;
      case 'leaf-pile':
        this.showFeedback(
          state,
          'Fwoosh! The leaves puff into the air and settle in completely different places. Nothing scary underneath—just one surprised beetle. 🍂',
        );
        return;
      case 'tiny-tracks':
        this.activateTinyTracks(state);
        return;
      case 'hollow-log':
        this.activateHollowLog(state);
        return;
      case 'moss-tail':
        this.activateMossTail(state);
        return;
      case 'mushroom-ring':
        this.activateMushroomRing(state);
        return;
      case 'hidden-leaf-path': {
        const fresh = this.story.discoverHiddenLeafPath();
        this.showFeedback(
          state,
          fresh
            ? 'The tidy leaves point along a soft little side path and back towards the old trees. A hidden route! 🍂✨'
            : 'The Hidden Leaf Path is still here, soft underhoof and much easier to recognise now.',
        );
        this.syncPersistent(state, true);
        return;
      }
    }
  }

  private activateLightTrail(state: WoodsDepthState): void {
    if (this.story.followFernLightTrail()) {
      this.showFeedback(
        state,
        'The patient fireflies line up from Lantern Clearing towards the hidden Grove. They stop beside a very old tree-shaped silhouette. 🌟',
      );
      state.scene.cameras.main.flash(80, 242, 247, 170, false);
      return;
    }
    this.showFeedback(
      state,
      this.story.isFernStoryComplete()
        ? 'The permanent trail twinkles in the same calm order, making the Grove easy to find again.'
        : 'A few fireflies hover here, but Fern has not explained which lights to follow yet.',
    );
  }

  private activateTinyTracks(state: WoodsDepthState): void {
    if (this.story.beginTinyTracks()) {
      this.showFeedback(
        state,
        'Tiny three-toed tracks cross the moss and vanish under a hollow log. Whatever made them is much smaller than a unicorn. 🐾',
      );
      return;
    }
    this.showFeedback(
      state,
      this.story.isTinyTracksComplete()
        ? 'The little tracks have returned, but today they loop around the log and disappear into the ferns.'
        : 'The tiny tracks still point towards the hollow mossy log.',
    );
  }

  private activateHollowLog(state: WoodsDepthState): void {
    if (this.story.inspectHollowLog()) {
      this.showFeedback(
        state,
        'Two bright eyes blink once inside the log. A tiny rustle darts towards the patch of ferns farther along the path. 🪵👀',
      );
      return;
    }
    this.showFeedback(
      state,
      this.story.isTinyTracksComplete()
        ? 'The hollow log is quiet now except for one leaf moving when there is no wind.'
        : 'The log smells of moss and rain. Some tiny tracks nearby might explain the rustle.',
    );
  }

  private activateMossTail(state: WoodsDepthState): void {
    if (this.story.spotLittleMossTail()) {
      this.showFeedback(
        state,
        'There! A tiny leafy tail flicks out from the ferns and vanishes again. Shy, harmless and definitely real. 🌿✨',
      );
      state.scene.cameras.main.flash(70, 210, 243, 184, false);
      return;
    }
    this.showFeedback(
      state,
      this.story.isTinyTracksComplete()
        ? 'The ferns give one tiny rustle. Your shy moss-tail neighbour is still somewhere nearby.'
        : 'The ferns move a little, but there is not enough of a clue to know what to watch for yet.',
    );
  }

  private activateMushroomRing(state: WoodsDepthState): void {
    const timeState = this.time.getState();
    const weatherState = this.weather.getState();
    const magical = this.isDark(timeState) || weatherState !== 'clear';
    if (!magical) {
      this.showFeedback(
        state,
        'A perfect circle of mooncaps sits quietly in the clear daylight. It feels as though they are waiting for a different kind of sky.',
      );
      return;
    }
    const fresh = this.story.discoverMushroomRing();
    this.showFeedback(
      state,
      fresh
        ? 'The Mooncap Ring wakes one mushroom at a time until the whole circle glows. A Woods secret! 🍄✨'
        : 'The Mooncap Ring repeats its slow circle of light, one mushroom politely waiting for the next.',
    );
    state.scene.cameras.main.flash(75, 201, 235, 184, false);
  }

  private isDark(timeState: AtmosphericTimeState): boolean {
    return timeState === 'sunset' || timeState === 'night';
  }

  private syncPersistent(state: WoodsDepthState, force = false): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const groveOpen = save.world.flags[FIREFLY_GROVE_OPEN_FLAG] === true;
    const lightTrail = save.world.flags[WOODS_LIGHT_TRAIL_FLAG] === true;
    const fernComplete = save.world.flags[FERN_FIREFLY_WAY_COMPLETE_FLAG] === true;
    const tracksComplete = save.world.flags[TINY_TRACKS_COMPLETE_FLAG] === true;
    const signature = [
      groveOpen ? 'open' : '',
      lightTrail ? 'trail' : '',
      fernComplete ? 'fern' : '',
      tracksComplete ? 'tracks' : '',
    ].join('|');
    if (!force && signature === state.signature) {
      return;
    }
    state.signature = signature;
    state.persistent?.destroy(true);
    const objects: Phaser.GameObjects.GameObject[] = [];
    this.addGroveEntrance(state.scene, objects, groveOpen);
    this.addMushroomRing(state.scene, objects);
    this.addHollowLog(state.scene, objects);
    if (lightTrail) {
      this.addLightTrail(state.scene, objects);
    }
    if (save.world.flags['flag:r5-woods-starwell-revealed'] === true) {
      objects.push(
        state.scene.add
          .text(2860, 1480, '✦ old secret path ✦', {
            color: '#cfe6bd',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(8),
      );
    }
    state.persistent = state.scene.add
      .container(0, 0, objects)
      .setName('woods-depth:persistent-state')
      .setDepth(13);
  }

  private addGroveEntrance(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    open: boolean,
  ): void {
    const left = scene.add.ellipse(3050, 750, 135, 245, 0x315d45, 1).setDepth(8);
    const right = scene.add.ellipse(3210, 750, 135, 245, 0x315d45, 1).setDepth(8);
    const doorway = scene.add
      .ellipse(3130, 805, 125, 185, open ? 0x213f38 : 0x385847, 1)
      .setStrokeStyle(5, open ? 0xc7eba7 : 0x648365, 0.8)
      .setDepth(7)
      .setName('woods-depth:firefly-grove-entrance');
    objects.push(left, right, doorway);
    if (open) {
      objects.push(
        scene.add
          .text(3130, 750, '✦  🌿  ✦', {
            color: '#eff7aa',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
    }
  }

  private addMushroomRing(scene: Phaser.Scene, objects: Phaser.GameObjects.GameObject[]): void {
    for (let index = 0; index < 7; index += 1) {
      const angle = (Math.PI * 2 * index) / 7;
      objects.push(
        scene.add
          .ellipse(
            2150 + Math.cos(angle) * 105,
            1580 + Math.sin(angle) * 58,
            42,
            24,
            0xc8dded,
            0.92,
          )
          .setDepth(7),
      );
    }
  }

  private addHollowLog(scene: Phaser.Scene, objects: Phaser.GameObjects.GameObject[]): void {
    objects.push(
      scene.add
        .ellipse(1460, 770, 180, 75, 0x67513e, 1)
        .setStrokeStyle(8, 0x4c3d31, 0.9)
        .setDepth(8)
        .setName('woods-depth:hollow-log-landmark'),
      scene.add.ellipse(1520, 770, 60, 48, 0x2c312d, 1).setDepth(9),
    );
  }

  private addLightTrail(scene: Phaser.Scene, objects: Phaser.GameObjects.GameObject[]): void {
    const points = [
      [2580, 850],
      [2700, 900],
      [2820, 940],
      [2940, 900],
      [3050, 835],
    ] as const;
    for (const [x, y] of points) {
      objects.push(scene.add.circle(x, y, 9, 0xffef91, 0.82).setDepth(12));
    }
  }

  private showFeedback(state: WoodsDepthState, message: string): void {
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
    for (const runtime of this.state.interactions) {
      runtime.container.destroy(true);
    }
    this.state.persistent?.destroy(true);
    this.state.feedback.destroy();
    this.state.input.destroy();
    this.state = null;
  }
}

let browserWoodsDepthWorldManager: WoodsDepthWorldManager | null = null;

export function getWoodsDepthWorldManager(game: Phaser.Game): WoodsDepthWorldManager {
  browserWoodsDepthWorldManager ??= new WoodsDepthWorldManager(game);
  return browserWoodsDepthWorldManager;
}
