import { describe, expect, it } from 'vitest';
import type { DialogueDefinition } from '../../content/contentTypes';
import { DialogueSession } from './DialogueSession';

const dialogue: DialogueDefinition = {
  id: 'dialogue:test-session',
  name: 'Test Session',
  startNodeId: 'dialogue-node:test-line',
  nodes: [
    {
      id: 'dialogue-node:test-line',
      type: 'line',
      speakerId: 'character:pip',
      text: 'Hello!',
      nextNodeId: 'dialogue-node:test-choice',
    },
    {
      id: 'dialogue-node:test-choice',
      type: 'choice',
      speakerId: 'character:pip',
      prompt: 'Choose one.',
      choices: [
        {
          id: 'sparkle',
          label: 'Sparkle',
          nextNodeId: 'dialogue-node:test-goodbye',
          effects: [{ type: 'set-flag', flagId: 'flag:test-choice', value: true }],
        },
      ],
    },
    {
      id: 'dialogue-node:test-goodbye',
      type: 'line',
      speakerId: 'character:pip',
      text: 'Bye!',
    },
  ],
};

describe('DialogueSession', () => {
  it('advances through authored line nodes', () => {
    const session = new DialogueSession(dialogue);
    expect(session.getCurrentNode()?.id).toBe('dialogue-node:test-line');

    session.advanceLine();
    expect(session.getCurrentNode()?.id).toBe('dialogue-node:test-choice');
  });

  it('applies choice effects and follows the selected branch', () => {
    const session = new DialogueSession(dialogue);
    session.advanceLine();

    expect(session.choose('sparkle')).toEqual([
      { type: 'set-flag', flagId: 'flag:test-choice', value: true },
    ]);
    expect(session.getCurrentNode()?.id).toBe('dialogue-node:test-goodbye');
  });

  it('finishes when a terminal line advances', () => {
    const session = new DialogueSession(dialogue);
    session.advanceLine();
    session.choose('sparkle');
    session.advanceLine();

    expect(session.isComplete()).toBe(true);
    expect(session.getCurrentNode()).toBeNull();
  });

  it('can be closed early with back behaviour', () => {
    const session = new DialogueSession(dialogue);
    session.close();

    expect(session.isComplete()).toBe(true);
  });
});
