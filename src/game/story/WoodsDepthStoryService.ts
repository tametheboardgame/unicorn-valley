import { FIREFLY_LANTERN_KEEPER_DISCOVERY_ID } from '../../content/r5FireflyLantern';
import {
  ANCIENT_FRIENDLY_TREE_DISCOVERY_ID,
  FERN_FIREFLY_WAY_COMPLETE_FLAG,
  FERN_FIREFLY_WAY_QUEST_ID,
  FERN_LIGHT_TRAIL_DISCOVERY_ID,
  FIREFLY_GROVE_DISCOVERY_ID,
  FIREFLY_GROVE_HEART_DISCOVERY_ID,
  FIREFLY_GROVE_LIT_FLAG,
  FIREFLY_GROVE_OPEN_FLAG,
  HIDDEN_LEAF_PATH_DISCOVERY_ID,
  HOLLOW_LOG_PEEK_DISCOVERY_ID,
  LITTLE_MOSS_TAIL_DISCOVERY_ID,
  MUSHROOM_RING_DISCOVERY_ID,
  TINY_TRACKS_COMPLETE_FLAG,
  TINY_TRACKS_DISCOVERY_ID,
  TINY_TRACKS_QUEST_ID,
  WOODS_LIGHT_TRAIL_FLAG,
} from '../../content/r6WhisperingWoodsDepthContent';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { getQuestStepId, type QuestEngine } from '../quests/QuestEngine';
import type { SaveService } from '../save/SaveService';

export type FernStoryState =
  | 'started'
  | 'follow-light-trail'
  | 'visit-ancient-tree'
  | 'find-grove-heart'
  | 'complete';

export interface FernStoryResult {
  state: FernStoryState;
  message: string;
}

export class WoodsDepthStoryService {
  private readonly discoveries: DiscoveryService;

  public constructor(
    private readonly saveService: SaveService,
    private readonly quests: QuestEngine,
    events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {
    this.discoveries = new DiscoveryService(saveService, events);
  }

  public talkToFern(): FernStoryResult {
    let progress = this.quests.getProgress(FERN_FIREFLY_WAY_QUEST_ID);
    if (progress.status === 'not-started') {
      this.quests.startQuest(FERN_FIREFLY_WAY_QUEST_ID);
      this.discoveries.unlockDiscovery(FIREFLY_GROVE_DISCOVERY_ID);
      return {
        state: 'started',
        message:
          'Fern points beyond Lantern Clearing. “Those fireflies keep waiting for us instead of flying away. Follow the patient lights first, then see what they are trying to show us.” ✨🌿',
      };
    }

    progress = this.quests.getProgress(FERN_FIREFLY_WAY_QUEST_ID);
    if (progress.status === 'completed') {
      return {
        state: 'complete',
        message:
          'Fern watches the permanent light trail. “They remember the way now. Even when the Woods changes, those little lights keep the Grove feeling close.”',
      };
    }

    if (progress.currentStepId === getQuestStepId(FERN_FIREFLY_WAY_QUEST_ID, 3)) {
      return {
        state: 'follow-light-trail',
        message:
          'Fern: “Start at Lantern Clearing. The fireflies that hover in a tidy line are the ones we want.”',
      };
    }
    if (progress.currentStepId === getQuestStepId(FERN_FIREFLY_WAY_QUEST_ID, 4)) {
      return {
        state: 'visit-ancient-tree',
        message:
          'Fern: “The lights stopped beside the oldest friendly-looking tree. Give its bark a gentle touch and listen.”',
      };
    }
    return {
      state: 'find-grove-heart',
      message:
        'Fern: “One last clue. Inside Firefly Grove there is a lantern plant the lights keep circling. I think that is what they wanted us to find.”',
    };
  }

  public followFernLightTrail(): boolean {
    return this.unlockFernStep(FERN_LIGHT_TRAIL_DISCOVERY_ID, 3);
  }

  public greetAncientTree(): boolean {
    return this.unlockFernStep(ANCIENT_FRIENDLY_TREE_DISCOVERY_ID, 4);
  }

  public discoverGroveHeart(): boolean {
    return this.unlockFernStep(FIREFLY_GROVE_HEART_DISCOVERY_ID, 5);
  }

  public beginTinyTracks(): boolean {
    const progress = this.quests.getProgress(TINY_TRACKS_QUEST_ID);
    if (progress.status !== 'not-started') {
      return false;
    }
    this.quests.startQuest(TINY_TRACKS_QUEST_ID);
    this.discoveries.unlockDiscovery(TINY_TRACKS_DISCOVERY_ID);
    return true;
  }

  public inspectHollowLog(): boolean {
    return this.unlockTinyTracksStep(HOLLOW_LOG_PEEK_DISCOVERY_ID, 2);
  }

  public spotLittleMossTail(): boolean {
    return this.unlockTinyTracksStep(LITTLE_MOSS_TAIL_DISCOVERY_ID, 3);
  }

  public discoverMushroomRing(): boolean {
    return this.unlockOnce(MUSHROOM_RING_DISCOVERY_ID);
  }

  public discoverHiddenLeafPath(): boolean {
    return this.unlockOnce(HIDDEN_LEAF_PATH_DISCOVERY_ID);
  }

  public hasLanternKeeperAchievement(): boolean {
    return this.discoveries.hasDiscovery(FIREFLY_LANTERN_KEEPER_DISCOVERY_ID);
  }

  public isGroveOpen(): boolean {
    return this.saveService.load()?.world.flags[FIREFLY_GROVE_OPEN_FLAG] === true;
  }

  public isGroveLit(): boolean {
    return this.saveService.load()?.world.flags[FIREFLY_GROVE_LIT_FLAG] === true;
  }

  public hasPermanentLightTrail(): boolean {
    return this.saveService.load()?.world.flags[WOODS_LIGHT_TRAIL_FLAG] === true;
  }

  public isFernStoryComplete(): boolean {
    return this.saveService.load()?.world.flags[FERN_FIREFLY_WAY_COMPLETE_FLAG] === true;
  }

  public isTinyTracksComplete(): boolean {
    return this.saveService.load()?.world.flags[TINY_TRACKS_COMPLETE_FLAG] === true;
  }

  private unlockFernStep(
    discoveryId: Parameters<DiscoveryService['unlockDiscovery']>[0],
    stepIndex: number,
  ): boolean {
    const progress = this.quests.getProgress(FERN_FIREFLY_WAY_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(FERN_FIREFLY_WAY_QUEST_ID, stepIndex)
    ) {
      return false;
    }
    this.discoveries.unlockDiscovery(discoveryId);
    return true;
  }

  private unlockTinyTracksStep(
    discoveryId: Parameters<DiscoveryService['unlockDiscovery']>[0],
    stepIndex: number,
  ): boolean {
    const progress = this.quests.getProgress(TINY_TRACKS_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(TINY_TRACKS_QUEST_ID, stepIndex)
    ) {
      return false;
    }
    this.discoveries.unlockDiscovery(discoveryId);
    return true;
  }

  private unlockOnce(discoveryId: Parameters<DiscoveryService['unlockDiscovery']>[0]): boolean {
    if (this.discoveries.hasDiscovery(discoveryId)) {
      return false;
    }
    this.discoveries.unlockDiscovery(discoveryId);
    return true;
  }
}
