import { describe, expect, it } from 'vitest';
import {
  INTERACTION_SFX_BINDINGS,
  resolveInteractionSfxCue,
  resolveMusicContext,
  validateAudioBindings,
} from '../../content/audioBindings';

describe('WP19H audio integration bindings', () => {
  it('maps the playable area families to explicit music contexts', () => {
    expect(resolveMusicContext('TitleScene')).toBe('title-creator');
    expect(resolveMusicContext('MoonflowerGladeScene')).toBe('glade-cottage');
    expect(resolveMusicContext('CottageDecorateScene')).toBe('glade-cottage');
    expect(resolveMusicContext('SunbeamVillageScene')).toBe('village-interiors');
    expect(resolveMusicContext('ShopScene')).toBe('village-interiors');
    expect(resolveMusicContext('RainbowMeadowScene')).toBe('meadow');
    expect(resolveMusicContext('CrystalGrottoScene')).toBe('brook-grotto');
    expect(resolveMusicContext('FireflyLanternScene')).toBe('woods-nook-grove');
    expect(resolveMusicContext('StarlightBeachScene')).toBe('beach');
    expect(resolveMusicContext('RainbowRunEntryScene')).toBe('race');
    expect(resolveMusicContext('RaceScene')).toBe('race');
  });

  it('leaves context-free modals free to inherit the current area music', () => {
    expect(resolveMusicContext('SettingsScene')).toBeNull();
    expect(resolveMusicContext('InventoryScene')).toBeNull();
    expect(resolveMusicContext('WonderbookScene')).toBeNull();
  });

  it('resolves optional object sounds from stable interaction IDs', () => {
    expect(INTERACTION_SFX_BINDINGS).toHaveProperty('interaction:display-stump');
    expect(resolveInteractionSfxCue('interaction:display-stump')).toBe('ui');
    expect(resolveInteractionSfxCue('interaction:meadow-ribbon-board')).toBe('ui');
    expect(resolveInteractionSfxCue('interaction:not-assigned')).toBeNull();
  });

  it('contains no dangling authored asset references', () => {
    expect(validateAudioBindings()).toEqual([]);
  });
});
