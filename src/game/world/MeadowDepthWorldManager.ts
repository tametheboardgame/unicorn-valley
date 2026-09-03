import Phaser from 'phaser';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import {
  BREEZE_WINDMILL_QUEST_ID,
  MEADOW_FLOWER_CIRCLE_DISCOVERY_ID,
  MEADOW_FLOWER_CIRCLE_REVEALED_FLAG,
  WINDMILL_LOOKOUT_OPEN_FLAG,
} from '../../content/r6MeadowRunContent';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import { DiscoveryService } from '../discovery/DiscoveryService';
import {
  WorldInteractionInput,
  WORLD_INTERACTION_PROMPT,
} from '../interaction/WorldInteractionInput';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { MeadowWindmillStoryService } from '../story/MeadowWindmillStoryService';
import { worldDepthForY } from './WorldDepth';
import { WORLD_PLAYER_NAME } from './WorldTraversalPolishManager';

interface Point {
  x: number;
  y: number;
}

interface MeadowInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  position: Point;
  radius: number;
  icon: string;
}

interface MeadowInteractionRuntime {
  definition: MeadowInteractionDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
}

interface MeadowDepthState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  interactions: MeadowInteractionRuntime[];
  feedback: Phaser.GameObjects.Text;
  persistent: Phaser.GameObjects.Container | null;
  signature: string;
}

const FIXED_INTERACTIONS: readonly MeadowInteractionDefinition[] = [
  {
    id: 'windmill-story',
    label: 'Breeze’s wind ribbon',
    actionLabel: 'Look',
    position: { x: 1130, y: 465 },
    radius: 130,
    icon: '🎐',
  },
  {
    id: 'windmill-bell',
    label: 'Windmill bell',
    actionLabel: 'Ring',
    position: { x: 1280, y: 435 },
    radius: 135,
    icon: '🔔',
  },
  {
    id: 'windmill-lookout',
    label: 'Windmill Lookout',
    actionLabel: 'Go up',
    position: { x: 1395, y: 425 },
    radius: 145,
    icon: '🌬️',
  },
  {
    id: 'rainbow-pond',
    label: 'Rainbow Pond',
    actionLabel: 'Splash / watch',
    position: { x: 1570, y: 710 },
    radius: 130,
    icon: '🐸',
  },
  {
    id: 'picnic-hill',
    label: 'Picnic Hill',
    actionLabel: 'Sit and look',
    position: { x: 1760, y: 1490 },
    radius: 150,
    icon: '🧺',
  },
  {
    id: 'petal-patch',
    label: 'Bouncy flower patch',
    actionLabel: 'Brush past',
    position: { x: 920, y: 1240 },
    radius: 135,
    icon: '🌸',
  },
  {
    id: 'flower-circle',
    label: 'Quiet flower circle',
    actionLabel: 'Look closely',
    position: { x: 650, y: 1360 },
    radius: 150,
    icon: '🌼',
  },
  {
    id: 'butterfly-parade',
    label: 'Meadow butterflies',
    actionLabel: 'Follow',
    position: { x: 790, y: 1320 },
    radius: 145,
    icon: '🦋',
  },
  {
    id: 'run-poster',
    label: 'Rainbow Run course poster',
    actionLabel: 'Look',
    position: { x: 2860, y: 825 },
    radius: 145,
    icon: '🏁',
  },
  {
    id: 'ribbon-record',
    label: 'Ribbon Board',
    actionLabel: 'Check record',
    position: { x: 2510, y: 1260 },
    radius: 150,
    icon: '🎀',
  },
  {
    id: 'cup-board',
    label: 'Rainbow Cup board',
    actionLabel: 'Peek',
    position: { x: 2840, y: 1465 },
    radius: 150,
    icon: '🏆',
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
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    let nearest: MeadowInteractionRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const runtime of state.interactions) {
      const pointDistance = distance(player, runtime.definition.position);
      const inInteractionRange = pointDistance <= runtime.definition.radius;
      runtime.prompt.setVisible(pointDistance <= runtime.definition.radius + 78);
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

  private ensureState(scene: Phaser.Scene): MeadowDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();

    const state: MeadowDepthState = {
      scene,
      input: new WorldInteractionInput(scene),
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
    const prompt = state.scene.add
      .text(
        0,
        48,
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
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 180, 150);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon, prompt, zone])
      .setName(`meadow-depth:${definition.id}`)
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
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return { definition, container, prompt, zone };
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
          'The hill is just high enough for a good view and just flat enough for a picnic. The Rainbow Run flags wiggle in the distance. 🧺',
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
      case 'run-poster':
        this.showFeedback(
          state,
          'The poster shows Sunrise Sprint with space underneath for more course cards. A gold strip reads: “Rainbow Cup events gather here.” 🏁',
        );
        return;
      case 'ribbon-record':
        this.showFeedback(state, this.raceRecordMessage());
        return;
      case 'cup-board':
        this.showFeedback(
          state,
          'The Rainbow Cup board has five bright course spaces and a friendly note: “Every finish counts. Best times are just for fun.” More events will arrive here as the valley grows. 🏆',
        );
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

  private raceRecordMessage(): string {
    const save = this.saveService.load();
    const records = Object.values(save?.activities.racesById ?? {});
    const ribbons = records.reduce((total, record) => total + record.ribbonIds.length, 0);
    const sunrise = save?.activities.racesById[SUNRISE_SPRINT_RACE_ID];
    if (ribbons === 0 && !sunrise?.bestTimeMs) {
      return 'The polished board has empty ribbon hooks waiting for your first finishes. Every completed run will leave something here.';
    }
    const best = sunrise?.bestTimeMs
      ? `${(sunrise.bestTimeMs / 1000).toFixed(1)}s`
      : 'not timed yet';
    return `Your racing corner is growing: ${ribbons} ribbon${ribbons === 1 ? '' : 's'} recorded across the valley. Sunrise Sprint best: ${best}. 🎀`;
  }

  private syncPersistent(state: MeadowDepthState, force = false): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const raceRecords = Object.values(save.activities.racesById);
    const ribbonCount = raceRecords.reduce((total, record) => total + record.ribbonIds.length, 0);
    const signature = [
      save.world.flags[WINDMILL_LOOKOUT_OPEN_FLAG] === true ? 'lookout' : '',
      save.world.flags[MEADOW_FLOWER_CIRCLE_REVEALED_FLAG] === true ? 'circle' : '',
      this.story.isStoryComplete() ? 'windmill-complete' : '',
      ribbonCount,
    ].join('|');
    if (!force && signature === state.signature) {
      return;
    }

    state.signature = signature;
    state.persistent?.destroy(true);
    const objects: Phaser.GameObjects.GameObject[] = [];
    this.addWindmillVisual(state.scene, objects, this.story.isLookoutOpen());
    this.addPicnicHillVisual(state.scene, objects);
    this.addFlowerCircleVisual(
      state.scene,
      objects,
      save.world.flags[MEADOW_FLOWER_CIRCLE_REVEALED_FLAG] === true,
    );
    this.addRaceHubEvidence(state.scene, objects, ribbonCount);
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
    const tower = scene.add
      .rectangle(1280, 275, 130, 250, 0xe7d09a, 1)
      .setStrokeStyle(7, 0x9a7455, 0.95)
      .setDepth(7);
    const roof = scene.add.triangle(1280, 115, 0, 80, 78, 0, 156, 80, 0xbb7d68, 1).setDepth(8);
    const hub = scene.add.circle(1280, 205, 21, 0xf2c85f, 1).setDepth(10);
    objects.push(tower, roof, hub);

    for (const angle of [0, 45, 90, 135]) {
      objects.push(
        scene.add
          .rectangle(1280, 205, 10, 178, 0xfff0c9, 1)
          .setAngle(angle)
          .setStrokeStyle(2, 0xb68c61, 0.75)
          .setDepth(9),
      );
    }

    const label = scene.add
      .text(1280, 84, 'WINDMILL LOOKOUT', {
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
      steps.moveTo(1280, 440);
      steps.lineTo(1395, 425);
      steps.strokePath();
      objects.push(steps);
    }
  }

  private addPicnicHillVisual(scene: Phaser.Scene, objects: Phaser.GameObjects.GameObject[]): void {
    objects.push(
      scene.add.ellipse(1760, 1465, 520, 170, 0xb4e69a, 0.5).setDepth(2),
      scene.add
        .text(1760, 1510, 'PICNIC HILL', {
          color: '#5c6753',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          backgroundColor: '#fff9dfd6',
          padding: { x: 9, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(8)
        .setName('meadow-depth:picnic-hill-landmark'),
    );
  }

  private addFlowerCircleVisual(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    revealed: boolean,
  ): void {
    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      const flower = scene.add
        .text(650 + Math.cos(angle) * 95, 1360 + Math.sin(angle) * 58, revealed ? '🌼' : '·', {
          color: '#fff4ac',
          fontFamily: 'system-ui, sans-serif',
          fontSize: revealed ? '20px' : '18px',
        })
        .setOrigin(0.5)
        .setAlpha(revealed ? 0.88 : 0.28)
        .setDepth(6);
      objects.push(flower);
    }
  }

  private addRaceHubEvidence(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    ribbonCount: number,
  ): void {
    const visibleRibbons = Math.min(6, ribbonCount);
    for (let index = 0; index < visibleRibbons; index += 1) {
      objects.push(
        scene.add
          .text(
            2445 + (index % 3) * 62,
            1375 + Math.floor(index / 3) * 42,
            index % 2 === 0 ? '🎀' : '🏅',
            {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '24px',
            },
          )
          .setOrigin(0.5)
          .setDepth(12),
      );
    }

    const cupBoard = scene.add
      .rectangle(2840, 1565, 320, 150, 0x8a684c, 0.96)
      .setStrokeStyle(7, 0xf1ce77, 0.9)
      .setDepth(9)
      .setName('meadow-depth:rainbow-cup-board');
    const cupTitle = scene.add
      .text(2840, 1525, '🏆 RAINBOW CUP', {
        color: '#fff3ba',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);
    const slots = scene.add
      .text(2840, 1580, '●  ○  ○  ○  ○', {
        color: ribbonCount > 0 ? '#fff0a8' : '#d8c79d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);
    objects.push(cupBoard, cupTitle, slots);
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
    for (const runtime of this.state.interactions) {
      runtime.container.destroy(true);
    }
    this.state.persistent?.destroy(true);
    this.state.feedback.destroy();
    this.state.input.destroy();
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
