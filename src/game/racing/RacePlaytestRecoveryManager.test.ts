import { describe, expect, it } from 'vitest';
import { resolveRaceEntryPrompt } from './RacePlaytestRecoveryManager';

describe('resolveRaceEntryPrompt', () => {
  it('names Nova first run explicitly when the tutorial race is ready', () => {
    expect(resolveRaceEntryPrompt('ready-to-race')).toMatchObject({
      title: "Start Nova's First Run?",
      targetScene: 'NovaTutorialRaceScene',
    });
  });

  it('names Sunrise Sprint explicitly after Nova first run is complete', () => {
    expect(resolveRaceEntryPrompt('complete')).toMatchObject({
      title: 'Start Sunrise Sprint?',
      targetScene: 'RaceScene',
    });
  });

  it('keeps Nova story routing intact before and immediately after the first run', () => {
    expect(resolveRaceEntryPrompt('invitation').targetScene).toBe('NovaStoryScene');
    expect(resolveRaceEntryPrompt('result-ready').targetScene).toBe('NovaStoryScene');
  });
});
