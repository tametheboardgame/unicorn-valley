import type { VerticalSliceSfx } from '../game/audio/VerticalSliceAudio';
import { AUDIO_CATALOGUE, type AudioCatalogueEntry } from '../generated/audioCatalogue';

export const MUSIC_CONTEXT_IDS = [
  'title-creator',
  'glade-cottage',
  'village-interiors',
  'meadow',
  'brook-grotto',
  'woods-nook-grove',
  'beach',
  'race',
] as const;

export type MusicContextId = (typeof MUSIC_CONTEXT_IDS)[number];

export interface MusicContextBinding {
  themeTrackId: string | null;
  playlistTrackIds: readonly string[];
}

export const MUSIC_BINDINGS: Readonly<Record<MusicContextId, MusicContextBinding>> = {
  'title-creator': { themeTrackId: null, playlistTrackIds: [] },
  'glade-cottage': { themeTrackId: null, playlistTrackIds: [] },
  'village-interiors': { themeTrackId: null, playlistTrackIds: [] },
  meadow: { themeTrackId: null, playlistTrackIds: [] },
  'brook-grotto': { themeTrackId: null, playlistTrackIds: [] },
  'woods-nook-grove': { themeTrackId: null, playlistTrackIds: [] },
  beach: { themeTrackId: null, playlistTrackIds: [] },
  race: { themeTrackId: null, playlistTrackIds: [] },
};

export const SFX_BINDINGS: Partial<Record<VerticalSliceSfx, string>> = {
  ui: 'sfx:ui-soft-chime',
};

/**
 * Optional one-shot cue overrides for world objects. These are keyed by the stable interaction ID,
 * never by display text, coordinates or scene object names. Unlisted interactions fall back to
 * their semantic action (for example Talk -> dialogue and Enter -> door).
 */
export const INTERACTION_SFX_BINDINGS: Readonly<Record<string, VerticalSliceSfx>> = {
  'interaction:display-stump': 'ui',
  'interaction:meadow-ribbon-board': 'ui',
};

export const SCENE_MUSIC_CONTEXT: Readonly<Record<string, MusicContextId>> = {
  TitleScene: 'title-creator',
  UnicornCreatorScene: 'title-creator',
  MoonflowerGladeScene: 'glade-cottage',
  MoonflowerPatchScene: 'glade-cottage',
  CottageInteriorScene: 'glade-cottage',
  CottageDecorateScene: 'glade-cottage',
  PipEggHatchScene: 'glade-cottage',
  SunbeamVillageScene: 'village-interiors',
  VillageInteriorScene: 'village-interiors',
  R6VillageInteriorScene: 'village-interiors',
  ShopScene: 'village-interiors',
  RainbowMeadowScene: 'meadow',
  WindmillLookoutScene: 'meadow',
  CrystalBrookScene: 'brook-grotto',
  CrystalGrottoScene: 'brook-grotto',
  WhisperingWoodsScene: 'woods-nook-grove',
  HollowTreeNookScene: 'woods-nook-grove',
  FireflyGroveScene: 'woods-nook-grove',
  FireflyLanternScene: 'woods-nook-grove',
  StarlightBeachScene: 'beach',
  RainbowRunEntryScene: 'race',
  RaceScene: 'race',
  NovaTutorialRaceScene: 'race',
};

export function resolveMusicContext(sceneKey: string): MusicContextId | null {
  return SCENE_MUSIC_CONTEXT[sceneKey] ?? null;
}

export function resolveInteractionSfxCue(interactionId: string): VerticalSliceSfx | null {
  return INTERACTION_SFX_BINDINGS[interactionId] ?? null;
}

export function getAudioAsset(id: string | null | undefined): AudioCatalogueEntry | null {
  return id ? (AUDIO_CATALOGUE.find((entry) => entry.id === id) ?? null) : null;
}

export function resolveSfxAsset(kind: VerticalSliceSfx): AudioCatalogueEntry | null {
  const asset = getAudioAsset(SFX_BINDINGS[kind]);
  return asset?.kind === 'sfx' ? asset : null;
}

export function resolveContextPlaylist(
  contextId: MusicContextId | null,
): readonly AudioCatalogueEntry[] {
  if (!contextId) {
    return [];
  }
  const binding = MUSIC_BINDINGS[contextId];
  const ids = binding.themeTrackId
    ? [binding.themeTrackId, ...binding.playlistTrackIds]
    : [...binding.playlistTrackIds];
  const tracks: AudioCatalogueEntry[] = [];
  for (const id of ids) {
    const asset = getAudioAsset(id);
    if (asset?.kind === 'music' && !tracks.includes(asset)) {
      tracks.push(asset);
    }
  }
  return tracks;
}

export function validateAudioBindings(): string[] {
  const errors: string[] = [];
  for (const contextId of MUSIC_CONTEXT_IDS) {
    const binding = MUSIC_BINDINGS[contextId];
    const ids = binding.themeTrackId
      ? [binding.themeTrackId, ...binding.playlistTrackIds]
      : binding.playlistTrackIds;
    for (const id of ids) {
      const asset = getAudioAsset(id);
      if (!asset) {
        errors.push(`${contextId} references missing audio asset ${id}`);
      } else if (asset.kind !== 'music') {
        errors.push(`${contextId} references non-music audio asset ${id}`);
      }
    }
  }

  for (const [cue, id] of Object.entries(SFX_BINDINGS)) {
    const asset = getAudioAsset(id);
    if (!asset) {
      errors.push(`${cue} references missing audio asset ${id}`);
    } else if (asset.kind !== 'sfx') {
      errors.push(`${cue} references non-SFX audio asset ${id}`);
    }
  }
  return errors;
}
