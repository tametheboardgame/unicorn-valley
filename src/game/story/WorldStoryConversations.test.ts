import type Phaser from 'phaser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { getQuestStepId } from '../quests/QuestEngine';

const mocks = vi.hoisted(() => ({
  getProgress: vi.fn(),
  startQuest: vi.fn(),
  notifyCharacterTalked: vi.fn(),
  conversationStart: vi.fn(),
  load: vi.fn(),
}));

vi.mock('../quests/browserQuestEngine', () => ({
  getBrowserQuestEngine: () => ({
    getProgress: mocks.getProgress,
    startQuest: mocks.startQuest,
    notifyCharacterTalked: mocks.notifyCharacterTalked,
  }),
}));

vi.mock('../dialogue/WorldConversationPresenter', () => ({
  getWorldConversationPresenter: () => ({
    start: mocks.conversationStart,
  }),
}));

vi.mock('../save/browserSaveService', () => ({
  getBrowserSaveService: () => ({
    load: mocks.load,
  }),
}));

import { startPipEggConversation } from './WorldStoryConversations';

describe('Pip world-story conversation progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockReturnValue(null);
  });

  it('completes the return-to-Pip talk step only after the closing dialogue completes', () => {
    mocks.getProgress.mockReturnValue({
      status: 'active',
      currentStepId: getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 5),
      completedAt: null,
    });

    startPipEggConversation({} as Phaser.Scene);

    expect(mocks.conversationStart).toHaveBeenCalledOnce();
    expect(mocks.notifyCharacterTalked).not.toHaveBeenCalled();

    const options = mocks.conversationStart.mock.calls[0]?.[2] as
      | { onComplete?: () => void }
      | undefined;
    expect(options?.onComplete).toBeTypeOf('function');

    options?.onComplete?.();
    expect(mocks.notifyCharacterTalked).toHaveBeenCalledOnce();
    expect(mocks.notifyCharacterTalked).toHaveBeenCalledWith('character:pip');
  });
});
