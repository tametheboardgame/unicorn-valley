import {
  getAudioAsset,
  resolveContextPlaylist,
  resolveMusicContext,
  resolveSfxAsset,
  type MusicContextId,
} from '../../content/audioBindings';
import { MUSIC_CATALOGUE, type AudioCatalogueEntry } from '../../generated/audioCatalogue';
import {
  type AudioSettings,
  type AudioSettingsStore,
  getBrowserAudioSettingsStore,
} from './AudioSettings';

export type VerticalSliceSfx =
  | 'ui'
  | 'ui-back'
  | 'dialogue'
  | 'collect'
  | 'discovery'
  | 'quest-complete'
  | 'friendship'
  | 'door'
  | 'decoration'
  | 'race-countdown'
  | 'race-go'
  | 'race-jump'
  | 'race-boost'
  | 'race-impact'
  | 'race-finish';
export type AudioSceneProfile =
  | 'menu'
  | 'glade'
  | 'village'
  | 'meadow'
  | 'brook'
  | 'woods'
  | 'cottage'
  | 'race';

interface ProceduralProfile {
  notes: readonly number[];
  intervalMs: number;
}

export const AUDIO_SCENE_PROFILES: readonly AudioSceneProfile[] = [
  'menu',
  'glade',
  'village',
  'meadow',
  'brook',
  'woods',
  'cottage',
  'race',
];
export const PRODUCTION_AUDIO_LOOP_MINIMUM_MS = 10_000;

const BRIGHT_NOTES = [523.25, 659.25, 783.99, 659.25] as const;
const EARTHY_NOTES = [349.23, 440, 523.25, 440] as const;
const RACE_NOTES = [523.25, 783.99, 1046.5, 783.99] as const;

const PROCEDURAL_PROFILES: Readonly<Record<AudioSceneProfile, ProceduralProfile>> = {
  menu: { notes: BRIGHT_NOTES, intervalMs: 2700 },
  glade: { notes: BRIGHT_NOTES, intervalMs: 2600 },
  village: { notes: EARTHY_NOTES, intervalMs: 2600 },
  meadow: { notes: BRIGHT_NOTES, intervalMs: 2550 },
  brook: { notes: EARTHY_NOTES, intervalMs: 2800 },
  woods: { notes: EARTHY_NOTES, intervalMs: 2900 },
  cottage: { notes: EARTHY_NOTES, intervalMs: 2850 },
  race: { notes: RACE_NOTES, intervalMs: 2500 },
};

const PROFILE_BY_CONTEXT: Readonly<Record<MusicContextId, AudioSceneProfile>> = {
  'title-creator': 'menu',
  'glade-cottage': 'glade',
  'village-interiors': 'village',
  meadow: 'meadow',
  'brook-grotto': 'brook',
  'woods-nook-grove': 'woods',
  beach: 'meadow',
  race: 'race',
};

const MAX_SFX_CACHE = 24;

export function resolveAudioSceneProfile(sceneKey: string): AudioSceneProfile | null {
  if (sceneKey === 'CottageInteriorScene') {
    return 'cottage';
  }
  const context = resolveMusicContext(sceneKey);
  return context ? PROFILE_BY_CONTEXT[context] : null;
}

export function getAudioSceneLoopDurationMs(profile: AudioSceneProfile): number {
  const definition = PROCEDURAL_PROFILES[profile];
  return definition.notes.length * definition.intervalMs;
}

export class VerticalSliceAudio {
  private settings: AudioSettings;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private proceduralMusicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private musicStep = 0;
  private currentSceneKey: string | null = null;
  private musicElement: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private playlist: readonly AudioCatalogueEntry[] = [];
  private lastPlaylistTrackId: string | null = null;
  private musicNeedsRestart = false;
  private sfxBuffers = new Map<string, AudioBuffer>();

  public constructor(
    private readonly settingsStore: AudioSettingsStore = getBrowserAudioSettingsStore(),
  ) {
    this.settings = settingsStore.load();
    this.installVisibilityListener();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public getMusicTracks(): readonly AudioCatalogueEntry[] {
    return MUSIC_CATALOGUE;
  }

  public setSettings(settings: AudioSettings): AudioSettings {
    const previous = this.settings;
    this.settings = this.settingsStore.save(settings);
    this.applyGainSettings();
    this.applyMusicElementVolume();
    if (
      previous.muted !== this.settings.muted ||
      previous.musicEnabled !== this.settings.musicEnabled ||
      previous.ambienceEnabled !== this.settings.ambienceEnabled ||
      previous.selectedMusicTrackId !== this.settings.selectedMusicTrackId
    ) {
      this.restartSceneLoops();
    }
    return this.getSettings();
  }

  public updateSettings(patch: Partial<AudioSettings>): AudioSettings {
    return this.setSettings({ ...this.settings, ...patch });
  }

  public enterScene(sceneKey: string): void {
    if (this.currentSceneKey === sceneKey) {
      return;
    }
    this.currentSceneKey = sceneKey;
    this.musicStep = 0;
    this.restartSceneLoops();
  }

  public leaveScene(sceneKey: string): void {
    if (this.currentSceneKey !== sceneKey) {
      return;
    }
    this.currentSceneKey = null;
    this.stopSceneLoops();
  }

  public async unlock(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    let shouldRestart = false;
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.ambienceGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain.connect(this.masterGain);
      this.ambienceGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      shouldRestart = true;
    }
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
        shouldRestart = true;
      } catch {
        return;
      }
    }
    this.applyGainSettings();
    if (shouldRestart || this.musicNeedsRestart) {
      this.musicNeedsRestart = false;
      this.restartSceneLoops();
    }
  }

  public playSfx(kind: VerticalSliceSfx): void {
    if (this.settings.muted || !this.settings.sfxEnabled) {
      return;
    }
    void this.unlock().then(async () => {
      if (await this.playAuthoredSfx(kind)) {
        return;
      }
      this.playProceduralSfx(kind);
    });
  }

  public playNpcReaction(_characterId: string, _reaction?: string): void {
    this.playSfx('dialogue');
  }

  private restartSceneLoops(): void {
    this.stopProceduralLoops();
    const profile = resolveAudioSceneProfile(this.currentSceneKey ?? '');
    if (!profile || this.settings.muted) {
      this.stopMusic();
      return;
    }

    if (this.settings.musicEnabled) {
      const manual = getAudioAsset(this.settings.selectedMusicTrackId);
      const context = resolveMusicContext(this.currentSceneKey ?? '');
      this.playlist = manual?.kind === 'music' ? [manual] : resolveContextPlaylist(context);
      if (this.playlist.length > 0) {
        this.startPlaylist();
      } else {
        this.stopMusic();
        this.startProceduralMusic(PROCEDURAL_PROFILES[profile]);
      }
    } else {
      this.stopMusic();
    }

    if (this.settings.ambienceEnabled) {
      this.startProceduralAmbience(PROCEDURAL_PROFILES[profile]);
    }
  }

  private startPlaylist(): void {
    const next = this.chooseNextTrack();
    if (!next) {
      return;
    }
    this.lastPlaylistTrackId = next.id;
    this.playTrack(next);
  }

  private chooseNextTrack(): AudioCatalogueEntry | null {
    if (this.playlist.length === 0) {
      return null;
    }
    if (this.playlist.length === 1) {
      return this.playlist[0] ?? null;
    }
    const candidates = this.playlist.filter((track) => track.id !== this.lastPlaylistTrackId);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? this.playlist[0] ?? null;
  }

  private playTrack(track: AudioCatalogueEntry): void {
    if (typeof Audio === 'undefined') {
      return;
    }
    if (this.musicElement && this.currentTrackId === track.id) {
      this.applyMusicElementVolume();
      void this.musicElement.play().catch(() => {
        this.musicNeedsRestart = true;
      });
      return;
    }

    this.stopMusic();
    const element = new Audio(this.assetUrl(track));
    element.preload = 'metadata';
    element.volume = this.musicElementTargetVolume();
    element.loop = this.playlist.length === 1;
    element.addEventListener('ended', () => {
      if (this.musicElement === element && this.playlist.length > 1) {
        this.startPlaylist();
      }
    });
    element.addEventListener('error', () => {
      if (this.musicElement === element) {
        this.stopMusic();
      }
    });
    this.musicElement = element;
    this.currentTrackId = track.id;
    void element.play().catch(() => {
      if (this.musicElement === element) {
        this.musicNeedsRestart = true;
      }
    });
  }

  private stopMusic(): void {
    this.musicElement?.pause();
    this.musicElement?.removeAttribute('src');
    this.musicElement = null;
    this.currentTrackId = null;
  }

  private musicElementTargetVolume(): number {
    if (this.settings.muted || !this.settings.musicEnabled) {
      return 0;
    }
    return Math.min(1, this.settings.masterVolume * this.settings.musicVolume * 0.72);
  }

  private applyMusicElementVolume(): void {
    if (this.musicElement) {
      this.musicElement.volume = this.musicElementTargetVolume();
    }
  }

  private assetUrl(asset: AudioCatalogueEntry): string {
    return `${asset.path}?v=${asset.sha256}`;
  }

  private async playAuthoredSfx(kind: VerticalSliceSfx): Promise<boolean> {
    const asset = resolveSfxAsset(kind);
    if (!asset || !this.context || !this.sfxGain || this.context.state !== 'running') {
      return false;
    }
    try {
      let buffer = this.sfxBuffers.get(asset.id);
      if (!buffer) {
        const response = await fetch(this.assetUrl(asset));
        if (!response.ok) {
          return false;
        }
        const bytes = await response.arrayBuffer();
        buffer = await this.context.decodeAudioData(bytes.slice(0));
        if (this.sfxBuffers.size >= MAX_SFX_CACHE) {
          const oldestKey = this.sfxBuffers.keys().next().value as string | undefined;
          if (oldestKey) {
            this.sfxBuffers.delete(oldestKey);
          }
        }
        this.sfxBuffers.set(asset.id, buffer);
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGain);
      source.addEventListener('ended', () => source.disconnect());
      source.start();
      return true;
    } catch {
      return false;
    }
  }

  private playProceduralSfx(kind: VerticalSliceSfx): void {
    if (!this.sfxGain || !this.context || this.context.state !== 'running') {
      return;
    }
    const patterns: Readonly<Record<VerticalSliceSfx, readonly [number, number]>> = {
      ui: [659.25, 0.09],
      'ui-back': [493.88, 0.1],
      dialogue: [523.25, 0.08],
      collect: [880, 0.16],
      discovery: [783.99, 0.22],
      'quest-complete': [659.25, 0.24],
      friendship: [783.99, 0.18],
      door: [392, 0.14],
      decoration: [987.77, 0.16],
      'race-countdown': [523.25, 0.11],
      'race-go': [1046.5, 0.18],
      'race-jump': [783.99, 0.1],
      'race-boost': [987.77, 0.12],
      'race-impact': [220, 0.14],
      'race-finish': [1046.5, 0.28],
    };
    const [frequency, duration] = patterns[kind];
    this.playTone(
      frequency,
      duration,
      kind.startsWith('race') ? 'triangle' : 'sine',
      0.09,
      this.sfxGain,
    );
  }

  private startProceduralMusic(definition: ProceduralProfile): void {
    const gain = this.musicGain;
    if (!this.context || !gain || this.context.state !== 'running') {
      return;
    }
    const play = () => {
      const note = definition.notes[this.musicStep % definition.notes.length] ?? 523.25;
      this.musicStep += 1;
      this.playTone(note, 0.5, 'triangle', 0.05, gain);
    };
    play();
    this.proceduralMusicTimer = window.setInterval(play, definition.intervalMs);
  }

  private startProceduralAmbience(definition: ProceduralProfile): void {
    const gain = this.ambienceGain;
    if (!this.context || !gain || this.context.state !== 'running') {
      return;
    }
    const play = () => this.playTone((definition.notes[0] ?? 440) * 2, 0.28, 'sine', 0.024, gain);
    play();
    this.ambienceTimer = window.setInterval(play, 5_500);
  }

  private stopProceduralLoops(): void {
    if (this.proceduralMusicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.proceduralMusicTimer);
    }
    if (this.ambienceTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.ambienceTimer);
    }
    this.proceduralMusicTimer = null;
    this.ambienceTimer = null;
  }

  private stopSceneLoops(): void {
    this.stopProceduralLoops();
    this.stopMusic();
  }

  private applyGainSettings(): void {
    if (
      !this.context ||
      !this.masterGain ||
      !this.musicGain ||
      !this.ambienceGain ||
      !this.sfxGain
    ) {
      return;
    }
    const now = this.context.currentTime;
    this.masterGain.gain.setTargetAtTime(
      this.settings.muted ? 0 : this.settings.masterVolume,
      now,
      0.03,
    );
    this.musicGain.gain.setTargetAtTime(
      this.settings.musicEnabled ? 0.14 * this.settings.musicVolume : 0,
      now,
      0.04,
    );
    this.ambienceGain.gain.setTargetAtTime(
      this.settings.ambienceEnabled ? 0.08 * this.settings.ambienceVolume : 0,
      now,
      0.04,
    );
    this.sfxGain.gain.setTargetAtTime(
      this.settings.sfxEnabled ? 0.68 * this.settings.sfxVolume : 0,
      now,
      0.02,
    );
  }

  private playTone(
    frequency: number,
    durationSeconds: number,
    wave: OscillatorType,
    volume: number,
    destination: AudioNode,
  ): void {
    if (!this.context) {
      return;
    }
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const start = this.context.currentTime;
    const end = start + durationSeconds;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect();
      gain.disconnect();
    });
  }

  private installVisibilityListener(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopSceneLoops();
        if (this.context?.state === 'running') {
          void this.context.suspend().catch(() => undefined);
        }
        return;
      }
      if (this.currentSceneKey && !this.settings.muted) {
        void this.unlock();
      }
    });
  }
}

let verticalSliceAudio: VerticalSliceAudio | null = null;

export function getVerticalSliceAudio(): VerticalSliceAudio {
  verticalSliceAudio ??= new VerticalSliceAudio();
  return verticalSliceAudio;
}
