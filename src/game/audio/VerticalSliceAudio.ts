import {
  MUSIC_BINDINGS,
  getAudioAsset,
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
  private proceduralMusicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private currentSceneKey: string | null = null;
  private musicElement: HTMLAudioElement | null = null;
  private musicTrackId: string | null = null;
  private fadingMusicElement: HTMLAudioElement | null = null;
  private musicFadeTimer: number | null = null;

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
    if (this.musicElement && this.musicFadeTimer === null) {
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

  public resumeMusic(): void {
    void this.musicElement?.play().catch(() => undefined);
  }

  public async unlock(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    let shouldRestart = false;
    if (!this.context) {
      this.context = new AudioContext();
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
    if (shouldRestart) {
      this.restartSceneLoops();
    }
  }

  public playSfx(kind: VerticalSliceSfx): void {
    if (this.settings.muted || !this.settings.sfxEnabled) {
      return;
    }
    void this.playAuthoredSfx(kind).then((played) => {
      if (!played) {
        void this.unlock().then(() => this.playProceduralSfx(kind));
      }
    });
  }

  public playNpcReaction(_characterId: string, _reaction?: string): void {}

  private restartSceneLoops(): void {
    this.stopProceduralLoops();
    const context = resolveMusicContext(this.currentSceneKey ?? '');
    if (!context || this.settings.muted) {
      this.stopMusic();
      return;
    }

    const selected = getAudioAsset(this.settings.selectedMusicTrackId);
    const track = this.settings.musicEnabled
      ? getAudioAsset(MUSIC_BINDINGS[context].themeTrackId)
      : selected?.kind === 'music'
        ? selected
        : MUSIC_CATALOGUE[0];
    if (track) {
      this.playTrack(track);
    } else {
      this.stopMusic();
      this.startProceduralMusic();
    }

    if (this.settings.ambienceEnabled) {
      this.startProceduralAmbience();
    }
  }

  private playTrack(track: AudioCatalogueEntry): void {
    if (typeof Audio === 'undefined') {
      return;
    }
    if (this.musicElement && this.musicTrackId === track.id) {
      this.musicElement.volume = this.musicElementTargetVolume();
      this.resumeMusic();
      return;
    }

    const previous = this.musicElement;
    const previousId = this.musicTrackId;
    this.clearMusicFade();
    const next = new Audio(track.path);
    next.loop = true;
    next.volume = previous ? 0 : this.musicElementTargetVolume();
    this.musicElement = next;
    this.musicTrackId = track.id;

    void next.play().then(
      () => {
        if (!previous) {
          return;
        }
        const startVolume = previous.volume;
        let step = 0;
        this.fadingMusicElement = previous;
        this.musicFadeTimer = window.setInterval(() => {
          step += 1;
          const mix = Math.min(1, step / 12);
          previous.volume = startVolume * (1 - mix);
          next.volume = this.musicElementTargetVolume() * mix;
          if (mix === 1) {
            this.clearMusicFade();
          }
        }, 50);
      },
      () => {
        if (this.musicElement !== next) {
          return;
        }
        this.musicElement = previous;
        this.musicTrackId = previousId;
        if (previous) {
          previous.volume = this.musicElementTargetVolume();
        }
      },
    );
  }

  private clearMusicFade(): void {
    if (this.musicFadeTimer !== null) {
      window.clearInterval(this.musicFadeTimer);
    }
    this.musicFadeTimer = null;
    this.fadingMusicElement?.pause();
    this.fadingMusicElement = null;
  }

  private stopMusic(): void {
    this.clearMusicFade();
    this.musicElement?.pause();
    this.musicElement = null;
    this.musicTrackId = null;
  }

  private musicElementTargetVolume(): number {
    return this.settings.muted
      ? 0
      : Math.min(1, this.settings.masterVolume * this.settings.musicVolume * 0.72);
  }

  private async playAuthoredSfx(kind: VerticalSliceSfx): Promise<boolean> {
    const asset = resolveSfxAsset(kind);
    if (!asset || typeof Audio === 'undefined') {
      return false;
    }
    try {
      const element = new Audio(asset.path);
      element.volume = Math.min(1, this.settings.masterVolume * this.settings.sfxVolume * 0.68);
      await element.play();
      return true;
    } catch {
      return false;
    }
  }

  private playProceduralSfx(kind: VerticalSliceSfx): void {
    if (this.context?.state !== 'running') {
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
      0.09 * this.settings.masterVolume * this.settings.sfxVolume,
    );
  }

  private startProceduralMusic(): void {
    if (this.context?.state !== 'running') {
      return;
    }
    const play = () =>
      this.playTone(
        523.25,
        0.5,
        'triangle',
        0.007 * this.settings.masterVolume * this.settings.musicVolume,
      );
    play();
    this.proceduralMusicTimer = window.setInterval(play, 11_000);
  }

  private startProceduralAmbience(): void {
    if (this.context?.state !== 'running') {
      return;
    }
    const play = () =>
      this.playTone(
        698.46,
        0.28,
        'sine',
        0.002 * this.settings.masterVolume * this.settings.ambienceVolume,
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

  private playTone(
    frequency: number,
    durationSeconds: number,
    wave: OscillatorType,
    volume: number,
  ): void {
    if (!this.context) {
      return;
    }
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const start = this.context.currentTime;
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + durationSeconds);
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
        this.restartSceneLoops();
        this.resumeMusic();
      }
    });
  }
}

let verticalSliceAudio: VerticalSliceAudio | null = null;

export function getVerticalSliceAudio(): VerticalSliceAudio {
  verticalSliceAudio ??= new VerticalSliceAudio();
  return verticalSliceAudio;
}
