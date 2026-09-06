import { describe, expect, it } from 'vitest';
import { PICNIC_READY_FLAG, PICNIC_SUNSHINE_FLAG } from '../../content/r4PicnicEvent';
import { NOVA_FIRST_RACE_QUEST_ID, SUNRISE_SPRINT_UNLOCKED_FLAG } from '../../content/r3Quests';
import { buildCottageHomeView } from '../home/CottageHomeView';
import { FriendVisitService } from '../home/FriendVisitService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { CoreNpcPresenceService, NOVA_CHARACTER_ID } from './CoreNpcPresenceService';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

function createSavedGame(): { repository: MemorySaveRepository; saveService: SaveService } {
  const repository = new MemorySaveRepository();
  const saveService = new SaveService(repository);
  saveService.save(saveService.createNewGame());
  return { repository, saveService };
}

function makePicnicReady(saveService: SaveService): void {
  const save = saveService.load();
  if (!save) {
    throw new Error('Expected saved game.');
  }

  saveService.save({
    ...save,
    world: {
      ...save.world,
      flags: {
        ...save.world.flags,
        [PICNIC_READY_FLAG]: true,
        [PICNIC_SUNSHINE_FLAG]: true,
      },
    },
  });
}

function makeNovaCottageEligible(saveService: SaveService): void {
  const save = saveService.load();
  if (!save) {
    throw new Error('Expected saved game.');
  }

  saveService.save({
    ...save,
    relationships: {
      ...save.relationships,
      byCharacterId: {
        ...save.relationships.byCharacterId,
        [NOVA_CHARACTER_ID]: { friendshipPoints: 5, flags: [] },
      },
    },
    quests: {
      ...save.quests,
      byQuestId: {
        ...save.quests.byQuestId,
        [NOVA_FIRST_RACE_QUEST_ID]: {
          status: 'completed',
          currentStepId: null,
          completedAt: '2026-09-06T12:00:00.000Z',
        },
      },
    },
    world: {
      ...save.world,
      flags: {
        ...save.world.flags,
        [SUNRISE_SPRINT_UNLOCKED_FLAG]: true,
      },
    },
  });
}

describe('CoreNpcPresenceService', () => {
  it('keeps Nova at the Rainbow Run hub on a fresh save', () => {
    const { saveService } = createSavedGame();

    expect(new CoreNpcPresenceService(saveService).resolve(NOVA_CHARACTER_ID)).toEqual({
      characterId: NOVA_CHARACTER_ID,
      area: 'rainbow-run-hub',
      activity: 'race-hosting',
      representation: 'canonical-unicorn',
      availableForConcurrentActivity: false,
    });
  });

  it('moves Nova to Picnic Hill when the authored picnic is ready', () => {
    const { saveService } = createSavedGame();
    makePicnicReady(saveService);

    expect(new CoreNpcPresenceService(saveService).resolve(NOVA_CHARACTER_ID)?.area).toBe(
      'picnic-hill',
    );
  });

  it('gives Nova cottage-visit priority over simultaneous picnic readiness', () => {
    const { saveService } = createSavedGame();
    makePicnicReady(saveService);
    makeNovaCottageEligible(saveService);

    const presence = new CoreNpcPresenceService(saveService).resolve(NOVA_CHARACTER_ID);
    expect(presence?.area).toBe('moonflower-cottage');
    expect(presence?.activity).toBe('cottage-visit');
  });

  it('relocates Nova after her cottage visit and restores the same authority on continue', () => {
    const { repository, saveService } = createSavedGame();
    makePicnicReady(saveService);
    makeNovaCottageEligible(saveService);

    const save = saveService.load();
    if (!save) {
      throw new Error('Expected saved game.');
    }
    const friendVisits = new FriendVisitService(saveService);
    const novaVisit = friendVisits.resolveNextVisit(buildCottageHomeView(save));
    if (!novaVisit || novaVisit.definition.characterId !== NOVA_CHARACTER_ID) {
      throw new Error('Expected Nova cottage visit.');
    }
    friendVisits.completeVisit(novaVisit);

    expect(new CoreNpcPresenceService(saveService).resolve(NOVA_CHARACTER_ID)?.area).toBe(
      'picnic-hill',
    );

    const continuedSaveService = new SaveService(repository);
    expect(new CoreNpcPresenceService(continuedSaveService).resolve(NOVA_CHARACTER_ID)?.area).toBe(
      'picnic-hill',
    );
  });

  it('does not claim authority for core NPCs that have not been scheduled yet', () => {
    const { saveService } = createSavedGame();

    expect(new CoreNpcPresenceService(saveService).resolve('character:willow')).toBeNull();
  });
});
