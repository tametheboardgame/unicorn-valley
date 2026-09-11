import { describe, expect, it } from 'vitest';
import { CLICK_NAVIGATION_SCENE_CLASSIFICATION } from '../input/ClickNavigationSceneClassification';

const RETIRED_CONVERSATION_SCENES = [
  'WillowStoryScene',
  'MarigoldPicnicScene',
  'NovaStoryScene',
  'LumiStoryScene',
  'PebbleStoryScene',
  'RippleStoryScene',
  'PipEggStoryScene',
] as const;

describe('WP19E conversation route inventory', () => {
  it('does not classify retired ordinary-conversation routes as scenes', () => {
    const classified = [
      ...CLICK_NAVIGATION_SCENE_CLASSIFICATION.supported,
      ...CLICK_NAVIGATION_SCENE_CLASSIFICATION.intentionallyStatic,
    ];
    for (const scene of RETIRED_CONVERSATION_SCENES) expect(classified).not.toContain(scene);
  });

  it('retains the Pip hatch and Nova race as genuine mode boundaries', () => {
    expect(CLICK_NAVIGATION_SCENE_CLASSIFICATION.intentionallyStatic).toEqual(
      expect.arrayContaining(['PipEggHatchScene', 'NovaTutorialRaceScene']),
    );
  });
});
