import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import type { DiscoveryId, QuestId } from '../../content/contentTypes';
import {
  JUNIPER_BUTTERFLY_COUNT_DISCOVERY_ID,
  JUNIPER_BUTTERFLY_COUNT_QUEST_ID,
  MAPLE_PICNIC_SPOT_DISCOVERY_ID,
  MAPLE_PICNIC_SPOT_QUEST_ID,
  MAPLE_PICNIC_STORY_PREREQUISITE_QUEST_ID,
  MOONFLOWERS_AFTER_DARK_DISCOVERY_ID,
  NO_FINISH_PICNIC_TURN_DISCOVERY_ID,
  NO_FINISH_POND_TURN_DISCOVERY_ID,
  NO_FINISH_WINDMILL_TURN_DISCOVERY_ID,
  NOVA_NO_FINISH_LINE_QUEST_ID,
  ODD_STONE_DISCOVERY_ID,
  ODD_STONE_REFLECTION_DISCOVERY_ID,
  ODD_STONE_STORYHOUSE_RUBBING_DISCOVERY_ID,
  PEBBLE_ODD_STONE_QUEST_ID,
  WILLOW_AFTER_DARK_QUEST_ID,
} from '../../content/r6ExistingValleyQuestPack';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { getQuestStepId, type QuestEngine } from '../quests/QuestEngine';
import type { SaveService } from '../save/SaveService';

export type NoFinishLandmark = 'pond' | 'picnic' | 'windmill';

export interface ExistingValleyStoryResult {
  changed: boolean;
  message: string;
}

const NO_FINISH_DISCOVERY_BY_LANDMARK = {
  pond: NO_FINISH_POND_TURN_DISCOVERY_ID,
  picnic: NO_FINISH_PICNIC_TURN_DISCOVERY_ID,
  windmill: NO_FINISH_WINDMILL_TURN_DISCOVERY_ID,
} as const satisfies Record<NoFinishLandmark, DiscoveryId>;

const NO_FINISH_STEP_BY_LANDMARK = {
  pond: 1,
  picnic: 2,
  windmill: 3,
} as const satisfies Record<NoFinishLandmark, number>;

export class ExistingValleyQuestPackService {
  private readonly discoveries: DiscoveryService;

  public constructor(
    private readonly saveService: SaveService,
    private readonly quests: QuestEngine,
    events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {
    this.discoveries = new DiscoveryService(saveService, events);
  }

  public canDiscoverMoonflowersAfterDark(): boolean {
    return (
      this.isCompleted(WILLOW_MOONFLOWERS_QUEST_ID) && !this.isCompleted(WILLOW_AFTER_DARK_QUEST_ID)
    );
  }

  public inspectMoonflowersAfterDark(): ExistingValleyStoryResult {
    if (!this.isCompleted(WILLOW_MOONFLOWERS_QUEST_ID)) {
      return {
        changed: false,
        message:
          'The garden is still finding its shape. Willow’s Moonflowers need to be planted first.',
      };
    }
    if (this.isCompleted(WILLOW_AFTER_DARK_QUEST_ID)) {
      return {
        changed: false,
        message:
          'The Moonflowers remember the pattern now. Tiny lights answer one another across the garden whenever the Glade grows dark. 🌙🌸',
      };
    }

    this.ensureStarted(WILLOW_AFTER_DARK_QUEST_ID);
    const changed = this.unlockDiscovery(MOONFLOWERS_AFTER_DARK_DISCOVERY_ID);
    return {
      changed,
      message: changed
        ? 'One Moonflower glows, then another, then another. The lights make a tiny star-pattern through Willow’s garden. Willow should see this. 🌙✨'
        : 'The Moonflowers keep tracing their star-pattern. Willow should see what her garden learned.',
    };
  }

  public canStartNoFinishLine(): boolean {
    return (
      this.isCompleted(NOVA_FIRST_RACE_QUEST_ID) && !this.isCompleted(NOVA_NO_FINISH_LINE_QUEST_ID)
    );
  }

  public inspectCloverRouteCard(): ExistingValleyStoryResult {
    if (!this.isCompleted(NOVA_FIRST_RACE_QUEST_ID)) {
      return {
        changed: false,
        message:
          'Clover’s route doodle is mostly arrows and flowers. Nova’s first race comes before trying this one.',
      };
    }
    if (this.isCompleted(NOVA_NO_FINISH_LINE_QUEST_ID)) {
      return {
        changed: false,
        message:
          'Clover has drawn three extra flowers on the old route card. The words “NO FINISH LINE” are underlined twice. 🚩',
      };
    }

    const progress = this.quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID);
    if (progress.status === 'not-started') {
      this.quests.startQuest(NOVA_NO_FINISH_LINE_QUEST_ID);
      return {
        changed: true,
        message:
          'Clover has doodled a route around the Pond, Picnic Hill and Windmill with one rule: no timing and no finish line. Nova will know how to start it. 🗺️',
      };
    }

    return {
      changed: false,
      message: this.noFinishHint(),
    };
  }

  public visitNoFinishLandmark(landmark: NoFinishLandmark): ExistingValleyStoryResult {
    const progress = this.quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID);
    const expectedStep = getQuestStepId(
      NOVA_NO_FINISH_LINE_QUEST_ID,
      NO_FINISH_STEP_BY_LANDMARK[landmark],
    );
    if (progress.status !== 'active' || progress.currentStepId !== expectedStep) {
      return { changed: false, message: this.noFinishHint() };
    }

    const changed = this.unlockDiscovery(NO_FINISH_DISCOVERY_BY_LANDMARK[landmark]);
    const messages: Record<NoFinishLandmark, string> = {
      pond: 'You loop around Rainbow Pond slowly enough for a frog to race you for three hops. Clover’s first marker flutters beside the lilies. 🐸🚩',
      picnic:
        'The route climbs Picnic Hill instead of cutting across it. From the top, the Meadow looks much bigger when nobody is counting seconds. 🧺✨',
      windmill:
        'The last marker curls beneath Windmill Lookout and points back into the Meadow. No finish gate, just a route worth doing. Nova should hear how it went. 🌬️🚩',
    };
    return { changed, message: messages[landmark] };
  }

  public inspectOddStone(): ExistingValleyStoryResult {
    if (this.isCompleted(PEBBLE_ODD_STONE_QUEST_ID)) {
      return {
        changed: false,
        message:
          'The little matching-stone cairn beside the Brook still catches the same curling reflection. Pebble left the oddest stone on top. 🪨✨',
      };
    }

    this.ensureStarted(PEBBLE_ODD_STONE_QUEST_ID);
    const progress = this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID);
    if (progress.currentStepId !== getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 0)) {
      return { changed: false, message: this.oddStoneHint() };
    }
    const changed = this.unlockDiscovery(ODD_STONE_DISCOVERY_ID);
    return {
      changed,
      message:
        'One smooth stone has pale curls that do not match any pebble around it. Pebble will absolutely want to inspect this. 🪨?',
    };
  }

  public studyOddStoneAtStoryHouse(): ExistingValleyStoryResult {
    const progress = this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID);
    const expectedStep = getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 2);
    if (progress.status !== 'active' || progress.currentStepId !== expectedStep) {
      return { changed: false, message: this.oddStoneHint() };
    }
    const changed = this.unlockDiscovery(ODD_STONE_STORYHOUSE_RUBBING_DISCOVERY_ID);
    return {
      changed,
      message:
        'A card in the Story House shows the same curling marks. Tansy has labelled it “reflection pattern, Crystal Brook, very old”. Back to the still water. 📜💧',
    };
  }

  public matchOddStoneReflection(): ExistingValleyStoryResult {
    const progress = this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID);
    const expectedStep = getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 3);
    if (progress.status !== 'active' || progress.currentStepId !== expectedStep) {
      return { changed: false, message: this.oddStoneHint() };
    }
    const changed = this.unlockDiscovery(ODD_STONE_REFLECTION_DISCOVERY_ID);
    return {
      changed,
      message:
        'Beside the Reflection Pool, the pale curls line up with reflected crystal-light exactly. It was never the wrong stone, just a clue from a different angle. Pebble needs to see this. 💧🪨',
    };
  }

  public playJuniperButterflyCount(): ExistingValleyStoryResult {
    if (this.isCompleted(JUNIPER_BUTTERFLY_COUNT_QUEST_ID)) {
      return {
        changed: false,
        message:
          'Juniper has added another tiny tick to the butterfly count. Nobody is sure whether the butterflies are cooperating. 🦋',
      };
    }
    this.ensureStarted(JUNIPER_BUTTERFLY_COUNT_QUEST_ID);
    const changed = this.unlockDiscovery(JUNIPER_BUTTERFLY_COUNT_DISCOVERY_ID);
    return {
      changed,
      message:
        'Juniper whispers the rules: count only butterflies that cross the flower circle twice. The pattern suddenly makes sense, and then one butterfly ruins the count by doing a loop. 🦋🌼',
    };
  }

  public canTryMaplePicnicSpot(): boolean {
    return (
      this.isCompleted(MAPLE_PICNIC_STORY_PREREQUISITE_QUEST_ID) &&
      !this.isCompleted(MAPLE_PICNIC_SPOT_QUEST_ID)
    );
  }

  public tryMaplePicnicSpot(): ExistingValleyStoryResult {
    if (!this.isCompleted(MAPLE_PICNIC_STORY_PREREQUISITE_QUEST_ID)) {
      return {
        changed: false,
        message: 'Maple is still busy with the Wobbly Cake Plan before testing picnic spots.',
      };
    }
    if (this.isCompleted(MAPLE_PICNIC_SPOT_QUEST_ID)) {
      return {
        changed: false,
        message:
          'Maple’s tiny picnic flag is still here. The spot remains level, scenic and extremely suitable for cake. 🧺',
      };
    }
    this.ensureStarted(MAPLE_PICNIC_SPOT_QUEST_ID);
    const changed = this.unlockDiscovery(MAPLE_PICNIC_SPOT_DISCOVERY_ID);
    return {
      changed,
      message:
        'Maple tests the slope with a berry bun. It stays exactly where she puts it. “Perfect! Scenic AND bun-safe.” 🧺🍓',
    };
  }

  public isCompleted(questId: QuestId): boolean {
    return this.quests.getProgress(questId).status === 'completed';
  }

  public currentStep(questId: QuestId): string | null {
    return this.quests.getProgress(questId).currentStepId;
  }

  private unlockDiscovery(discoveryId: DiscoveryId): boolean {
    const changed = !this.discoveries.hasDiscovery(discoveryId);
    this.discoveries.unlockDiscovery(discoveryId);
    return changed;
  }

  private ensureStarted(questId: QuestId): void {
    if (this.quests.getProgress(questId).status === 'not-started') {
      this.quests.startQuest(questId);
    }
  }

  private noFinishHint(): string {
    const progress = this.quests.getProgress(NOVA_NO_FINISH_LINE_QUEST_ID);
    if (progress.status === 'completed') {
      return 'The untimed friendship route is always open now.';
    }
    const step = progress.currentStepId;
    if (step === getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 0)) {
      return 'Clover’s card says to show the idea to Nova before following the markers.';
    }
    if (step === getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 1)) {
      return 'The first untimed marker curls around Rainbow Pond.';
    }
    if (step === getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 2)) {
      return 'The second marker waits high on Picnic Hill.';
    }
    if (step === getQuestStepId(NOVA_NO_FINISH_LINE_QUEST_ID, 3)) {
      return 'The last marker waits beneath Windmill Lookout.';
    }
    return 'The route is complete. Nova is waiting to hear what you noticed.';
  }

  private oddStoneHint(): string {
    const progress = this.quests.getProgress(PEBBLE_ODD_STONE_QUEST_ID);
    if (progress.status === 'completed') {
      return 'Pebble’s odd-stone mystery is solved.';
    }
    const step = progress.currentStepId;
    if (step === getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 1)) {
      return 'The stone does not match. Pebble will want to see it before you investigate further.';
    }
    if (step === getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 2)) {
      return 'Pebble thinks the Story House may have an old picture of the curling pattern.';
    }
    if (step === getQuestStepId(PEBBLE_ODD_STONE_QUEST_ID, 3)) {
      return 'The Story House rubbing points back to very still water in Crystal Brook.';
    }
    return 'The reflection solved the pattern. Pebble is waiting to hear what the stone was showing.';
  }
}
