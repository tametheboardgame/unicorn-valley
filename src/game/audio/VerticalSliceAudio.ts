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

export function getAudioSceneLoopDurationMs(_profile: AudioSceneProfile): number {
  return 11_000;
}

export class VerticalSliceAudio {
  private settings: AudioSettings;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private proceduralMusicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private currentSceneKey: string | null = null;
  private musicElement: HTMLAudioElement | null = null;

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
    if (this.musicElement) {
      this.musicElement.volume = this.musicElementTargetVolume();
    }
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
    if (shouldRestart) {
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
    if (!resolveAudioSceneProfile(this.currentSceneKey ?? '') || this.settings.muted) {
      this.stopMusic();
      return;
    }

    if (this.settings.musicEnabled) {
      const manual = getAudioAsset(this.settings.selectedMusicTrackId);
      const context = resolveMusicContext(this.currentSceneKey ?? '');
      const track = manual?.kind === 'music' ? manual : resolveContextPlaylist(context)[0];
      if (track) {
        this.playTrack(track);
      } else {
        this.stopMusic();
        this.startProceduralMusic();
      }
    } else {
      this.stopMusic();
    }

    if (this.settings.ambienceEnabled) {
      this.startProceduralAmbience();
    }
  }

  private playTrack(track: AudioCatalogueEntry): void {
    if (typeof Audio === 'undefined') {
      return;
    }
    this.stopMusic();
    const element = new Audio(this.assetUrl(track));
    element.preload = 'metadata';
    element.volume = this.musicElementTargetVolume();
    element.loop = true;
    this.musicElement = element;
    void element.play().catch(() => undefined);
  }

  private stopMusic(): void {
    this.musicElement?.pause();
    this.musicElement = null;
  }

  private musicElementTargetVolume(): number {
    return this.settings.muted || !this.settings.musicEnabled
      ? 0
      : Math.min(1, this.settings.masterVolume * this.settings.musicVolume * 0.72);
  }

  private assetUrl(asset: AudioCatalogueEntry): string {
    return `${asset.path}?v=${asset.sha256}`;
  }

  private async playAuthoredSfx(kind: VerticalSliceSfx): Promise<boolean> {
    const asset = resolveSfxAsset(kind);
    if (!asset || typeof Audio === 'undefined') {
      return false;
    }
    try {
      const element = new Audio(this.assetUrl(asset));
      element.volume = Math.min(1, this.settings.masterVolume * this.settings.sfxVolume * 0.68);
      await element.play();
      return true;
    } catch {
      return false;
    }
  }

  private playProceduralSfx(kind: VerticalSliceSfx): void {
    const gain = this.masterGain;
    if (!gain || !this.context || this.context.state !== 'running') {
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
    this.playTone(
      frequency,
      duration,
      kind.startsWith('race') ? 'triangle' : 'sine',
      0.09 * this.settings.sfxVolume,
      gain,
    );
  }

  private startProceduralMusic(): void {
    const gain = this.masterGain;
    if (!this.context || !gain || this.context.state !== 'running') {
      return;
    }
    const play = () =>
      this.playTone(523.25, 0.5, 'triangle', 0.007 * this.settings.musicVolume, gain);
    play();
    this.proceduralMusicTimer = window.setInterval(play, 11_000);
  }

  private startProceduralAmbience(): void {
    const gain = this.masterGain;
    if (!this.context || !gain || this.context.state !== 'running') {
      return;
    }
    const play = () =>
      this.playTone(698.46, 0.28, 'sine', 0.002 * this.settings.ambienceVolume, gain);
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
    if (!this.context || !this.masterGain) {
      return;
    }
    this.masterGain.gain.setTargetAtTime(
      this.settings.muted ? 0 : this.settings.masterVolume,
      this.context.currentTime,
      0.03,
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
