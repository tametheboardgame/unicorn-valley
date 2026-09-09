import { describe, expect, it } from 'vitest';
import { CLICK_NAVIGATION_SCENE_CLASSIFICATION } from './ClickNavigationSceneClassification';

describe('click-navigation scene classification', () => {
  it('includes every explorable world and keeps static/race/modal screens explicit', () => {
    expect(CLICK_NAVIGATION_SCENE_CLASSIFICATION.supported).toEqual(
      expect.arrayContaining([
        'MoonflowerGladeScene',
        'CottageInteriorScene',
        'CrystalGrottoScene',
        'FireflyGroveScene',
      ]),
    );
    expect(CLICK_NAVIGATION_SCENE_CLASSIFICATION.intentionallyStatic).toEqual(
      expect.arrayContaining(['TitleScene', 'InventoryScene', 'RaceScene']),
    );
    expect(
      CLICK_NAVIGATION_SCENE_CLASSIFICATION.supported.filter((scene) =>
        CLICK_NAVIGATION_SCENE_CLASSIFICATION.intentionallyStatic.includes(scene as never),
      ),
    ).toEqual([]);
  });
});
