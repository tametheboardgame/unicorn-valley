import Phaser from 'phaser';
import { PEBBLE_FOUNTAIN_REPAIRED_FLAG } from '../../content/r4PebbleStory';
import {
  TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
  TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
} from '../../content/r6VillageContent';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { DiscoveryService } from '../discovery/DiscoveryService';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';
import { SUNBEAM_VILLAGE_LAYOUT } from './SunbeamVillageLayout';
import { worldDepthForY } from './WorldDepth';

interface VillageLifePoint {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  x: number;
  y: number;
  radius: number;
  createProp: (scene: Phaser.Scene) => Phaser.GameObjects.GameObject[];
}

interface VillageLifeRuntime {
  definition: VillageLifePoint;
  container: Phaser.GameObjects.Container;
}

interface VillageLifeState {
  scene: Phaser.Scene;
  points: VillageLifeRuntime[];
}

const REGISTRY_OWNER = 'village-life';
const VILLAGE_POINTS: readonly VillageLifePoint[] = [
  {
    id: 'notice-board',
    label: 'Village notice board',
    actionLabel: 'Read',
    actionKind: 'inspect',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.noticeBoard.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.noticeBoard.y,
    radius: 122,
    createProp: (scene) => [
      scene.add.ellipse(0, 46, 174, 72, 0x7eb66d, 0.26),
      scene.add.rectangle(-42, 50, 12, 86, 0x795641, 1),
      scene.add.rectangle(42, 50, 12, 86, 0x795641, 1),
      scene.add.rectangle(0, 0, 126, 96, 0x9a684c, 1).setStrokeStyle(5, 0x6e4939, 0.95),
      scene.add.rectangle(0, -2, 102, 70, 0xffedbd, 1).setStrokeStyle(2, 0xd8a76d, 0.9),
      scene.add
        .text(0, -4, '📌  ✦  📜', { fontFamily: 'system-ui, sans-serif', fontSize: '20px' })
        .setOrigin(0.5),
      scene.add.circle(-66, 48, 9, 0xf2a2b8, 0.9),
      scene.add.circle(66, 48, 9, 0xf3cc70, 0.9),
    ],
  },
  {
    id: 'sundial',
    label: 'Sunny little sundial',
    actionLabel: 'Inspect',
    actionKind: 'inspect',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.sundial.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.sundial.y,
    radius: 118,
    createProp: (scene) => [
      scene.add.ellipse(0, 34, 148, 76, 0xd9c58f, 0.34).setStrokeStyle(3, 0xb69b67, 0.42),
      scene.add.rectangle(0, 18, 36, 54, 0xc7a76a, 1).setStrokeStyle(3, 0x8d7048, 0.88),
      scene.add.ellipse(0, -8, 108, 48, 0xe0b15e, 1).setStrokeStyle(4, 0xb17d43, 0.9),
      scene.add.triangle(0, -42, 0, 48, 18, 0, 36, 48, 0x8d6845, 1).setOrigin(0.5, 1),
      scene.add
        .text(0, -7, '☀', {
          color: '#fff0aa',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
        })
        .setOrigin(0.5),
    ],
  },
  {
    id: 'bench',
    label: 'Village bench',
    actionLabel: 'Sit',
    actionKind: 'interact',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.bench.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.bench.y,
    radius: 118,
    createProp: (scene) => [
      scene.add.ellipse(0, 48, 192, 64, 0x709d62, 0.18),
      scene.add.rectangle(0, 8, 150, 28, 0xb97855, 1).setStrokeStyle(3, 0x80503e, 0.9),
      scene.add.rectangle(0, -22, 150, 18, 0xc58a62, 1).setStrokeStyle(3, 0x80503e, 0.9),
      scene.add.rectangle(-58, 34, 12, 48, 0x80503e, 1),
      scene.add.rectangle(58, 34, 12, 48, 0x80503e, 1),
      scene.add.circle(-88, 42, 8, 0x91c77b, 0.88),
      scene.add.circle(88, 42, 8, 0x91c77b, 0.88),
    ],
  },
  {
    id: 'thread-window',
    label: 'Twinkle & Thread window',
    actionLabel: 'Look',
    actionKind: 'inspect',
    x: SUNBEAM_VILLAGE_LAYOUT.villageLife.threadWindow.x,
    y: SUNBEAM_VILLAGE_LAYOUT.villageLife.threadWindow.y,
    radius: 116,
    // The display itself is now a child of the Twinkle & Thread facade. Village Life owns only
    // the nearby inspect target so it cannot drift away from the authored shop frontage again.
    createProp: () => [],
  },
  {
    id: 'fountain-splash',
    label: 'Sunbeam Fountain water',
    actionLabel: 'Splash',
    actionKind: 'interact',
    x: SUNBEAM_VILLAGE_LAYOUT.fountain.x,
    y: SUNBEAM_VILLAGE_LAYOUT.fountain.y,
    radius: 145,
    // The fountain already communicates water visually. Keep only the interaction anchor instead
    // of adding a detached droplet marker on top of the plaza.
    createProp: () => [],
  },
];

export class VillageLifeWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly discoveryService = new DiscoveryService(this.saveService);
  private readonly timeService = getBrowserAtmosphericTimeService(this.saveService);
  private state: VillageLifeState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('SunbeamVillageScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }
    this.ensureState(scene);
  }

  private ensureState(scene: Phaser.Scene): VillageLifeState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();
    const state: VillageLifeState = { scene, points: [] };
    for (const definition of VILLAGE_POINTS) {
      const container = scene.add
        .container(definition.x, definition.y, definition.createProp(scene))
        .setName(`village-life:${definition.id}`)
        .setDepth(worldDepthForY(definition.y + 24, 0.3));
      state.points.push({ definition, container });
    }
    this.state = state;
    this.publishTargets(state);
    return state;
  }

  private publishTargets(state: VillageLifeState): void {
    const targets: InteractionTarget[] = state.points.map(({ definition, container }) => ({
      id: `interaction:village-life:${definition.id}`,
      label: definition.label,
      actionLabel: definition.actionLabel,
      actionKind: definition.actionKind,
      position: { x: definition.x, y: definition.y },
      interactionRadius: definition.radius,
      priority: 10,
      visible: () => container.active,
      result: {
        type: 'callback',
        activate: () => this.activate(state, definition),
      },
    }));
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private activate(state: VillageLifeState, definition: VillageLifePoint): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const hunting = save.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG] === true;
    const noticeFound = this.discoveryService.hasDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
    const bakeryFound = this.discoveryService.hasDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID);
    const sundialFound = this.discoveryService.hasDiscovery(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);

    if (definition.id === 'notice-board') {
      if (hunting && !noticeFound) {
        this.discoveryService.unlockDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID);
        this.showFeedback(
          state,
          definition,
          '🗺️ Map corner found! It was tucked behind a notice about a missing purple mitten.',
        );
        return;
      }
      const repaired = save.world.flags[PEBBLE_FOUNTAIN_REPAIRED_FLAG] === true;
      const timeState = this.timeService.getState();
      const contextualNotice =
        timeState === 'night'
          ? 'Lantern reminder: please keep the east path clear after moonrise.'
          : timeState === 'sunset'
            ? 'Sunset picnic blankets are available beside the Bakery while supplies last.'
            : timeState === 'morning'
              ? 'Morning notice: fresh buns, garden watering and Rainbow Run practice today.'
              : 'Afternoon notice: playground games and a Story House reading circle are underway.';
      const fountainNotice = repaired
        ? 'Pebble reports that the Sunbeam Fountain is happily chiming again.'
        : 'Pebble is still collecting odd little parts for the quiet Sunbeam Fountain.';
      this.showFeedback(state, definition, `📌 ${contextualNotice} ${fountainNotice}`);
      return;
    }

    if (definition.id === 'sundial') {
      if (hunting && noticeFound && bakeryFound && !sundialFound) {
        this.discoveryService.unlockDiscovery(TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID);
        this.showFeedback(
          state,
          definition,
          '🗺️ Final map corner found! It was wedged beneath the sundial where the breeze could not steal it again.',
        );
        return;
      }
      const sundialMessage = {
        morning: '🌤️ The short morning shadow leans west. Sunbeam is only just getting busy.',
        afternoon: '☀️ The sundial shadow is tucked close to its marker. The square is bright and bustling.',
        sunset: '🌅 The long shadow reaches east as warm sunset light washes across the plaza.',
        night: '🌙 There is no useful shadow now. Tiny moonlit marks around the rim glimmer instead.',
      }[this.timeService.getState()];
      this.showFeedback(state, definition, sundialMessage);
      return;
    }

    if (definition.id === 'bench') {
      this.showFeedback(
        state,
        definition,
        '🪑 You sit for a moment. From here you can see the Bakery, the fountain and unicorns crossing the square.',
      );
      return;
    }
    if (definition.id === 'thread-window') {
      this.showFeedback(
        state,
        definition,
        '🎀 The window has a starter bow beside two empty stands labelled “More treasures appear as your adventures grow.”',
      );
      return;
    }

    const repaired = save.world.flags[PEBBLE_FOUNTAIN_REPAIRED_FLAG] === true;
    this.showFeedback(
      state,
      definition,
      repaired
        ? '✨ Chime! Pebble’s repaired fountain answers with a bright shimmer and a ring of rainbow sparkles.'
        : '💦 Splash! The quiet fountain sends three tiny rainbow fish-shaped sparkles into the air.',
    );
    if (repaired) {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        const sparkle = state.scene.add
          .text(definition.x, definition.y, '✦', {
            color: '#fff0a8',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(worldDepthForY(definition.y + 36, 0.9));
        state.scene.tweens.add({
          targets: sparkle,
          x: definition.x + Math.cos(angle) * 94,
          y: definition.y + Math.sin(angle) * 58 - 24,
          alpha: 0,
          duration: 620,
          ease: 'Quad.Out',
          onComplete: () => sparkle.destroy(),
        });
      }
    }
    state.scene.cameras.main.flash(90, 255, 238, 164, false);
  }

  private showFeedback(
    state: VillageLifeState,
    definition: VillageLifePoint,
    message: string,
  ): void {
    getWorldFeedbackPresenter(state.scene).showReaction(
      message,
      { x: definition.x, y: definition.y },
      3300,
    );
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const runtime of this.state.points) {
      runtime.container.destroy(true);
    }
    this.state = null;
  }
}

let browserVillageLifeWorldManager: VillageLifeWorldManager | null = null;

export function getVillageLifeWorldManager(game: Phaser.Game): VillageLifeWorldManager {
  browserVillageLifeWorldManager ??= new VillageLifeWorldManager(game);
  return browserVillageLifeWorldManager;
}
