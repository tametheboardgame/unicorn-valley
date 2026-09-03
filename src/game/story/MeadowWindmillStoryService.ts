import {
  BREEZE_WINDMILL_COMPLETE_FLAG,
  BREEZE_WINDMILL_QUEST_ID,
  MEADOW_BUTTERFLY_PARADE_DISCOVERY_ID,
  MEADOW_FLOWER_CIRCLE_DISCOVERY_ID,
  MEADOW_FLOWER_CIRCLE_REVEALED_FLAG,
  MEADOW_RAINBOW_REFLECTION_DISCOVERY_ID,
  WINDMILL_LOOKOUT_DISCOVERY_ID,
  WINDMILL_LOOKOUT_OPEN_FLAG,
  WINDMILL_SKY_GLINT_DISCOVERY_ID,
  WINDMILL_WHISPER_DISCOVERY_ID,
} from '../../content/r6MeadowRunContent';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { getQuestStepId, type QuestEngine } from '../quests/QuestEngine';
import type { SaveService } from '../save/SaveService';

export type WindmillStoryState =
  | 'started'
  | 'find-bell'
  | 'lookout-open'
  | 'find-sky-glint'
  | 'complete';

export interface WindmillStoryResult {
  state: WindmillStoryState;
  message: string;
}

export class MeadowWindmillStoryService {
  private readonly discoveries: DiscoveryService;

  public constructor(
    private readonly saveService: SaveService,
    private readonly quests: QuestEngine,
    events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {
    this.discoveries = new DiscoveryService(saveService, events);
  }

  public talkToBreeze(): WindmillStoryResult {
    let progress = this.quests.getProgress(BREEZE_WINDMILL_QUEST_ID);
    if (progress.status === 'not-started') {
      this.quests.startQuest(BREEZE_WINDMILL_QUEST_ID);
      this.discoveries.unlockDiscovery(WINDMILL_WHISPER_DISCOVERY_ID);
      return {
        state: 'started',
        message:
          'Breeze tilts an ear towards the old windmill. “Hear that little bell? It only rings properly when the wind comes across the pond. Want to see where the sound is coming from?” 🌬️🔔',
      };
    }

    progress = this.quests.getProgress(BREEZE_WINDMILL_QUEST_ID);
    if (progress.status === 'completed') {
      return {
        state: 'complete',
        message:
          'Breeze looks up at the turning sails. “The view is still good. I think the Meadow keeps moving its secrets around when we are not looking.”',
      };
    }

    if (progress.currentStepId === getQuestStepId(BREEZE_WINDMILL_QUEST_ID, 2)) {
      return {
        state: 'find-bell',
        message:
          'Breeze points towards the windmill bell. “Try it when you get close. Three notes should do it.”',
      };
    }

    if (progress.currentStepId === getQuestStepId(BREEZE_WINDMILL_QUEST_ID, 4)) {
      return {
        state: 'find-sky-glint',
        message:
          'The little lookout is open now. Breeze grins. “Go up and look towards the flowers. Something keeps flashing down there.”',
      };
    }

    return {
      state: this.isLookoutOpen() ? 'lookout-open' : 'find-bell',
      message: this.isLookoutOpen()
        ? 'Windmill Lookout is open. Breeze is waiting to hear what you spot from up there.'
        : 'The old windmill bell is still waiting for three clear notes.',
    };
  }

  public ringWindmillBell(): boolean {
    const progress = this.quests.getProgress(BREEZE_WINDMILL_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(BREEZE_WINDMILL_QUEST_ID, 2)
    ) {
      return false;
    }
    this.discoveries.unlockDiscovery(WINDMILL_LOOKOUT_DISCOVERY_ID);
    return true;
  }

  public discoverSkyGlint(): boolean {
    const progress = this.quests.getProgress(BREEZE_WINDMILL_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(BREEZE_WINDMILL_QUEST_ID, 4)
    ) {
      return false;
    }
    this.discoveries.unlockDiscovery(WINDMILL_SKY_GLINT_DISCOVERY_ID);
    return true;
  }

  public revealFlowerCircle(): boolean {
    if (this.discoveries.hasDiscovery(MEADOW_FLOWER_CIRCLE_DISCOVERY_ID)) {
      return false;
    }
    this.discoveries.unlockDiscovery(
      MEADOW_FLOWER_CIRCLE_DISCOVERY_ID,
      MEADOW_FLOWER_CIRCLE_REVEALED_FLAG,
    );
    return true;
  }

  public discoverRainbowReflection(): boolean {
    if (this.discoveries.hasDiscovery(MEADOW_RAINBOW_REFLECTION_DISCOVERY_ID)) {
      return false;
    }
    this.discoveries.unlockDiscovery(MEADOW_RAINBOW_REFLECTION_DISCOVERY_ID);
    return true;
  }

  public discoverButterflyParade(): boolean {
    if (this.discoveries.hasDiscovery(MEADOW_BUTTERFLY_PARADE_DISCOVERY_ID)) {
      return false;
    }
    this.discoveries.unlockDiscovery(MEADOW_BUTTERFLY_PARADE_DISCOVERY_ID);
    return true;
  }

  public isLookoutOpen(): boolean {
    return this.saveService.load()?.world.flags[WINDMILL_LOOKOUT_OPEN_FLAG] === true;
  }

  public isStoryComplete(): boolean {
    return this.saveService.load()?.world.flags[BREEZE_WINDMILL_COMPLETE_FLAG] === true;
  }
}
