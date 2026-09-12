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

const PROCEDURAL_PROFILES: Readonly<Record<AudioSceneProfile, readonly [number, number]>> = {
  menu: [523.25, 2700],
  glade: [523.25, 2600],
  village: [349.23, 2600],
  meadow: [523.25, 2550],
  brook: [349.23, 2800],
  woods: [349.23, 2900],
  cottage: [349.23, 2850],
  race: [523.25, 2500],
};
const NOTE_STEPS = [1, 1.25, 1.5, 1.25] as const;

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

export function resolveAudioSceneProfile(sceneKey: string): AudioSceneProfile | null {
  if (sceneKey === 'CottageInteriorScene') {
    return 'cottage';
  }
  const context = resolveMusicContext(sceneKey);
  return context ? PROFILE_BY_CONTEXT[context] : null;
}

export function getAudioSceneLoopDurationMs(profile: AudioSceneProfile): number {
  return PROCEDURAL_PROFILES[profile][1] * NOTE_STEPS.length;
}

export class VerticalSliceAudio {
  private settings: AudioSettings;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
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
      this.sfxGain = this.context.createGain();
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
      if (!(await this.playAuthoredSfx(kind))) {
        this.playProceduralSfx(kind);
      }
    });
  }

  public playNpcReaction(_characterId: string, _reaction?: string): void {}

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
        this.startProceduralMusic(profile);
      }
    } else {
      this.stopMusic();
    }

    if (this.settings.ambienceEnabled) {
      this.startProceduralAmbience(profile);
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
    if (this.playlist.length <= 1) {
      return this.playlist[0] ?? null;
    }
    const candidates = this.playlist.filter((track) => track.id !== this.lastPlaylistTrackId);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
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
    this.musicElement = null;
    this.currentTrackId = null;
  }

  private musicElementTargetVolume(): number {
    return this.settings.muted || !this.settings.musicEnabled
      ? 0
      : Math.min(1, this.settings.masterVolume * this.settings.musicVolume * 0.72);
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
        buffer = await this.context.decodeAudioData(await response.arrayBuffer());
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
    const frequency =
      kind === 'race-impact'
        ? 220
        : kind === 'dialogue' || kind === 'door'
          ? 440
          : kind.startsWith('race')
            ? 1046.5
            : 783.99;
    const duration = kind === 'quest-complete' || kind === 'race-finish' ? 0.22 : 0.12;
    this.playTone(frequency, duration, kind.startsWith('race') ? 'triangle' : 'sine', 0.09, this.sfxGain);
  }

  private startProceduralMusic(profile: AudioSceneProfile): void {
    if (!this.context || !this.masterGain || this.context.state !== 'running') {
      return;
    }
    const [base, intervalMs] = PROCEDURAL_PROFILES[profile];
    const play = () => {
      const ratio = NOTE_STEPS[this.musicStep % NOTE_STEPS.length] ?? 1;
      this.musicStep += 1;
      this.playTone(
        base * ratio,
        0.5,
        'triangle',
        0.007 * this.settings.musicVolume,
        this.masterGain as GainNode,
      );
    };
    play();
    this.proceduralMusicTimer = window.setInterval(play, intervalMs);
  }

  private startProceduralAmbience(profile: AudioSceneProfile): void {
    if (!this.context || !this.masterGain || this.context.state !== 'running') {
      return;
    }
    const [base] = PROCEDURAL_PROFILES[profile];
    const play = () =>
      this.playTone(
        base * 2,
        0.28,
        'sine',
        0.002 * this.settings.ambienceVolume,
        this.masterGain as GainNode,
      );
    play();
    this.ambienceTimer = window.setInterval(play, 5_500);
  }

  private stopProceduralLoops(): void {
    if (this.proceduralMusicTimer !== null) {
      window.clearInterval(this.proceduralMusicTimer);
    }
    if (this.ambienceTimer !== null) {
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
    if (!this.context || !this.masterGain || !this.sfxGain) {
      return;
    }
    const now = this.context.currentTime;
    this.masterGain.gain.setTargetAtTime(
      this.settings.muted ? 0 : this.settings.masterVolume,
      now,
      0.03,
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
      } else if (this.currentSceneKey && !this.settings.muted) {
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
