import {
  CORAL_SEA_LIGHT_THEORY_DISCOVERY_ID,
  LIGHT_FOUND_SEA_QUEST_ID,
  LUMI_STARWELL_LIGHT_CLUE_DISCOVERY_ID,
  MOONLIT_SHELL_GLIMMER_DISCOVERY_ID,
  SHORE_STARWELL_LANTERN_MEMORY_DISCOVERY_ID,
  STARWELL_SEA_REFLECTION_DISCOVERY_ID,
} from '../../content/r65CrossRegionFollowUp';
import { LUMI_CHARACTER_ID, LUMI_INTRO_RELATIONSHIP_FLAG, STARWELL_REVEALED_FLAG } from '../../content/r5LumiWoodsStory';
import { CORAL_SHELL_STORIES_QUEST_ID } from '../../content/r65StarlightBeach';
import type { DiscoveryId } from '../../content/contentTypes';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { getQuestStepId, type QuestEngine } from '../quests/QuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import type { SaveService } from '../save/SaveService';

export interface CrossRegionFollowUpResult {
  changed: boolean;
  message: string;
}

export class CrossRegionFollowUpStoryService {
  private readonly discoveries: DiscoveryService;
  private readonly relationships: RelationshipService;

  public constructor(
    private readonly saveService: SaveService,
    private readonly quests: QuestEngine,
    events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {
    this.discoveries = new DiscoveryService(saveService, events);
    this.relationships = new RelationshipService(saveService, events);
  }

  public canStart(): boolean {
    const save = this.saveService.load();
    return (
      this.quests.getProgress(CORAL_SHELL_STORIES_QUEST_ID).status === 'completed' &&
      save?.world.flags[STARWELL_REVEALED_FLAG] === true &&
      this.relationships.hasFlag(LUMI_CHARACTER_ID, LUMI_INTRO_RELATIONSHIP_FLAG) &&
      this.quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID).status === 'not-started'
    );
  }

  public inspectMoonlitGlimmer(): CrossRegionFollowUpResult {
    const progress = this.quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID);
    if (progress.status === 'completed') {
      return {
        changed: false,
        message:
          'The little green glimmer now has a home in Coral and Lumi’s lantern back at Shell Cove. 🐚✨',
      };
    }
    if (progress.status === 'not-started') {
      if (!this.canStart()) {
        return {
          changed: false,
          message:
            'Moonlit Point is full of ordinary sea sparkle. Perhaps there will be something new after more Beach and Woods adventures.',
        };
      }
      this.quests.startQuest(LIGHT_FOUND_SEA_QUEST_ID);
    }
    if (!this.isStep(0)) {
      return { changed: false, message: this.currentHint() };
    }
    return this.unlock(
      MOONLIT_SHELL_GLIMMER_DISCOVERY_ID,
      'A familiar shell flashes green instead of silver. It looks exactly like one of Lumi’s gentle Woods lights. Coral should see this. 🐚✨',
    );
  }

  public askCoralAboutGlimmer(): CrossRegionFollowUpResult {
    if (!this.isStep(1)) {
      return { changed: false, message: this.currentHint() };
    }
    return this.unlock(
      CORAL_SEA_LIGHT_THEORY_DISCOVERY_ID,
      'Coral: “That is definitely one of our shells, but that green light is new. Maybe a little inland light followed the water all the way here. Lumi knows more about wandering lights than anyone.” 🐚💡',
    );
  }

  public askLumiAboutGlimmer(): CrossRegionFollowUpResult {
    if (!this.isStep(2)) {
      return { changed: false, message: this.currentHint() };
    }
    return this.unlock(
      LUMI_STARWELL_LIGHT_CLUE_DISCOVERY_ID,
      'Lumi: “The Starwell reflects patterns, not just stars. Bring the memory of that shell-glimmer right to the water. If it answers, the Woods really did find the sea.” ✨🌲',
    );
  }

  public inspectStarwellReflection(): CrossRegionFollowUpResult {
    if (!this.isStep(3)) {
      return { changed: false, message: this.currentHint() };
    }
    return this.unlock(
      STARWELL_SEA_REFLECTION_DISCOVERY_ID,
      'The Starwell catches a pale wave-pattern, then the same soft green light dances across the water. Lumi was right. Coral needs to hear what answered. 🌌🌊',
    );
  }

  public returnToCoral(): CrossRegionFollowUpResult {
    if (!this.isStep(4)) {
      return { changed: false, message: this.currentHint() };
    }
    return this.unlock(
      SHORE_STARWELL_LANTERN_MEMORY_DISCOVERY_ID,
      'Coral: “Then we should give the light somewhere to stay.” Coral adds a pearly shell, Lumi sends a firefly-safe glass glow, and a tiny Shore and Starwell Lantern now shines at the Cove. 🏮✨',
    );
  }

  public currentHint(): string {
    const progress = this.quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID);
    if (progress.status === 'completed') {
      return 'Coral and Lumi’s Shore and Starwell Lantern now links the Beach and Woods.';
    }
    if (progress.status === 'not-started') {
      return this.canStart()
        ? 'A strange green glimmer is waiting below Moonlit Point.'
        : 'More Beach and Woods friendship adventures need to happen first.';
    }
    if (this.isStep(1)) {
      return 'Take the strange Moonlit shell-glimmer to Coral at Shell Cove.';
    }
    if (this.isStep(2)) {
      return 'Coral thinks Lumi may recognise the wandering green light. Return to the Starwell in Whispering Woods.';
    }
    if (this.isStep(3)) {
      return 'Lumi wants you to compare the beach glimmer with the Starwell water.';
    }
    return 'The Starwell answered with the same light. Return to Coral at Starlight Beach.';
  }

  public isStep(index: number): boolean {
    const progress = this.quests.getProgress(LIGHT_FOUND_SEA_QUEST_ID);
    return (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(LIGHT_FOUND_SEA_QUEST_ID, index)
    );
  }

  private unlock(discoveryId: DiscoveryId, message: string): CrossRegionFollowUpResult {
    const changed = !this.discoveries.hasDiscovery(discoveryId);
    this.discoveries.unlockDiscovery(discoveryId);
    return { changed, message };
  }
}
