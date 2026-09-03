import Phaser from 'phaser';
import {
  BEACH_RACE_ROUTE_READY_FLAG,
  BEACHCOMBING_BASICS_DISCOVERY_ID,
  BEACHCOMBING_READY_FLAG,
  CORAL_CHARACTER_ID,
  CORAL_SHELL_STORIES_ACTIVE_FLAG,
  CORAL_SHELL_STORIES_COMPLETE_FLAG,
  CORAL_SHELL_STORIES_QUEST_ID,
  DUNE_WIND_MARKER_DISCOVERY_ID,
  MOONLIT_BREEZE_DISCOVERY_ID,
  MOON_SPECKLE_SHELL_ITEM_ID,
  SHELL_STORY_CIRCLE_DISCOVERY_ID,
  SKIPPER_CHARACTER_ID,
  SKIPPER_FOLLOW_THE_WIND_QUEST_ID,
  SKIPPER_WIND_STORY_ACTIVE_FLAG,
  SUNRISE_SPIRAL_SHELL_ITEM_ID,
  WAVE_FAN_SHELL_ITEM_ID,
} from '../../content/r65StarlightBeach';
import { GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import {
  WorldInteractionInput,
  WORLD_INTERACTION_PROMPT,
} from '../interaction/WorldInteractionInput';
import { InventoryService } from '../inventory/InventoryService';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { SaveGame } from '../save/saveSchema';
import { worldDepthForY } from '../world/WorldDepth';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

interface BeachContentPoint {
  id: string;
  label: string;
  actionLabel: string;
  icon: string;
  x: number;
  y: number;
  radius: number;
  isAvailable: (save: SaveGame) => boolean;
}

interface BeachContentRuntime {
  definition: BeachContentPoint;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface BeachContentState {
  scene: Phaser.Scene;
  input: WorldInteractionInput;
  points: BeachContentRuntime[];
  feedback: Phaser.GameObjects.Text;
  feedbackTimer: Phaser.Time.TimerEvent | null;
  beachcombingCount: number;
}

const SCENE_KEY = 'StarlightBeachScene';
const SHELL_IDS = [
  SUNRISE_SPIRAL_SHELL_ITEM_ID,
  MOON_SPECKLE_SHELL_ITEM_ID,
  WAVE_FAN_SHELL_ITEM_ID,
] as const;

const BEACH_CONTENT_POINTS: readonly BeachContentPoint[] = [
  {
    id: 'coral-story-table',
    label: "Coral's shell table",
    actionLabel: 'Talk',
    icon: '🐚',
    x: 900,
    y: 1050,
    radius: 128,
    isAvailable: () => true,
  },
  {
    id: 'shell-story-circle',
    label: 'Shell story circle',
    actionLabel: 'Arrange',
    icon: '✨',
    x: 900,
    y: 820,
    radius: 126,
    isAvailable: (save) => save.world.flags[CORAL_SHELL_STORIES_ACTIVE_FLAG] === true,
  },
  {
    id: 'shell-story-display',
    label: 'Three-shell story',
    actionLabel: 'Remember',
    icon: '🐚',
    x: 900,
    y: 820,
    radius: 126,
    isAvailable: (save) => save.world.flags[CORAL_SHELL_STORIES_COMPLETE_FLAG] === true,
  },
  {
    id: 'skipper-route-sketch',
    label: "Skipper's route sketch",
    actionLabel: 'Talk',
    icon: '🪁',
    x: 2500,
    y: 1060,
    radius: 130,
    isAvailable: () => true,
  },
  {
    id: 'dune-wind-marker',
    label: 'Striped wind marker',
    actionLabel: 'Listen',
    icon: '🌬️',
    x: 2760,
    y: 920,
    radius: 124,
    isAvailable: (save) =>
      save.world.flags[SKIPPER_WIND_STORY_ACTIVE_FLAG] === true &&
      !save.collections.discoveryIds.includes(DUNE_WIND_MARKER_DISCOVERY_ID),
  },
  {
    id: 'moonlit-cross-breeze',
    label: 'Moonlit breeze',
    actionLabel: 'Feel',
    icon: '🌙',
    x: 3110,
    y: 1610,
    radius: 128,
    isAvailable: (save) =>
      save.world.flags[SKIPPER_WIND_STORY_ACTIVE_FLAG] === true &&
      save.collections.discoveryIds.includes(DUNE_WIND_MARKER_DISCOVERY_ID) &&
      !save.collections.discoveryIds.includes(MOONLIT_BREEZE_DISCOVERY_ID),
  },
  {
    id: 'beachcombing-basket',
    label: "Coral's beachcombing basket",
    actionLabel: 'Beachcomb',
    icon: '🔎',
    x: 1210,
    y: 1320,
    radius: 128,
    isAvailable: (save) => save.world.flags[BEACHCOMBING_READY_FLAG] === true,
  },
  {
    id: 'shoreline-route-board',
    label: 'Shoreline route board',
    actionLabel: 'Inspect',
    icon: '🏁',
    x: 2580,
    y: 820,
    radius: 132,
    isAvailable: (save) => save.world.flags[BEACH_RACE_ROUTE_READY_FLAG] === true,
  },
];

function findPlayer(scene: Phaser.Scene): { x: number; y: number } | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME) as
    | (Phaser.GameObjects.GameObject & Partial<{ x: number; y: number }>)
    | null;
  if (player && typeof player.x === 'number' && typeof player.y === 'number') {
    return { x: player.x, y: player.y };
  }
  return null;
}

function distance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Phaser.Math.Distance.Between(left.x, left.y, right.x, right.y);
}

export class StarlightBeachContentWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly discoveries = new DiscoveryService(this.saveService);
  private readonly inventory = new InventoryService(this.saveService);
  private readonly quests = getBrowserQuestEngine();
  private state: BeachContentState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene(SCENE_KEY);
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }

    const state = this.ensureState(scene);
    const player = findPlayer(scene);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    if (!player) {
      return;
    }

    let nearest: BeachContentRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const runtime of state.points) {
      const available = runtime.definition.isAvailable(save);
      runtime.container.setVisible(available);
      if (!available) {
        runtime.prompt.setVisible(false);
        continue;
      }
      const pointDistance = distance(player, runtime.container);
      runtime.prompt.setVisible(pointDistance <= runtime.definition.radius + 92);
      if (pointDistance <= runtime.definition.radius && pointDistance < nearestDistance) {
        nearest = runtime;
        nearestDistance = pointDistance;
      }
    }

    if (state.input.justPressed() && nearest) {
      this.activate(state, nearest.definition);
    }
  }

  private ensureState(scene: Phaser.Scene): BeachContentState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();

    const input = new WorldInteractionInput(scene);
    const feedback = scene.add
      .text(GAME_WIDTH / 2, 174, '', {
        color: '#4f5262',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9eaf2',
        padding: { x: 18, y: 11 },
        wordWrap: { width: 650 },
      })
      .setName('r6-5-beach-content-feedback')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20_100)
      .setVisible(false);

    const state: BeachContentState = {
      scene,
      input,
      points: [],
      feedback,
      feedbackTimer: null,
      beachcombingCount: 0,
    };

    for (const definition of BEACH_CONTENT_POINTS) {
      const plate = scene.add.circle(0, 0, 30, 0xfff3bd, 0.18).setStrokeStyle(2, 0xffffff, 0.28);
      const icon = scene.add
        .text(0, 0, definition.icon, { fontFamily: 'system-ui, sans-serif', fontSize: '28px' })
        .setOrigin(0.5);
      const prompt = scene.add
        .text(
          0,
          54,
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
      const zone = scene.add.zone(0, 0, 184, 156);
      const container = scene.add
        .container(definition.x, definition.y, [plate, icon, prompt, zone])
        .setName(`beach-content:${definition.id}`)
        .setDepth(worldDepthForY(definition.y + 18, 0.44));

      input.bindPointer(zone, () => {
        const currentSave = this.saveService.load() ?? this.saveService.createNewGame();
        const currentPlayer = findPlayer(scene);
        if (
          currentPlayer &&
          definition.isAvailable(currentSave) &&
          distance(currentPlayer, container) <= definition.radius
        ) {
          this.activate(state, definition);
        }
      });
      state.points.push({ definition, container, prompt });
    }

    this.state = state;
    return state;
  }

  private activate(state: BeachContentState, definition: BeachContentPoint): void {
    if (definition.id === 'coral-story-table') {
      this.talkToCoral(state);
      return;
    }
    if (definition.id === 'shell-story-circle') {
      this.arrangeShellStory(state);
      return;
    }
    if (definition.id === 'shell-story-display') {
      this.showFeedback(
        state,
        '🐚 Coral’s three-shell story: sunrise at the Cove, moonlight in the tide pools, then one last wave at Moonlit Point.',
      );
      return;
    }
    if (definition.id === 'skipper-route-sketch') {
      this.talkToSkipper(state);
      return;
    }
    if (definition.id === 'dune-wind-marker') {
      this.discoveries.unlockDiscovery(DUNE_WIND_MARKER_DISCOVERY_ID);
      this.showFeedback(
        state,
        '🌬️ The striped marker whistles and leans towards the sea. Skipper’s clue points all the way to Moonlit Point.',
      );
      return;
    }
    if (definition.id === 'moonlit-cross-breeze') {
      this.discoveries.unlockDiscovery(MOONLIT_BREEZE_DISCOVERY_ID);
      this.showFeedback(
        state,
        '🌙 Two breezes cross here. The grass bends one way while the little shells twitch the other. That must be Skipper’s second clue!',
      );
      return;
    }
    if (definition.id === 'beachcombing-basket') {
      this.useBeachcombingBasket(state);
      return;
    }

    this.showFeedback(
      state,
      '🏁 Skipper has pinned the dune marker and Moonlit Point onto one shoreline route. The idea is ready for the Rainbow Run crew to turn into a proper course later.',
    );
  }

  private talkToCoral(state: BeachContentState): void {
    const progress = this.quests.getProgress(CORAL_SHELL_STORIES_QUEST_ID);
    if (progress.status === 'not-started') {
      this.quests.startQuest(CORAL_SHELL_STORIES_QUEST_ID);
      this.quests.notifyCharacterTalked(CORAL_CHARACTER_ID);
      this.showFeedback(
        state,
        '🐚 Coral: “Three unusual shells keep turning up around the beach. Find the Sunrise Spiral, Moon-speckle and Wave-fan, then bring all three to my shell circle.”',
      );
      return;
    }
    if (progress.status === 'active') {
      const hasAllShells = SHELL_IDS.every((itemId) => this.inventory.getQuantity(itemId) > 0);
      const circleFound = this.discoveries.hasDiscovery(SHELL_STORY_CIRCLE_DISCOVERY_ID);
      if (circleFound) {
        this.quests.notifyCharacterTalked(CORAL_CHARACTER_ID);
        this.showFeedback(
          state,
          '🐚 Coral: “That arrangement is perfect. Keep the shells, they are yours. I have left the story circle here, and my beachcombing basket is ready whenever you want it.”',
        );
        return;
      }
      this.showFeedback(
        state,
        hasAllShells
          ? '🐚 Coral: “You found all three! Try arranging them in the glowing circle just above Shell Cove.”'
          : '🐚 Coral: “One shell is near the Cove, one likes the tide pools and one hides towards Moonlit Point. Bring all three to the shell circle.”',
      );
      return;
    }
    this.showFeedback(
      state,
      '🐚 Coral: “The three-shell story is still at the Cove, and Twinkle & Thread has copied its pattern onto a new ribbon.”',
    );
  }

  private arrangeShellStory(state: BeachContentState): void {
    const missing = SHELL_IDS.filter((itemId) => this.inventory.getQuantity(itemId) === 0);
    if (missing.length > 0) {
      this.showFeedback(
        state,
        `🐚 The circle has three spaces. ${missing.length} Starlight Shell${missing.length === 1 ? ' is' : 's are'} still missing. Nothing here needs to be traded away.`,
      );
      return;
    }
    if (!this.discoveries.hasDiscovery(SHELL_STORY_CIRCLE_DISCOVERY_ID)) {
      this.discoveries.unlockDiscovery(SHELL_STORY_CIRCLE_DISCOVERY_ID);
    }
    this.showFeedback(
      state,
      '✨ The Sunrise Spiral, Moon-speckle and Wave-fan make a tiny journey across the sand. Coral will want to see this.',
    );
  }

  private talkToSkipper(state: BeachContentState): void {
    const progress = this.quests.getProgress(SKIPPER_FOLLOW_THE_WIND_QUEST_ID);
    if (progress.status === 'not-started') {
      this.quests.startQuest(SKIPPER_FOLLOW_THE_WIND_QUEST_ID);
      this.quests.notifyCharacterTalked(SKIPPER_CHARACTER_ID);
      this.showFeedback(
        state,
        '🪁 Skipper: “Help me test a shoreline route! Start with the striped marker in Star Dunes. If it whistles, follow the breeze to Moonlit Point.”',
      );
      return;
    }
    if (progress.status === 'active') {
      const firstFound = this.discoveries.hasDiscovery(DUNE_WIND_MARKER_DISCOVERY_ID);
      const secondFound = this.discoveries.hasDiscovery(MOONLIT_BREEZE_DISCOVERY_ID);
      if (secondFound) {
        this.quests.notifyCharacterTalked(SKIPPER_CHARACTER_ID);
        this.showFeedback(
          state,
          '🪁 Skipper: “Yes! Dunes to Moonlit Point works. I have put up a route board so we remember it when the Beach gets a proper race.”',
        );
        return;
      }
      this.showFeedback(
        state,
        firstFound
          ? '🪁 Skipper: “The marker chose the sea breeze. Follow it to Moonlit Point and look for the place where two breezes meet.”'
          : '🪁 Skipper: “The striped wind marker is high in Star Dunes. Listen for the one that whistles.”',
      );
      return;
    }
    this.showFeedback(
      state,
      '🪁 Skipper: “The route board is staying right here. Dunes, shoreline, Moonlit Point. Very wiggly. Very promising.”',
    );
  }

  private useBeachcombingBasket(state: BeachContentState): void {
    const firstUse = !this.discoveries.hasDiscovery(BEACHCOMBING_BASICS_DISCOVERY_ID);
    if (firstUse) {
      this.discoveries.unlockDiscovery(BEACHCOMBING_BASICS_DISCOVERY_ID);
    }
    const messages = [
      '🔎 You look slowly along the tideline and spot three different shell trails. You leave the tiny living creatures exactly where they are.',
      '🔎 The tide has moved a ribbon of smooth pebbles since your last look. Nothing needs collecting for it to be interesting.',
      '🔎 A little crab track crosses the damp sand and disappears beside a tide pool. Coral calls that a very good beachcombing result.',
    ];
    const message = firstUse
      ? '🔎 Coral’s rule: look slowly, leave living things alone and notice what the tide changed. Beachcombing is now in your Wonderbook.'
      : messages[state.beachcombingCount % messages.length];
    state.beachcombingCount += 1;
    this.showFeedback(state, message);
  }

  private showFeedback(state: BeachContentState, message: string): void {
    state.feedbackTimer?.destroy();
    state.feedback.setText(message).setVisible(true);
    state.feedbackTimer = state.scene.time.delayedCall(3900, () => {
      if (state.feedback.active) {
        state.feedback.setVisible(false);
      }
      state.feedbackTimer = null;
    });
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    this.state.feedbackTimer?.destroy();
    for (const runtime of this.state.points) {
      runtime.container.destroy(true);
    }
    this.state.feedback.destroy();
    this.state.input.destroy();
    this.state = null;
  }
}

let browserStarlightBeachContentWorldManager: StarlightBeachContentWorldManager | null = null;

export function getStarlightBeachContentWorldManager(
  game: Phaser.Game,
): StarlightBeachContentWorldManager {
  browserStarlightBeachContentWorldManager ??= new StarlightBeachContentWorldManager(game);
  return browserStarlightBeachContentWorldManager;
}
