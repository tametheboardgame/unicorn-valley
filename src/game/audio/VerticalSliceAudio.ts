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

interface SceneAudioDefinition {
  musicNotes: readonly number[];
  musicIntervalMs: number;
  musicWave: OscillatorType;
  ambienceFilterHz: number;
  ambienceNotes: readonly number[];
  ambienceIntervalMs: number;
  ambienceWave: OscillatorType;
  ambienceBedVolume: number;
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

const SCENE_AUDIO: Record<AudioSceneProfile, SceneAudioDefinition> = {
  menu: {
    musicNotes: [
      523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 783.99, 880, 783.99, 698.46,
      659.25, 587.33, 523.25, 587.33, 659.25, 523.25,
    ],
    musicIntervalMs: 920,
    musicWave: 'sine',
    ambienceFilterHz: 760,
    ambienceNotes: [1046.5, 1318.51, 1174.66, 1567.98],
    ambienceIntervalMs: 5600,
    ambienceWave: 'sine',
    ambienceBedVolume: 0.09,
  },
  glade: {
    musicNotes: [
      523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392, 440, 523.25, 659.25,
      783.99, 880, 783.99, 698.46, 659.25, 587.33, 523.25, 493.88, 523.25, 587.33, 659.25,
      523.25, 392,
    ],
    musicIntervalMs: 760,
    musicWave: 'triangle',
    ambienceFilterHz: 920,
    ambienceNotes: [1046.5, 1318.51, 1174.66, 1396.91],
    ambienceIntervalMs: 5200,
    ambienceWave: 'sine',
    ambienceBedVolume: 0.1,
  },
  village: {
    musicNotes: [
      392, 493.88, 587.33, 523.25, 493.88, 440, 523.25, 659.25, 587.33, 659.25, 783.99,
      659.25, 587.33, 523.25, 493.88, 440, 493.88, 587.33, 659.25, 783.99, 698.46, 659.25,
      523.25, 392,
    ],
    musicIntervalMs: 620,
    musicWave: 'triangle',
    ambienceFilterHz: 720,
    ambienceNotes: [659.25, 783.99, 880, 987.77, 783.99],
    ambienceIntervalMs: 4300,
    ambienceWave: 'triangle',
    ambienceBedVolume: 0.08,
  },
  meadow: {
    musicNotes: [
      392, 523.25, 659.25, 783.99, 659.25, 783.99, 880, 1046.5, 880, 783.99, 698.46, 659.25,
      587.33, 659.25, 783.99, 880, 987.77, 880, 783.99, 659.25, 587.33, 523.25, 493.88, 392,
    ],
    musicIntervalMs: 680,
    musicWave: 'triangle',
    ambienceFilterHz: 1180,
    ambienceNotes: [880, 1046.5, 1174.66, 1318.51],
    ambienceIntervalMs: 5900,
    ambienceWave: 'sine',
    ambienceBedVolume: 0.08,
  },
  brook: {
    musicNotes: [
      349.23, 440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440, 523.25, 587.33, 698.46,
      783.99, 698.46, 587.33, 523.25, 493.88, 523.25, 659.25, 783.99, 698.46, 587.33, 440,
      349.23,
    ],
    musicIntervalMs: 820,
    musicWave: 'sine',
    ambienceFilterHz: 1480,
    ambienceNotes: [659.25, 783.99, 987.77, 1174.66, 880],
    ambienceIntervalMs: 4700,
    ambienceWave: 'sine',
    ambienceBedVolume: 0.12,
  },
  woods: {
    musicNotes: [
      293.66, 349.23, 440, 523.25, 493.88, 440, 392, 349.23, 293.66, 392, 440, 523.25, 587.33,
      523.25, 440, 392, 349.23, 440, 493.88, 587.33, 523.25, 440, 349.23, 293.66,
    ],
    musicIntervalMs: 880,
    musicWave: 'sine',
    ambienceFilterHz: 620,
    ambienceNotes: [523.25, 659.25, 783.99, 698.46],
    ambienceIntervalMs: 6100,
    ambienceWave: 'sine',
    ambienceBedVolume: 0.1,
  },
  cottage: {
    musicNotes: [
      349.23, 440, 523.25, 440, 392, 440, 349.23, 293.66, 349.23, 392, 440, 523.25, 587.33,
      523.25, 440, 392, 349.23, 440, 392, 349.23,
    ],
    musicIntervalMs: 840,
    musicWave: 'sine',
    ambienceFilterHz: 540,
    ambienceNotes: [698.46, 783.99, 659.25],
    ambienceIntervalMs: 6500,
    ambienceWave: 'sine',
    ambienceBedVolume: 0.07,
  },
  race: {
    musicNotes: [
      523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 783.99, 587.33, 698.46, 880,
      1174.66, 987.77, 880, 783.99, 698.46, 659.25, 783.99, 987.77, 1318.51, 1174.66,
      987.77, 880, 783.99, 698.46, 783.99, 880, 1046.5, 987.77, 880, 659.25, 523.25,
    ],
    musicIntervalMs: 340,
    musicWave: 'triangle',
    ambienceFilterHz: 1250,
    ambienceNotes: [1046.5, 1318.51, 1567.98, 1174.66],
    ambienceIntervalMs: 3900,
    ambienceWave: 'triangle',
    ambienceBedVolume: 0.07,
  },
};

const SCENE_PROFILE_BY_KEY: Readonly<Record<string, AudioSceneProfile>> = {
  TitleScene: 'menu',
  MoonflowerGladeScene: 'glade',
  MoonflowerPatchScene: 'glade',
  SunbeamVillageScene: 'village',
  RainbowMeadowScene: 'meadow',
  CrystalBrookScene: 'brook',
  WhisperingWoodsScene: 'woods',
  CottageInteriorScene: 'cottage',
  RaceScene: 'race',
  NovaTutorialRaceScene: 'race',
};

const NPC_REACTION_BASE_FREQUENCY: Readonly<Record<string, number>> = {
  nova: 698.46,
  willow: 493.88,
  pip: 880,
  pebble: 392,
  lumi: 659.25,
  marigold: 587.33,
};

export function resolveAudioSceneProfile(sceneKey: string): AudioSceneProfile | null {
  return SCENE_PROFILE_BY_KEY[sceneKey] ?? null;
}

export function getAudioSceneLoopDurationMs(profile: AudioSceneProfile): number {
  const definition = SCENE_AUDIO[profile];
  return definition.musicNotes.length * definition.musicIntervalMs;
}

export class VerticalSliceAudio {
  private settings: AudioSettings;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private musicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private musicStep = 0;
  private ambienceStep = 0;
  private currentSceneKey: string | null = null;
  private currentProfile: AudioSceneProfile | null = null;

  public constructor(
    private readonly settingsStore: AudioSettingsStore = getBrowserAudioSettingsStore(),
  ) {
    this.settings = settingsStore.load();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public setSettings(settings: AudioSettings): AudioSettings {
    this.settings = this.settingsStore.save(settings);
    this.applyGainSettings();
    this.restartSceneLoops();
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
    this.ambienceStep = 0;
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
      await this.context.resume();
      shouldRestart = true;
    }

    this.applyGainSettings();
    if (shouldRestart) {
      this.restartSceneLoops();
    }
  }

  public playNpcReaction(characterId: string, reaction: NpcReaction = 'talk'): void {
    if (this.settings.muted || !this.settings.sfxEnabled) {
      return;
    }

    void this.unlock().then(() => {
      if (!this.context || !this.sfxGain || this.context.state !== 'running') {
        return;
      }

      const parts = characterId.split(':');
      const npcId = parts[parts.length - 1] ?? '';
      const base = NPC_REACTION_BASE_FREQUENCY[npcId] ?? 523.25;
      if (reaction === 'happy') {
        this.playTone(base, 0.07, 'triangle', 0.055, this.sfxGain);
        this.playTone(base * 1.25, 0.08, 'triangle', 0.05, this.sfxGain, 0.055);
        this.playTone(base * 1.5, 0.1, 'sine', 0.04, this.sfxGain, 0.12);
      } else if (reaction === 'surprised') {
        this.playTone(base * 1.5, 0.07, 'sine', 0.055, this.sfxGain);
        this.playTone(base, 0.1, 'triangle', 0.045, this.sfxGain, 0.075);
      } else {
        this.playTone(base, 0.065, 'triangle', 0.05, this.sfxGain);
        this.playTone(base * 1.125, 0.07, 'triangle', 0.04, this.sfxGain, 0.05);
      }
    });
  }

  public playSfx(kind: VerticalSliceSfx): void {
    if (this.settings.muted || !this.settings.sfxEnabled) {
      return;
    }

    void this.unlock().then(() => {
      if (!this.context || !this.sfxGain || this.context.state !== 'running') {
        return;
      }

      switch (kind) {
        case 'ui':
          this.playTone(659.25, 0.09, 'sine', 0.1, this.sfxGain);
          break;
        case 'ui-back':
          this.playTone(659.25, 0.07, 'sine', 0.07, this.sfxGain);
          this.playTone(493.88, 0.1, 'sine', 0.055, this.sfxGain, 0.055);
          break;
        case 'dialogue':
          this.playTone(523.25, 0.08, 'triangle', 0.075, this.sfxGain);
          this.playTone(659.25, 0.07, 'triangle', 0.055, this.sfxGain, 0.055);
          break;
        case 'collect':
          this.playTone(659.25, 0.13, 'triangle', 0.12, this.sfxGain);
          this.playTone(880, 0.17, 'triangle', 0.1, this.sfxGain, 0.08);
          break;
        case 'discovery':
          this.playTone(523.25, 0.18, 'sine', 0.11, this.sfxGain);
          this.playTone(783.99, 0.22, 'sine', 0.1, this.sfxGain, 0.11);
          this.playTone(1046.5, 0.28, 'sine', 0.085, this.sfxGain, 0.23);
          break;
        case 'quest-complete':
          this.playTone(523.25, 0.2, 'triangle', 0.095, this.sfxGain);
          this.playTone(659.25, 0.22, 'triangle', 0.085, this.sfxGain, 0.12);
          this.playTone(783.99, 0.3, 'triangle', 0.08, this.sfxGain, 0.24);
          break;
        case 'friendship':
          this.playTone(587.33, 0.11, 'sine', 0.08, this.sfxGain);
          this.playTone(783.99, 0.14, 'sine', 0.075, this.sfxGain, 0.08);
          this.playTone(987.77, 0.2, 'sine', 0.06, this.sfxGain, 0.17);
          break;
        case 'door':
          this.playTone(392, 0.12, 'triangle', 0.055, this.sfxGain);
          this.playTone(523.25, 0.15, 'sine', 0.05, this.sfxGain, 0.08);
          break;
        case 'decoration':
          this.playTone(659.25, 0.1, 'sine', 0.075, this.sfxGain);
          this.playTone(987.77, 0.18, 'sine', 0.065, this.sfxGain, 0.08);
          break;
        case 'race-countdown':
          this.playTone(523.25, 0.11, 'triangle', 0.12, this.sfxGain);
          break;
        case 'race-go':
          this.playTone(659.25, 0.12, 'triangle', 0.12, this.sfxGain);
          this.playTone(1046.5, 0.2, 'triangle', 0.11, this.sfxGain, 0.07);
          break;
        case 'race-jump':
          this.playTone(523.25, 0.08, 'sine', 0.07, this.sfxGain);
          this.playTone(783.99, 0.12, 'sine', 0.06, this.sfxGain, 0.045);
          break;
        case 'race-boost':
          this.playTone(659.25, 0.08, 'triangle', 0.075, this.sfxGain);
          this.playTone(987.77, 0.11, 'triangle', 0.07, this.sfxGain, 0.045);
          this.playTone(1318.51, 0.16, 'sine', 0.05, this.sfxGain, 0.11);
          break;
        case 'race-impact':
          this.playTone(220, 0.11, 'triangle', 0.06, this.sfxGain);
          this.playTone(174.61, 0.14, 'sine', 0.045, this.sfxGain, 0.045);
          break;
        case 'race-finish':
          this.playTone(659.25, 0.18, 'triangle', 0.11, this.sfxGain);
          this.playTone(783.99, 0.2, 'triangle', 0.1, this.sfxGain, 0.09);
          this.playTone(1046.5, 0.3, 'triangle', 0.1, this.sfxGain, 0.19);
          break;
      }
    });
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
    this.musicGain.gain.setTargetAtTime(this.settings.musicEnabled ? 0.14 : 0, now, 0.04);
    this.ambienceGain.gain.setTargetAtTime(this.settings.ambienceEnabled ? 0.08 : 0, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxEnabled ? 0.68 : 0, now, 0.02);
  }

  private restartSceneLoops(): void {
    this.stopSceneLoops();
    if (
      !this.context ||
      this.context.state !== 'running' ||
      !this.currentProfile ||
      this.settings.muted
    ) {
      return;
    }

    const definition = SCENE_AUDIO[this.currentProfile];
    if (this.settings.musicEnabled) {
      this.playMusicStep(definition);
      this.musicTimer = window.setInterval(
        () => this.playMusicStep(definition),
        definition.musicIntervalMs,
      );
    }

    if (this.settings.ambienceEnabled) {
      this.startAmbienceBed(definition);
      this.playAmbienceDetail(definition);
      this.ambienceTimer = window.setInterval(
        () => this.playAmbienceDetail(definition),
        definition.ambienceIntervalMs,
      );
    }
  }

  private stopSceneLoops(): void {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
    }
    if (this.ambienceTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.ambienceTimer);
    }
    this.musicTimer = null;
    this.ambienceTimer = null;
    this.ambienceSource?.stop();
    this.ambienceSource?.disconnect();
    this.ambienceSource = null;
  }

  private playMusicStep(definition: SceneAudioDefinition): void {
    if (!this.musicGain || !this.context || !this.settings.musicEnabled || this.settings.muted) {
      return;
    }

    const note = definition.musicNotes[this.musicStep % definition.musicNotes.length];
    this.musicStep += 1;
    this.playTone(note, 0.52, definition.musicWave, 0.05, this.musicGain);
    if (this.musicStep % 4 === 1) {
      this.playTone(note / 2, 0.68, 'sine', 0.022, this.musicGain);
    }
    if (this.musicStep % 8 === 5 && this.currentProfile !== 'race') {
      this.playTone(note * 1.5, 0.34, 'sine', 0.014, this.musicGain, 0.08);
    }
  }

  private startAmbienceBed(definition: SceneAudioDefinition): void {
    if (!this.context || !this.ambienceGain) {
      return;
    }

    const bufferLength = Math.floor(this.context.sampleRate * 2);
    const buffer = this.context.createBuffer(1, bufferLength, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.985 + white * 0.015;
      data[index] = previous * 0.34;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = definition.ambienceFilterHz;
    gain.gain.value = definition.ambienceBedVolume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    source.start();
    this.ambienceSource = source;
  }

  private playAmbienceDetail(definition: SceneAudioDefinition): void {
    if (
      !this.ambienceGain ||
      !this.context ||
      !this.settings.ambienceEnabled ||
      this.settings.muted
    ) {
      return;
    }

    const note = definition.ambienceNotes[this.ambienceStep % definition.ambienceNotes.length];
    this.ambienceStep += 1;
    this.playTone(note, 0.25, definition.ambienceWave, 0.035, this.ambienceGain);

    switch (this.currentProfile) {
      case 'menu':
      case 'glade':
        this.playTone(note * 1.25, 0.17, 'sine', 0.02, this.ambienceGain, 0.12);
        break;
      case 'village':
        this.playTone(note * 1.5, 0.1, 'triangle', 0.015, this.ambienceGain, 0.16);
        break;
      case 'meadow':
        this.playTone(note * 0.75, 0.38, 'sine', 0.015, this.ambienceGain, 0.18);
        break;
      case 'brook':
        this.playTone(note * 0.5, 0.42, 'sine', 0.02, this.ambienceGain, 0.08);
        this.playTone(note * 1.125, 0.16, 'sine', 0.018, this.ambienceGain, 0.22);
        break;
      case 'woods':
        this.playTone(note * 0.75, 0.48, 'sine', 0.018, this.ambienceGain, 0.12);
        break;
      case 'cottage':
        this.playTone(note * 0.75, 0.26, 'sine', 0.012, this.ambienceGain, 0.15);
        break;
      case 'race':
        this.playTone(note * 0.75, 0.12, 'triangle', 0.018, this.ambienceGain, 0.08);
        break;
      default:
        break;
    }
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
}

let verticalSliceAudio: VerticalSliceAudio | null = null;

export function getVerticalSliceAudio(): VerticalSliceAudio {
  verticalSliceAudio ??= new VerticalSliceAudio();
  return verticalSliceAudio;
}
