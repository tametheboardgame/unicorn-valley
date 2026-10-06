import { describe, expect, it } from 'vitest';
import { REGULAR_RACE_COURSE_IDS } from '../racing/RaceCourse';
import type { SceneKey } from '../scenes/SceneKeys';
import {
  getJustGamesDefinitions,
  MINI_GAME_CATALOGUE,
  MINI_GAME_IDS,
  type MiniGameDefinition,
} from './MiniGameCatalogue';
import { getMiniGameCatalogueIssues } from './MiniGameCatalogueIntegrity.testSupport';

describe('MiniGameCatalogue', () => {
  it('keeps the production catalogue free of authoring-contract issues', () => {
    expect(getMiniGameCatalogueIssues(MINI_GAME_CATALOGUE)).toEqual([]);
  });

  it('keeps stable mini-game ids unique', () => {
    const ids = MINI_GAME_CATALOGUE.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('fails loudly when a future game duplicates a stable id', () => {
    const duplicate = [
      MINI_GAME_CATALOGUE[0],
      MINI_GAME_CATALOGUE[0],
    ] as readonly MiniGameDefinition[];
    expect(getMiniGameCatalogueIssues(duplicate)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'duplicate-id' })]),
    );
  });

  it('fails loudly when a catalogue entry references an invalid scene key', () => {
    const invalid = {
      ...MINI_GAME_CATALOGUE[0],
      sceneKey: 'NotARealScene' as SceneKey,
    } as MiniGameDefinition;

    expect(getMiniGameCatalogueIssues([invalid])).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'invalid-scene-key' })]),
    );
  });

  it('fails loudly when a future world game omits Just Games exposure', () => {
    const hidden = {
      ...MINI_GAME_CATALOGUE[2],
      justGames: { ...MINI_GAME_CATALOGUE[2].justGames, visible: false },
    } as MiniGameDefinition;

    expect(getMiniGameCatalogueIssues([hidden])).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'missing-just-games-exposure' })]),
    );
  });

  it('keeps variant ids unique and requires authored variant labels', () => {
    const invalid = {
      ...MINI_GAME_CATALOGUE[1],
      variants: [
        { id: 'practice', title: 'Practice', justGamesVisible: true },
        { id: 'practice', title: '', justGamesVisible: true },
      ],
    } as MiniGameDefinition;

    expect(getMiniGameCatalogueIssues([invalid])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate-variant-id' }),
        expect.objectContaining({ code: 'invalid-variant' }),
      ]),
    );
  });

  it('requires variant-based games to expose at least one selectable Just Games mode', () => {
    const hiddenVariants = {
      ...MINI_GAME_CATALOGUE[1],
      variants: MINI_GAME_CATALOGUE[1].variants.map((variant) => ({
        ...variant,
        justGamesVisible: false,
      })),
    } as MiniGameDefinition;

    expect(getMiniGameCatalogueIssues([hiddenVariants])).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'missing-visible-variant' })]),
    );
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

  it('keeps racing catalogue variants aligned with the canonical regular race courses', () => {
    const racing = MINI_GAME_CATALOGUE.find(
      (definition) => definition.id === MINI_GAME_IDS.rainbowRunRacing,
    );
    expect([...(racing?.variants.map((variant) => variant.id) ?? [])].sort()).toEqual(
      [...REGULAR_RACE_COURSE_IDS].sort(),
    );
  });

  it("does not treat Nova's story tutorial as a separate racing catalogue variant", () => {
    const racing = MINI_GAME_CATALOGUE.find(
      (definition) => definition.id === MINI_GAME_IDS.rainbowRunRacing,
    );
    expect(racing?.variants.map((variant) => variant.id)).not.toContain(
      'race-course:rainbow-run-nova-first-run',
    );
  });

  it('exposes all three Pond Leap play modes as Just Games variants', () => {
    const pondLeap = MINI_GAME_CATALOGUE.find(
      (definition) => definition.id === MINI_GAME_IDS.pondLeap,
    );
    expect(pondLeap?.variants.map((variant) => variant.id)).toEqual([
      'classic',
      'practice',
      'ripple-rush',
    ]);
  });

  it('defaults every current Just Games family to no adventure side effects', () => {
    for (const definition of getJustGamesDefinitions()) {
      expect(definition.sandbox.sideEffects).toBe('none');
    }
  });
});
