import {
  BROOK_REFLECTION_POOL_DISCOVERY_ID,
  BROOK_STEPPING_CHIME_DISCOVERY_ID,
  BROOK_WATERFALL_RAINBOW_DISCOVERY_ID,
  CRYSTAL_GROTTO_BELL_NOTE_DISCOVERY_ID,
  CRYSTAL_GROTTO_BRIGHT_NOTE_DISCOVERY_ID,
  CRYSTAL_GROTTO_CHAMBER_DISCOVERY_ID,
  CRYSTAL_GROTTO_GLOWING_FLAG,
  CRYSTAL_GROTTO_LOW_NOTE_DISCOVERY_ID,
  CRYSTAL_GROTTO_OPEN_FLAG,
  CRYSTAL_GROTTO_SONG_DISCOVERY_ID,
  ECHO_CRYSTAL_SONG_COMPLETE_FLAG,
  ECHO_CRYSTAL_SONG_QUEST_ID,
} from '../../content/r6CrystalBrookDepthContent';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { getQuestStepId, type QuestEngine } from '../quests/QuestEngine';
import type { SaveService } from '../save/SaveService';

export type CrystalNoteId = 'low' | 'bright' | 'bell';

export type CrystalSongState =
  | 'started'
  | 'find-low-note'
  | 'find-bright-note'
  | 'find-bell-note'
  | 'complete';

export interface CrystalSongResult {
  state: CrystalSongState;
  message: string;
}

const NOTE_DISCOVERY_IDS = {
  low: CRYSTAL_GROTTO_LOW_NOTE_DISCOVERY_ID,
  bright: CRYSTAL_GROTTO_BRIGHT_NOTE_DISCOVERY_ID,
  bell: CRYSTAL_GROTTO_BELL_NOTE_DISCOVERY_ID,
} as const;

const NOTE_STEP_INDEX = {
  low: 3,
  bright: 4,
  bell: 5,
} as const;

export class CrystalGrottoStoryService {
  private readonly discoveries: DiscoveryService;

  public constructor(
    private readonly saveService: SaveService,
    private readonly quests: QuestEngine,
    events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {
    this.discoveries = new DiscoveryService(saveService, events);
  }

  public talkToEcho(): CrystalSongResult {
    let progress = this.quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID);
    if (progress.status === 'not-started') {
      this.quests.startQuest(ECHO_CRYSTAL_SONG_QUEST_ID);
      this.discoveries.unlockDiscovery(CRYSTAL_GROTTO_CHAMBER_DISCOVERY_ID);
      return {
        state: 'started',
        message:
          'Echo has found three crystals that answer one another, but not in the right order. The grotto opens beyond the old Prism Grotto trail. “Start with the deepest hum and listen for what answers next.” 💎🎵',
      };
    }

    progress = this.quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID);
    if (progress.status === 'completed') {
      return {
        state: 'complete',
        message:
          'Echo listens to the glowing grotto. “There it is again. The Brook kept our three notes and tucked them into its own song.”',
      };
    }

    if (progress.currentStepId === getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 3)) {
      return {
        state: 'find-low-note',
        message:
          'Echo nods towards the broad blue crystal. “The first note should be low enough to feel in your hooves.”',
      };
    }
    if (progress.currentStepId === getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 4)) {
      return {
        state: 'find-bright-note',
        message:
          '“Good. Now find the clearer note that sounds as if light itself made a tiny ping.”',
      };
    }
    return {
      state: 'find-bell-note',
      message: 'Echo smiles. “One more. The smallest crystal has a bell sound hiding inside it.”',
    };
  }

  public playCrystalNote(note: CrystalNoteId): boolean {
    const progress = this.quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID);
    if (
      progress.status !== 'active' ||
      progress.currentStepId !== getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, NOTE_STEP_INDEX[note])
    ) {
      return false;
    }

    this.discoveries.unlockDiscovery(NOTE_DISCOVERY_IDS[note]);
    if (note === 'bell') {
      this.discoveries.unlockDiscovery(CRYSTAL_GROTTO_SONG_DISCOVERY_ID);
    }
    return true;
  }

  public discoverWaterfallRainbow(): boolean {
    return this.unlockOnce(BROOK_WATERFALL_RAINBOW_DISCOVERY_ID);
  }

  public discoverReflectionPool(): boolean {
    return this.unlockOnce(BROOK_REFLECTION_POOL_DISCOVERY_ID);
  }

  public discoverSteppingChime(): boolean {
    return this.unlockOnce(BROOK_STEPPING_CHIME_DISCOVERY_ID);
  }

  public isGrottoOpen(): boolean {
    return this.saveService.load()?.world.flags[CRYSTAL_GROTTO_OPEN_FLAG] === true;
  }

  public isGrottoGlowing(): boolean {
    return this.saveService.load()?.world.flags[CRYSTAL_GROTTO_GLOWING_FLAG] === true;
  }

  public isStoryComplete(): boolean {
    return this.saveService.load()?.world.flags[ECHO_CRYSTAL_SONG_COMPLETE_FLAG] === true;
  }

  private unlockOnce(discoveryId: Parameters<DiscoveryService['unlockDiscovery']>[0]): boolean {
    if (this.discoveries.hasDiscovery(discoveryId)) {
      return false;
    }
    this.discoveries.unlockDiscovery(discoveryId);
    return true;
  }
}
