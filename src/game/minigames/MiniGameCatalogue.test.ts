import { describe, expect, it } from 'vitest';
import { SCENE_MANIFEST } from '../scenes/SceneManifest';
import {
  getJustGamesDefinitions,
  MINI_GAME_CATALOGUE,
  MINI_GAME_IDS,
} from './MiniGameCatalogue';

describe('MiniGameCatalogue', () => {
  it('keeps stable mini-game ids unique', () => {
    const ids = MINI_GAME_CATALOGUE.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('maps every mini-game to an existing SceneManifest key', () => {
    const sceneKeys = new Set(SCENE_MANIFEST.map((entry) => entry.key));
    for (const definition of MINI_GAME_CATALOGUE) {
      expect(sceneKeys.has(definition.sceneKey)).toBe(true);
    }
  });

  it('keeps variant ids unique within each game family', () => {
    for (const definition of MINI_GAME_CATALOGUE) {
      const variants = definition.variants.map((variant) => variant.id);
      expect(new Set(variants).size).toBe(variants.length);
    }
  });

  it('exposes all current game families to the future Just Games catalogue', () => {
    expect(getJustGamesDefinitions().map((definition) => definition.id)).toEqual([
      MINI_GAME_IDS.rainbowRunRacing,
      MINI_GAME_IDS.rainbowDisc,
      MINI_GAME_IDS.sunbeamChess,
      MINI_GAME_IDS.wobblyCake,
      MINI_GAME_IDS.fireflyLantern,
      MINI_GAME_IDS.pondLeap,
      MINI_GAME_IDS.coralBeachcombing,
    ]);
  });

  it("does not treat Nova's story tutorial as a separate racing catalogue variant", () => {
    const racing = MINI_GAME_CATALOGUE.find(
      (definition) => definition.id === MINI_GAME_IDS.rainbowRunRacing,
    );
    expect(racing?.variants.map((variant) => variant.id)).not.toContain(
      'race-course:rainbow-run-nova-first-run',
    );
  });

  it('defaults every current Just Games family to no adventure side effects', () => {
    for (const definition of getJustGamesDefinitions()) {
      expect(definition.sandbox.sideEffects).toBe('none');
    }
  });
});
