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
export type NpcReaction = 'talk' | 'happy' | 'surprised';
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
  ambienceHz: number;
}

interface MusicVoice {
  element: HTMLAudioElement;
  trackId: string;
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
  menu: { notes: BRIGHT_NOTES, intervalMs: 2700, ambienceHz: 1046.5 },
  glade: { notes: BRIGHT_NOTES, intervalMs: 2600, ambienceHz: 1174.66 },
  village: { notes: EARTHY_NOTES, intervalMs: 2600, ambienceHz: 783.99 },
  meadow: { notes: BRIGHT_NOTES, intervalMs: 2550, ambienceHz: 1046.5 },
  brook: { notes: EARTHY_NOTES, intervalMs: 2800, ambienceHz: 880 },
  woods: { notes: EARTHY_NOTES, intervalMs: 2900, ambienceHz: 659.25 },
  cottage: { notes: EARTHY_NOTES, intervalMs: 2850, ambienceHz: 698.46 },
  race: { notes: RACE_NOTES, intervalMs: 2500, ambienceHz: 1318.51 },
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

const NPC_REACTION_BASE_FREQUENCY: Readonly<Record<string, number>> = {
  nova: 698.46,
  willow: 493.88,
  pip: 880,
  pebble: 392,
  lumi: 659.25,
  marigold: 587.33,
};

const MUSIC_FADE_MS = 650;
const MAX_SFX_CACHE = 24;
const MAX_ACTIVE_SFX = 32;

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
  private currentProfile: AudioSceneProfile | null = null;
  private musicVoices: MusicVoice[] = [];
  private musicRequestId = 0;
  private playlist: readonly AudioCatalogueEntry[] = [];
  private lastPlaylistTrackId: string | null = null;
  private pendingMusicRetry = false;
  private sfxBuffers = new Map<string, AudioBuffer>();
  private activeSfx = new Set<AudioBufferSourceNode>();
  private visibilityListenerInstalled = false;

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
    this.applyMusicElementVolumes();
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
    const nextProfile = resolveAudioSceneProfile(sceneKey);
    if (this.currentSceneKey === sceneKey && this.currentProfile === nextProfile) {
      return;
    }
    this.currentSceneKey = sceneKey;
    this.currentProfile = nextProfile;
    this.musicStep = 0;
    this.restartSceneLoops();
  }

  public leaveScene(sceneKey: string): void {
    if (this.currentSceneKey !== sceneKey) {
      return;
    }
    this.currentSceneKey = null;
    this.currentProfile = null;
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
    if (shouldRestart || this.pendingMusicRetry) {
      this.pendingMusicRetry = false;
      this.restartSceneLoops();
    }
  }

  public playNpcReaction(characterId: string, reaction: NpcReaction = 'talk'): void {
    if (this.settings.muted || !this.settings.sfxEnabled) {
      return;
    }
    void this.unlock().then(() => {
      if (!this.sfxGain) {
        return;
      }
      const parts = characterId.split(':');
      const npcId = parts[parts.length - 1] ?? '';
      const base = NPC_REACTION_BASE_FREQUENCY[npcId] ?? 523.25;
      const multiplier = reaction === 'happy' ? 1.25 : reaction === 'surprised' ? 1.5 : 1;
      this.playTone(base * multiplier, 0.1, 'triangle', 0.055, this.sfxGain);
      this.playTone(base * multiplier * 1.125, 0.09, 'sine', 0.04, this.sfxGain, 0.055);
    });
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

  private restartSceneLoops(): void {
    this.stopProceduralLoops();
    this.musicRequestId += 1;
    if (!this.currentProfile || this.settings.muted) {
      this.fadeOutAllMusic();
      return;
    }

    if (this.settings.musicEnabled) {
      const manual = getAudioAsset(this.settings.selectedMusicTrackId);
      const context = resolveMusicContext(this.currentSceneKey ?? '');
      this.playlist = manual?.kind === 'music' ? [manual] : resolveContextPlaylist(context);
      if (this.playlist.length > 0) {
        this.startPlaylist(this.musicRequestId);
      } else {
        this.fadeOutAllMusic();
        this.startProceduralMusic(PROCEDURAL_PROFILES[this.currentProfile]);
      }
    } else {
      this.fadeOutAllMusic();
    }

    if (this.settings.ambienceEnabled) {
      this.startProceduralAmbience(PROCEDURAL_PROFILES[this.currentProfile]);
    }
  }

  private startPlaylist(requestId: number): void {
    const next = this.chooseNextTrack();
    if (!next) {
      return;
    }
    this.lastPlaylistTrackId = next.id;
    this.crossfadeTo(next, requestId);
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

  private crossfadeTo(track: AudioCatalogueEntry, requestId: number): void {
    if (typeof Audio === 'undefined' || requestId !== this.musicRequestId) {
      return;
    }
    const existingSameTrack = this.musicVoices.find((voice) => voice.trackId === track.id);
    if (existingSameTrack) {
      this.applyMusicElementVolumes();
      return;
    }

    const element = new Audio(this.assetUrl(track));
    element.preload = 'metadata';
    element.volume = 0;
    element.loop = this.playlist.length === 1;
    const voice: MusicVoice = { element, trackId: track.id };
    element.addEventListener('ended', () => {
      if (requestId === this.musicRequestId && this.playlist.length > 1) {
        this.startPlaylist(requestId);
      }
    });
    element.addEventListener('error', () => this.removeMusicVoice(voice));
    this.musicVoices.push(voice);
    while (this.musicVoices.length > 2) {
      const oldest = this.musicVoices.shift();
      oldest?.element.pause();
    }

    void element.play().then(
      () => this.fadeVoiceIn(voice),
      () => {
        this.pendingMusicRetry = true;
        this.removeMusicVoice(voice);
      },
    );
    for (const other of [...this.musicVoices]) {
      if (other !== voice) {
        this.fadeVoiceOut(other);
      }
    }
  }

  private fadeVoiceIn(voice: MusicVoice): void {
    const target = this.musicElementTargetVolume();
    this.animateVolume(voice, target, false);
  }

  private fadeVoiceOut(voice: MusicVoice): void {
    this.animateVolume(voice, 0, true);
  }

  private animateVolume(voice: MusicVoice, target: number, removeAfter: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }
    const start = performance.now();
    const initial = voice.element.volume;
    const tick = (now: number) => {
      if (!this.musicVoices.includes(voice)) {
        return;
      }
      const progress = Math.min(1, (now - start) / MUSIC_FADE_MS);
      voice.element.volume = Math.max(0, Math.min(1, initial + (target - initial) * progress));
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else if (removeAfter) {
        this.removeMusicVoice(voice);
      }
    };
    window.requestAnimationFrame(tick);
  }

  private removeMusicVoice(voice: MusicVoice): void {
    voice.element.pause();
    voice.element.removeAttribute('src');
    this.musicVoices = this.musicVoices.filter((candidate) => candidate !== voice);
  }

  private fadeOutAllMusic(): void {
    for (const voice of [...this.musicVoices]) {
      this.fadeVoiceOut(voice);
    }
  }

  private musicElementTargetVolume(): number {
    if (this.settings.muted || !this.settings.musicEnabled) {
      return 0;
    }
    return Math.min(1, this.settings.masterVolume * this.settings.musicVolume * 0.72);
  }

  private applyMusicElementVolumes(): void {
    const target = this.musicElementTargetVolume();
    for (const voice of this.musicVoices) {
      voice.element.volume = target;
    }
  }

  private assetUrl(asset: AudioCatalogueEntry): string {
    return `${asset.path}?v=${asset.sha256.slice(0, 12)}`;
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
      if (this.activeSfx.size >= MAX_ACTIVE_SFX) {
        const oldest = this.activeSfx.values().next().value as AudioBufferSourceNode | undefined;
        oldest?.stop();
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGain);
      this.activeSfx.add(source);
      source.addEventListener('ended', () => {
        this.activeSfx.delete(source);
        source.disconnect();
      });
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
    const play = () => this.playTone(definition.ambienceHz, 0.28, 'sine', 0.024, gain);
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
    this.musicRequestId += 1;
    for (const voice of [...this.musicVoices]) {
      this.removeMusicVoice(voice);
    }
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
    delaySeconds = 0,
  ): void {
    if (!this.context) {
      return;
    }
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const start = this.context.currentTime + delaySeconds;
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
    if (typeof document === 'undefined' || this.visibilityListenerInstalled) {
      return;
    }
    this.visibilityListenerInstalled = true;
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
