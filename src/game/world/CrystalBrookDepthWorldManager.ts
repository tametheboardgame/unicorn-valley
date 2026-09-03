import Phaser from 'phaser';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import {
  CRYSTAL_GROTTO_OPEN_FLAG,
  ECHO_CRYSTAL_SONG_COMPLETE_FLAG,
  ECHO_CRYSTAL_SONG_QUEST_ID,
} from '../../content/r6CrystalBrookDepthContent';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import {
  WorldInteractionInput,
  WORLD_INTERACTION_PROMPT,
} from '../interaction/WorldInteractionInput';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { CrystalGrottoStoryService } from '../story/CrystalGrottoStoryService';
import { worldDepthForY } from './WorldDepth';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface Point {
  x: number;
  y: number;
}

interface BrookInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  position: Point;
  radius: number;
  icon: string;
}

interface BrookInteractionRuntime {
  definition: BrookInteractionDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
}

interface BrookDepthState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  interactions: BrookInteractionRuntime[];
  feedback: Phaser.GameObjects.Text;
  persistent: Phaser.GameObjects.Container | null;
  signature: string;
}

const INTERACTIONS: readonly BrookInteractionDefinition[] = [
  {
    id: 'echo-crystal-song',
    label: 'Echo’s crystal clue',
    actionLabel: 'Listen with Echo',
    position: { x: 2800, y: 1400 },
    radius: 130,
    icon: '🎵',
  },
  {
    id: 'crystal-grotto',
    label: 'Crystal Grotto',
    actionLabel: 'Go inside',
    position: { x: 3130, y: 1850 },
    radius: 155,
    icon: '💎',
  },
  {
    id: 'waterfall-mist',
    label: 'Waterfall Mist',
    actionLabel: 'Step into the mist',
    position: { x: 2470, y: 670 },
    radius: 145,
    icon: '🌈',
  },
  {
    id: 'reflection-pool',
    label: 'Reflection Pool',
    actionLabel: 'Look into the water',
    position: { x: 2150, y: 1650 },
    radius: 120,
    icon: '💧',
  },
  {
    id: 'stepping-chime',
    label: 'Stepping-Stone Bend',
    actionLabel: 'Try the stones',
    position: { x: 2320, y: 1370 },
    radius: 150,
    icon: '🪨',
  },
  {
    id: 'shallow-ripple',
    label: 'Shallow Brook',
    actionLabel: 'Splash',
    position: { x: 1900, y: 1260 },
    radius: 145,
    icon: '≈',
  },
  {
    id: 'singing-crystals',
    label: 'River crystal cluster',
    actionLabel: 'Tap a crystal',
    position: { x: 2380, y: 720 },
    radius: 145,
    icon: '🔷',
  },
  {
    id: 'shell-sparkle',
    label: 'Shell-sparkle bank',
    actionLabel: 'Search',
    position: { x: 1880, y: 800 },
    radius: 145,
    icon: '🐚',
  },
  {
    id: 'pebble-stack',
    label: 'Flat pebble pile',
    actionLabel: 'Stack',
    position: { x: 1160, y: 1290 },
    radius: 145,
    icon: '🪨',
  },
  {
    id: 'cascade-memory',
    label: 'Crystal Cascade overlook',
    actionLabel: 'Look towards the course',
    position: { x: 2540, y: 1060 },
    radius: 150,
    icon: '🏁',
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

export class CrystalBrookDepthWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly story = new CrystalGrottoStoryService(this.saveService, getBrowserQuestEngine());
  private readonly time = getBrowserAtmosphericTimeService(this.saveService);
  private readonly weather = getBrowserMagicalWeatherService(this.saveService);
  private state: BrookDepthState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('CrystalBrookScene');
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

    let nearest: BrookInteractionRuntime | null = null;
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

  private ensureState(scene: Phaser.Scene): BrookDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();

    const state: BrookDepthState = {
      scene,
      input: new WorldInteractionInput(scene),
      interactions: [],
      feedback: scene.add
        .text(640, 116, '', {
          color: '#435d66',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 760 },
          backgroundColor: '#f3fff8f2',
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
    state: BrookDepthState,
    definition: BrookInteractionDefinition,
  ): BrookInteractionRuntime {
    const glow = state.scene.add.circle(0, 0, 25, 0xb8f3ff, 0.07).setStrokeStyle(2, 0xffffff, 0.15);
    const icon = state.scene.add
      .text(0, 0, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
      })
      .setOrigin(0.5)
      .setAlpha(0.75);
    const prompt = state.scene.add
      .text(
        0,
        48,
        `${definition.actionLabel}: ${definition.label}  ·  ${WORLD_INTERACTION_PROMPT}`,
        {
          color: '#45616b',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          backgroundColor: '#f3fff8ed',
          padding: { x: 8, y: 5 },
        },
      )
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 180, 150);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon, prompt, zone])
      .setName(`brook-depth:${definition.id}`)
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
    state.scene.tweens.add({
      targets: [glow, icon],
      alpha: { from: 0.38, to: 0.86 },
      duration: 1080,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return { definition, container, prompt, zone };
  }

  private activate(state: BrookDepthState, definition: BrookInteractionDefinition): void {
    switch (definition.id) {
      case 'echo-crystal-song': {
        const result = this.story.talkToEcho();
        this.showFeedback(state, result.message);
        this.syncPersistent(state, true);
        return;
      }
      case 'crystal-grotto':
        if (this.story.isGrottoOpen()) {
          state.scene.scene.start('CrystalGrottoScene');
        } else {
          this.showFeedback(
            state,
            'The Prism Grotto trail ends at a cool crystal doorway. Echo has been listening nearby and may know how to open it.',
          );
        }
        return;
      case 'waterfall-mist':
        this.activateWaterfall(state);
        return;
      case 'reflection-pool':
        this.activateReflectionPool(state);
        return;
      case 'stepping-chime':
        this.activateSteppingChime(state);
        return;
      case 'shallow-ripple':
        state.scene.cameras.main.flash(70, 196, 241, 246, false);
        this.showFeedback(
          state,
          'Splish! The shallow water runs around your hooves and sends bright rings downstream. 💧',
        );
        return;
      case 'singing-crystals':
        state.scene.cameras.main.flash(75, 211, 248, 255, false);
        this.showFeedback(
          state,
          'Ping… pong… ting! Three river crystals answer one another, but the deeper Grotto sounds are richer still. 🔷',
        );
        return;
      case 'shell-sparkle':
        this.showFeedback(
          state,
          'A shell flashes under a smooth stone, then the water rolls it gently back into place. Not every shiny thing needs collecting. 🐚',
        );
        return;
      case 'pebble-stack':
        state.scene.cameras.main.shake(90, 0.0015);
        this.showFeedback(
          state,
          'One, two, three… wobble… four! The tiny pebble tower stays up. For now. 🪨',
        );
        return;
      case 'cascade-memory':
        this.showFeedback(state, this.cascadeMessage());
        return;
    }
  }

  private activateWaterfall(state: BrookDepthState): void {
    const specialLight = ['sunset', 'night'].includes(this.time.getState());
    const specialWeather = this.weather.getState() !== 'clear';
    if (!specialLight && !specialWeather) {
      this.showFeedback(
        state,
        'Cool mist drifts over the bank. Tiny drops glitter everywhere, as if they are waiting for different light.',
      );
      return;
    }
    const fresh = this.story.discoverWaterfallRainbow();
    this.showFeedback(
      state,
      fresh
        ? 'The mist catches the changed light and a tiny rainbow hangs above the bank without touching the ground. 🌈✨'
        : 'The little mist rainbow appears again, brighter at the edges and gone in a blink.',
    );
    state.scene.cameras.main.flash(100, 225, 248, 255, false);
  }

  private activateReflectionPool(state: BrookDepthState): void {
    const specialLight = ['sunset', 'night'].includes(this.time.getState());
    if (!specialLight) {
      this.showFeedback(
        state,
        'The pool is almost perfectly still. It reflects reeds, crystals and a patch of sky with suspicious neatness.',
      );
      return;
    }
    const fresh = this.story.discoverReflectionPool();
    this.showFeedback(
      state,
      fresh
        ? 'Tiny bright points appear in the still water. There are more reflected stars than there are stars overhead. ✨💧'
        : 'The extra reflected stars are still there, quietly refusing to explain themselves.',
    );
  }

  private activateSteppingChime(state: BrookDepthState): void {
    const fresh = this.story.discoverSteppingChime();
    state.scene.cameras.main.flash(65, 215, 247, 255, false);
    this.showFeedback(
      state,
      fresh
        ? 'Tap, plip, ting! Three flat stones make three different notes when the stream slips around them. A new Brook secret! 🪨🎵'
        : 'Tap, plip, ting! The stepping stones play their little three-note pattern again.',
    );
  }

  private cascadeMessage(): string {
    const record = this.saveService.load()?.activities.racesById[CRYSTAL_CASCADE_RACE_ID];
    if (!record || (!record.bestTimeMs && record.ribbonIds.length === 0)) {
      return 'The Crystal Cascade flags flicker beyond the water. The course is there whenever you fancy a run, but the Brook has plenty to do without racing.';
    }
    const best = record.bestTimeMs ? `${(record.bestTimeMs / 1000).toFixed(1)}s` : 'a finished run';
    return `The course flags recognise you now: ${best}, ${record.ribbonIds.length} saved ribbon${record.ribbonIds.length === 1 ? '' : 's'}. The Brook itself is still worth exploring. 🎀`;
  }

  private syncPersistent(state: BrookDepthState, force = false): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const signature = [
      save.world.flags[CRYSTAL_GROTTO_OPEN_FLAG] === true ? 'open' : '',
      save.world.flags[ECHO_CRYSTAL_SONG_COMPLETE_FLAG] === true ? 'song' : '',
      save.activities.racesById[CRYSTAL_CASCADE_RACE_ID]?.ribbonIds.length ?? 0,
    ].join('|');
    if (!force && signature === state.signature) {
      return;
    }

    state.signature = signature;
    state.persistent?.destroy(true);
    const objects: Phaser.GameObjects.GameObject[] = [];
    this.addGrottoEntrance(state.scene, objects, this.story.isGrottoOpen());
    this.addWaterfallLandmark(state.scene, objects);
    this.addReflectionPoolLandmark(state.scene, objects);
    state.persistent = state.scene.add
      .container(0, 0, objects)
      .setName('brook-depth:persistent-state')
      .setDepth(12);
  }

  private addGrottoEntrance(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    open: boolean,
  ): void {
    const rock = scene.add
      .ellipse(3130, 1810, 310, 230, 0x63848b, 1)
      .setStrokeStyle(8, 0x45646d, 0.95)
      .setDepth(7);
    const door = scene.add
      .ellipse(3130, 1845, 150, 170, open ? 0x365d70 : 0x506f76, 1)
      .setDepth(8)
      .setName('brook-depth:crystal-grotto-entrance');
    objects.push(rock, door);
    if (open) {
      objects.push(
        scene.add
          .text(3130, 1800, '✦  💎  ✦', {
            color: '#d6fbff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '26px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
    }
  }

  private addWaterfallLandmark(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
  ): void {
    objects.push(
      scene.add
        .rectangle(2470, 520, 145, 300, 0x8adfe5, 0.76)
        .setStrokeStyle(4, 0xd7fbff, 0.5)
        .setDepth(4)
        .setName('brook-depth:waterfall-mist-landmark'),
      scene.add.ellipse(2470, 670, 260, 110, 0xd7fbff, 0.18).setDepth(5),
    );
  }

  private addReflectionPoolLandmark(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
  ): void {
    objects.push(
      scene.add
        .ellipse(2150, 1650, 290, 125, 0x73cbd2, 0.8)
        .setStrokeStyle(4, 0xc7f4ef, 0.62)
        .setDepth(4)
        .setName('brook-depth:reflection-pool-landmark'),
    );
  }

  private showFeedback(state: BrookDepthState, message: string): void {
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

let browserCrystalBrookDepthWorldManager: CrystalBrookDepthWorldManager | null = null;

export function getCrystalBrookDepthWorldManager(game: Phaser.Game): CrystalBrookDepthWorldManager {
  browserCrystalBrookDepthWorldManager ??= new CrystalBrookDepthWorldManager(game);
  return browserCrystalBrookDepthWorldManager;
}

export function getCrystalBrookDepthQuestId(): string {
  return ECHO_CRYSTAL_SONG_QUEST_ID;
}
