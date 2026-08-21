import { describe, expect, it } from 'vitest';
import { R4_FRIEND_VISITS } from '../../content/r4FriendVisits';
import { WILLOW_GARDEN_PLANTED_FLAG, WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { NOVA_FIRST_RACE_QUEST_ID, SUNRISE_SPRINT_UNLOCKED_FLAG } from '../../content/r3Quests';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { COTTAGE_INTERIOR_MAP } from '../world/CottageInteriorMap';
import type { CottageHomeView } from './CottageHomeView';
import { FriendVisitService } from './FriendVisitService';

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

const EMPTY_HOME: CottageHomeView = { placements: [], treasureRewards: [] };

function createEligibleSave(options: { willow?: boolean; nova?: boolean } = {}): SaveService {
  const saveService = new SaveService(new MemorySaveRepository());
  const save = saveService.createNewGame();

  saveService.save({
    ...save,
    relationships: {
      byCharacterId: {
        ...(options.willow
          ? { 'character:willow': { friendshipPoints: 5, flags: [] } }
          : {}),
        ...(options.nova ? { 'character:nova': { friendshipPoints: 5, flags: [] } } : {}),
      },
    },
    quests: {
      byQuestId: {
        ...(options.willow
          ? {
              [WILLOW_MOONFLOWERS_QUEST_ID]: {
                status: 'completed' as const,
                currentStepId: null,
                completedAt: '2026-08-21T08:00:00.000Z',
              },
            }
          : {}),
        ...(options.nova
          ? {
              [NOVA_FIRST_RACE_QUEST_ID]: {
                status: 'completed' as const,
                currentStepId: null,
                completedAt: '2026-08-21T08:00:00.000Z',
              },
            }
          : {}),
      },
    },
    world: {
      ...save.world,
      flags: {
        ...(options.willow ? { [WILLOW_GARDEN_PLANTED_FLAG]: true } : {}),
        ...(options.nova ? { [SUNRISE_SPRINT_UNLOCKED_FLAG]: true } : {}),
      },
    },
  });

  return saveService;
}

describe('FriendVisitService', () => {
  it('does not offer a visit until friendship and story conditions are satisfied', () => {
    const saveService = createEligibleSave({ willow: true });
    const save = saveService.load();
    if (!save) {
      throw new Error('Expected test save.');
    }

    saveService.save({
      ...save,
      relationships: {
        byCharacterId: {
          'character:willow': { friendshipPoints: 4, flags: [] },
        },
      },
    });

    expect(new FriendVisitService(saveService).resolveNextVisit(EMPTY_HOME)).toBeNull();
  });

  it('chooses Willow first when both friendship visits become eligible', () => {
    const service = new FriendVisitService(createEligibleSave({ willow: true, nova: true }));

    expect(service.resolveNextVisit(EMPTY_HOME)?.definition.characterId).toBe('character:willow');
  });

  it('persists a completed visit and offers the next eligible friend on a later resolution', () => {
    const saveService = createEligibleSave({ willow: true, nova: true });
    const service = new FriendVisitService(saveService);
    const willowVisit = service.resolveNextVisit(EMPTY_HOME);
    if (!willowVisit) {
      throw new Error('Expected Willow visit.');
    }

    service.completeVisit(willowVisit);

    expect(new FriendVisitService(saveService).resolveNextVisit(EMPTY_HOME)?.definition.characterId).toBe(
      'character:nova',
    );
  });

  it('uses cottage-aware dialogue when Willow visits a decorated home', () => {
    const service = new FriendVisitService(createEligibleSave({ willow: true }));
    const decoratedHome: CottageHomeView = {
      placements: [
        {
          slotId: 'cottage-slot:window-nook',
          slotLabel: 'Window nook',
          position: { x: 705, y: 320 },
          itemId: 'item:moonflower-lantern',
          name: 'Moonflower Lantern',
          icon: '🏮',
        },
      ],
      treasureRewards: [],
    };

    expect(service.resolveNextVisit(decoratedHome)?.dialogueId).toBe(
      'dialogue:willow-cottage-visit-decorated',
    );
  });

  it('lets Nova notice a displayed Rainbow Run prize', () => {
    const service = new FriendVisitService(createEligibleSave({ nova: true }));
    const racingHome: CottageHomeView = {
      placements: [
        {
          slotId: 'cottage-slot:left-wall',
          slotLabel: 'Left wall',
          position: { x: 500, y: 300 },
          itemId: 'item:rainbow-run-finisher-ribbon',
          name: 'Rainbow Run Finisher Ribbon',
          icon: '🎀',
        },
      ],
      treasureRewards: [],
    };

    expect(service.resolveNextVisit(racingHome)?.dialogueId).toBe(
      'dialogue:nova-cottage-visit-ribbon',
    );
  });

  it('keeps every visitor spawn clear of furniture and cottage boundaries', () => {
    const visitorRadius = 58;

    for (const visit of R4_FRIEND_VISITS) {
      const { x, y } = visit.position;
      expect(x).toBeGreaterThanOrEqual(COTTAGE_INTERIOR_MAP.margin + visitorRadius);
      expect(x).toBeLessThanOrEqual(
        COTTAGE_INTERIOR_MAP.width - COTTAGE_INTERIOR_MAP.margin - visitorRadius,
      );
      expect(y).toBeGreaterThanOrEqual(COTTAGE_INTERIOR_MAP.margin + visitorRadius);
      expect(y).toBeLessThanOrEqual(
        COTTAGE_INTERIOR_MAP.height - COTTAGE_INTERIOR_MAP.margin - visitorRadius,
      );

      for (const collider of COTTAGE_INTERIOR_MAP.colliders) {
        const clearOnX =
          Math.abs(x - collider.x) >= collider.width / 2 + visitorRadius;
        const clearOnY =
          Math.abs(y - collider.y) >= collider.height / 2 + visitorRadius;
        expect(clearOnX || clearOnY, `${visit.id} overlaps ${collider.id}`).toBe(true);
      }
    }
  });
});
