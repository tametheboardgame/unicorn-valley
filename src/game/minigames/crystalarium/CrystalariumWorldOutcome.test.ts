import { describe, expect, it } from 'vitest';
import {
  CRYSTALARIUM_OPENING_DISCOVERY_ID,
  CRYSTAL_GROTTO_OPEN_FLAG,
  ECHO_CRYSTAL_SONG_QUEST_ID,
} from '../../../content/r6CrystalBrookDepthContent';
import { type GameEventMap, TypedEventBus } from '../../events/GameEventBus';
import { createMiniGameSession, type MiniGameSession } from '../MiniGameSession';
import { getQuestStepId, QuestEngine } from '../../quests/QuestEngine';
import type { SaveRepository } from '../../save/SaveRepository';
import { SaveService } from '../../save/SaveService';
import { createDefaultSave } from '../../save/createDefaultSave';
import { CrystalGrottoStoryService } from '../../story/CrystalGrottoStoryService';
import { completeCrystalariumOpening } from './CrystalariumWorldOutcome';

class MemoryRepository implements SaveRepository {
  private saved: string | null = null;
  read(): string | null { return this.saved; }
  write(value: string): void { this.saved = value; }
  remove(): void { this.saved = null; }
}

function createHarness() {
  const save = new SaveService(new MemoryRepository());
  save.save(createDefaultSave('2026-10-23T12:00:00.000Z'));
  const events = new TypedEventBus<GameEventMap>();
  const quests = new QuestEngine(save, events);
  const story = new CrystalGrottoStoryService(save, quests, events);
  const session = createMiniGameSession({
    gameId: 'crystalarium',
    variantId: 'opening-melody',
    source: 'world',
    returnTarget: { sceneKey: 'CrystalBrookScene', mode: 'resume' },
    worldContext: {
      locationId: 'crystal-brook',
      interactionId: 'crystal-grotto',
      questContext: ECHO_CRYSTAL_SONG_QUEST_ID,
    },
  });
  const win = (value: MiniGameSession | null = session) =>
    completeCrystalariumOpening(value, save, quests, events);
  return { save, quests, story, session, win };
}

describe('H6.9B Crystalarium world outcome boundary', () => {
  it('does not open the door before Echo or by replaying a completed callback', () => {
    const { save, quests, story, win } = createHarness();
    expect(win()).toBe(false);
    story.talkToEcho();
    expect(story.isOpeningMelodyReady()).toBe(true);
    expect(save.load()?.world.flags[CRYSTAL_GROTTO_OPEN_FLAG]).not.toBe(true);
    expect(win()).toBe(true);
    expect(win()).toBe(false);
    expect(save.load()?.world.flags[CRYSTAL_GROTTO_OPEN_FLAG]).toBe(true);
    expect(save.load()?.collections.discoveryIds.filter((id) => id === CRYSTALARIUM_OPENING_DISCOVERY_ID)).toHaveLength(1);
    expect(quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID).currentStepId).toBe(getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 3));
    quests.destroy();
  });

  it('rejects missing, sandboxed, mismatched and forged sessions without writes', () => {
    const { save, quests, story, session, win } = createHarness();
    story.talkToEcho();
    const sandbox = createMiniGameSession({
      gameId: 'crystalarium',
      source: 'just-games',
      variantId: 'resonance-patterns',
      returnTarget: { sceneKey: 'JustGamesScene', mode: 'resume' },
    });
    for (const value of [
      null,
      sandbox,
      { ...session, variantId: 'resonance-patterns' },
      { ...session, gameId: 'rainbow-disc' },
      { ...session, source: 'just-games' },
      { ...session, sideEffectPolicy: 'sandbox' },
      { ...session, worldContext: { ...session.worldContext, locationId: 'rainbow-meadow' } },
      { ...session, worldContext: { ...session.worldContext, interactionId: 'other' } },
      { ...session, worldContext: { ...session.worldContext, questContext: 'other' } },
      { ...session, returnTarget: { sceneKey: 'TitleScene', mode: 'start' } },
    ] as Array<MiniGameSession | null>) {
      const before = JSON.stringify(save.load());
      expect(win(value)).toBe(false);
      expect(JSON.stringify(save.load())).toBe(before);
    }
    quests.destroy();
  });

  it('preserves existing entrance access without replaying opening rewards', () => {
    const { save, quests, story, win } = createHarness();
    story.talkToEcho();
    const current = save.load();
    if (!current) throw new Error('Expected saved profile');
    save.save({ ...current, world: { ...current.world, flags: { ...current.world.flags, [CRYSTAL_GROTTO_OPEN_FLAG]: true } } });
    expect(win()).toBe(false);
    quests.destroy();
  });
});
