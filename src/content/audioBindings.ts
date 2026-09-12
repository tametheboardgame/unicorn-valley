import type { VerticalSliceSfx } from '../game/audio/VerticalSliceAudio';
import {
  AUDIO_CATALOGUE,
  MUSIC_CATALOGUE,
  SFX_CATALOGUE,
  type AudioCatalogueEntry,
} from '../generated/audioCatalogue';

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

const SCENE_MUSIC_CONTEXT: Readonly<Record<string, MusicContextId>> = {
  TitleScene: 'title-creator',
  UnicornCreatorScene: 'title-creator',
  MoonflowerGladeScene: 'glade-cottage',
  MoonflowerPatchScene: 'glade-cottage',
  CottageInteriorScene: 'glade-cottage',
  SunbeamVillageScene: 'village-interiors',
  RainbowMeadowScene: 'meadow',
  WindmillLookoutScene: 'meadow',
  CrystalBrookScene: 'brook-grotto',
  CrystalGrottoScene: 'brook-grotto',
  WhisperingWoodsScene: 'woods-nook-grove',
  HollowTreeNookScene: 'woods-nook-grove',
  StarBeachScene: 'beach',
  RaceScene: 'race',
  NovaTutorialRaceScene: 'race',
};

const CATALOGUE_BY_ID = new Map<string, AudioCatalogueEntry>(
  AUDIO_CATALOGUE.map((entry) => [entry.id, entry]),
);

export function resolveMusicContext(sceneKey: string): MusicContextId | null {
  return SCENE_MUSIC_CONTEXT[sceneKey] ?? null;
}

export function getAudioAsset(id: string | null | undefined): AudioCatalogueEntry | null {
  return id ? (CATALOGUE_BY_ID.get(id) ?? null) : null;
}

export function getMusicTracks(): readonly AudioCatalogueEntry[] {
  return MUSIC_CATALOGUE;
}

export function getSfxTracks(): readonly AudioCatalogueEntry[] {
  return SFX_CATALOGUE;
}

export function resolveSfxAsset(kind: VerticalSliceSfx): AudioCatalogueEntry | null {
  const asset = getAudioAsset(SFX_BINDINGS[kind]);
  return asset?.kind === 'sfx' ? asset : null;
}

export function resolveContextPlaylist(contextId: MusicContextId | null): readonly AudioCatalogueEntry[] {
  if (!contextId) {
    return [];
  }
  const binding = MUSIC_BINDINGS[contextId];
  const ids = binding.themeTrackId
    ? [binding.themeTrackId, ...binding.playlistTrackIds]
    : [...binding.playlistTrackIds];
  const seen = new Set<string>();
  const tracks: AudioCatalogueEntry[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    const asset = getAudioAsset(id);
    if (asset?.kind === 'music') {
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
