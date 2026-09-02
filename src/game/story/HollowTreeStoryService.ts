import {
  HOLLOW_TREE_BRIDGE_ECHO_DISCOVERY_ID,
  HOLLOW_TREE_HEART_DISCOVERY_ID,
  HOLLOW_TREE_MARKS_DISCOVERY_ID,
  HOLLOW_TREE_NOOK_DISCOVERY_ID,
  HOLLOW_TREE_NOOK_OPEN_FLAG,
  PIP_HOLLOW_TREE_QUEST_ID,
} from '../../content/r6GladeHomeContent';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { getQuestStepId, type QuestEngine } from '../quests/QuestEngine';
import type { SaveService } from '../save/SaveService';

export type HollowTreeInspectState = 'started' | 'listen-bridge' | 'enter-nook' | 'complete';

export interface HollowTreeInspectResult {
  state: HollowTreeInspectState;
  message: string;
}

export class HollowTreeStoryService {
  private readonly discoveries: DiscoveryService;

  public constructor(
    private readonly saveService: SaveService,
    private readonly quests: QuestEngine,
    events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {
    this.discoveries = new DiscoveryService(saveService, events);
  }

  public inspectTree(): HollowTreeInspectResult {
    let progress = this.quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID);
    if (progress.status === 'not-started') {
      this.quests.startQuest(PIP_HOLLOW_TREE_QUEST_ID);
      this.discoveries.unlockDiscovery(HOLLOW_TREE_MARKS_DISCOVERY_ID);
      return {
        state: 'started',
        message:
          'Three spiral marks brighten inside the Hollow Tree. Pip trots over, squints at them, then points towards Moonflower Bridge: “They look like ripples. Maybe the water can answer them!” 🌀',
      };
    }

    progress = this.quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID);
    if (progress.status === 'completed') {
      return {
        state: 'complete',
        message: 'The Hollow Tree Nook is still open. Warm root-light glows just inside. 🌳',
      };
    }

    if (progress.currentStepId === getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 2)) {
      return {
        state: 'listen-bridge',
        message: 'The spiral marks are waiting for the matching sound beneath Moonflower Bridge.',
      };
    }

    if (progress.currentStepId === getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 3)) {
      this.discoveries.unlockDiscovery(HOLLOW_TREE_NOOK_DISCOVERY_ID);
      return {
        state: 'enter-nook',
        message:
          'The bridge echo matches the spiral marks. A root shifts aside and reveals a tiny doorway into the Hollow Tree Nook. ✨',
      };
    }

    if (progress.currentStepId === getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 5)) {
      return {
        state: 'enter-nook',
        message: 'The new little doorway is open. Something warm is glowing on a shelf inside.',
      };
    }

    return {
      state: this.isNookOpen() ? 'enter-nook' : 'listen-bridge',
      message: this.isNookOpen()
        ? 'The Hollow Tree Nook is open and softly glowing.'
        : 'The Hollow Tree is listening for the bridge echo.',
    };
  }

  public listenAtBridge(): boolean {
    const progress = this.quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 2)
    ) {
      return false;
    }

    this.discoveries.unlockDiscovery(HOLLOW_TREE_BRIDGE_ECHO_DISCOVERY_ID);
    return true;
  }

  public discoverHeartLight(): boolean {
    const progress = this.quests.getProgress(PIP_HOLLOW_TREE_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(PIP_HOLLOW_TREE_QUEST_ID, 5)
    ) {
      return false;
    }

    this.discoveries.unlockDiscovery(HOLLOW_TREE_HEART_DISCOVERY_ID);
    return true;
  }

  public isNookOpen(): boolean {
    const save = this.saveService.load();
    return save?.world.flags[HOLLOW_TREE_NOOK_OPEN_FLAG] === true;
  }
}
