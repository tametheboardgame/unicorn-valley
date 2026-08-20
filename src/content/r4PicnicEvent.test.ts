import { describe, expect, it } from 'vitest';
import { DialogueSession } from '../game/dialogue/DialogueSession';
import { applyDialogueEffects } from '../game/dialogue/applyDialogueEffects';
import { type GameEventMap, TypedEventBus } from '../game/events/GameEventBus';
import { QuestEngine } from '../game/quests/QuestEngine';
import type { SaveRepository } from '../game/save/SaveRepository';
import { SaveService } from '../game/save/SaveService';
import { getPicnicTheme, isMarigoldPicnicReady } from '../game/story/MarigoldPicnicStory';
import { PLACEHOLDER_CONTENT } from './placeholderContent';
import {
  MARIGOLD_CHARACTER_ID,
  MARIGOLD_PICNIC_QUEST_ID,
  PICNIC_MOONFLOWER_FLAG,
  PICNIC_RAINBOW_FLAG,
  PICNIC_READY_FLAG,
  PICNIC_SUNSHINE_FLAG,
  R4_PICNIC_CHARACTERS,
  R4_PICNIC_DIALOGUES,
  R4_PICNIC_DIALOGUE_VARIANT_SETS,
  R4_PICNIC_QUESTS,
} from './r4PicnicEvent';
import { validateContent } from './validateContent';

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

function getIntroDialogue() {
  const dialogue = R4_PICNIC_DIALOGUES.find(({ id }) => id === 'dialogue:marigold-picnic-intro');
  if (!dialogue) {
    throw new Error('Missing Marigold picnic introduction dialogue.');
  }
  return dialogue;
}

describe("Marigold's Picnic Event content", () => {
  it('passes content schema and reference validation', () => {
    const errors = validateContent({
      ...PLACEHOLDER_CONTENT,
      characters: [...PLACEHOLDER_CONTENT.characters, ...R4_PICNIC_CHARACTERS],
      quests: [...PLACEHOLDER_CONTENT.quests, ...R4_PICNIC_QUESTS],
      dialogues: [...PLACEHOLDER_CONTENT.dialogues, ...R4_PICNIC_DIALOGUES],
      dialogueVariantSets: R4_PICNIC_DIALOGUE_VARIANT_SETS,
    });

    expect(errors).toEqual([]);
  });

  it('offers three decoration themes and makes each selection exclusive', () => {
    const dialogue = getIntroDialogue();
    const choiceNode = dialogue.nodes.find(({ type }) => type === 'choice');
    expect(choiceNode?.type).toBe('choice');
    if (!choiceNode || choiceNode.type !== 'choice') {
      return;
    }

    expect(choiceNode.choices.map(({ id }) => id)).toEqual(['sunshine', 'moonflower', 'rainbow']);

    const flags = [PICNIC_SUNSHINE_FLAG, PICNIC_MOONFLOWER_FLAG, PICNIC_RAINBOW_FLAG];
    for (const choice of choiceNode.choices) {
      const effects = choice.effects ?? [];
      const enabled = effects.filter((effect) => effect.type === 'set-flag' && effect.value);
      const disabled = effects.filter((effect) => effect.type === 'set-flag' && !effect.value);
      expect(enabled).toHaveLength(1);
      expect(disabled).toHaveLength(2);
      expect(effects.map((effect) => effect.flagId).sort()).toEqual([...flags].sort());
    }
  });

  it('persists the chosen theme, completes the quest and makes the picnic visible', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    const events = new TypedEventBus<GameEventMap>();
    const questEngine = new QuestEngine(saveService, events, () => '2026-08-20T10:00:00.000Z');

    questEngine.startQuest(MARIGOLD_PICNIC_QUEST_ID);
    expect(questEngine.getProgress(MARIGOLD_PICNIC_QUEST_ID).status).toBe('active');

    const session = new DialogueSession(getIntroDialogue());
    session.advanceLine();
    const effects = session.choose('rainbow');
    applyDialogueEffects(saveService, effects);
    session.advanceLine();
    expect(session.isComplete()).toBe(true);

    const beforeCompletion = saveService.load();
    expect(getPicnicTheme(beforeCompletion)).toBe('rainbow');
    expect(isMarigoldPicnicReady(beforeCompletion)).toBe(false);

    questEngine.notifyCharacterTalked(MARIGOLD_CHARACTER_ID);

    const completed = saveService.load();
    expect(questEngine.getProgress(MARIGOLD_PICNIC_QUEST_ID).status).toBe('completed');
    expect(completed?.world.flags[PICNIC_READY_FLAG]).toBe(true);
    expect(getPicnicTheme(completed)).toBe('rainbow');
    expect(isMarigoldPicnicReady(completed)).toBe(true);
    expect(completed?.relationships.byCharacterId[MARIGOLD_CHARACTER_ID]?.friendshipPoints).toBe(
      15,
    );

    questEngine.destroy();
  });
});
