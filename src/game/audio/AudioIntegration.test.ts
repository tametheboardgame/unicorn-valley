import { describe, expect, it } from 'vitest';
import {
  INTERACTION_SFX_BINDINGS,
  MUSIC_BINDINGS,
  SFX_BINDINGS,
  resolveContextPlaylist,
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

  it('assigns uploaded music while leaving beach on its explicit fallback', () => {
    expect(resolveContextPlaylist('title-creator')).toHaveLength(1);
    expect(resolveContextPlaylist('glade-cottage')).toHaveLength(2);
    expect(resolveContextPlaylist('village-interiors')).toHaveLength(3);
    expect(resolveContextPlaylist('brook-grotto')).toHaveLength(2);
    expect(resolveContextPlaylist('woods-nook-grove')).toHaveLength(2);
    expect(resolveContextPlaylist('race')).toHaveLength(1);
    expect(MUSIC_BINDINGS.beach.themeTrackId).toBeNull();
    expect(resolveContextPlaylist('beach')).toEqual([]);
  });

  it('leaves context-free modals free to inherit the current area music', () => {
    expect(resolveMusicContext('SettingsScene')).toBeNull();
    expect(resolveMusicContext('InventoryScene')).toBeNull();
    expect(resolveMusicContext('WonderbookScene')).toBeNull();
  });

  it('binds the available authored SFX and leaves other cues eligible for fallback', () => {
    expect(SFX_BINDINGS.ui).toBe('sfx:ui-soft-chime');
    expect(SFX_BINDINGS['ui-back']).toBe('sfx:ui/ui-back');
    expect(SFX_BINDINGS.discovery).toBe('sfx:discoveries/discovery');
    expect(SFX_BINDINGS.dialogue).toBeUndefined();
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
