import {
  type AudioSettings,
  type AudioSettingsStore,
  getBrowserAudioSettingsStore,
} from './AudioSettings';

export type VerticalSliceSfx = 'ui' | 'dialogue' | 'collect' | 'discovery' | 'quest-complete';
export type AudioSceneProfile = 'glade' | 'village' | 'cottage';

interface SceneAudioDefinition {
  musicNotes: readonly number[];
  musicIntervalMs: number;
  musicWave: OscillatorType;
  ambienceFilterHz: number;
  ambienceNotes: readonly number[];
}

const SCENE_AUDIO: Record<AudioSceneProfile, SceneAudioDefinition> = {
  glade: {
    musicNotes: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392],
    musicIntervalMs: 760,
    musicWave: 'triangle',
    ambienceFilterHz: 920,
    ambienceNotes: [1046.5, 1318.51, 1174.66],
  },
  village: {
    musicNotes: [392, 493.88, 587.33, 523.25, 493.88, 440, 523.25, 659.25],
    musicIntervalMs: 620,
    musicWave: 'triangle',
    ambienceFilterHz: 720,
    ambienceNotes: [659.25, 783.99, 880],
  },
  cottage: {
    musicNotes: [349.23, 440, 523.25, 440, 392, 440, 349.23, 293.66],
    musicIntervalMs: 820,
    musicWave: 'sine',
    ambienceFilterHz: 540,
    ambienceNotes: [698.46, 783.99],
  },
};

const SCENE_PROFILE_BY_KEY: Readonly<Record<string, AudioSceneProfile>> = {
  TitleScene: 'glade',
  MoonflowerGladeScene: 'glade',
  MoonflowerPatchScene: 'glade',
  SunbeamVillageScene: 'village',
  CottageInteriorScene: 'cottage',
};

export function resolveAudioSceneProfile(sceneKey: string): AudioSceneProfile | null {
  return SCENE_PROFILE_BY_KEY[sceneKey] ?? null;
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
    this.musicGain.gain.setTargetAtTime(this.settings.musicEnabled ? 0.16 : 0, now, 0.04);
    this.ambienceGain.gain.setTargetAtTime(this.settings.ambienceEnabled ? 0.09 : 0, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxEnabled ? 0.7 : 0, now, 0.02);
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
      this.ambienceTimer = window.setInterval(() => this.playAmbienceDetail(definition), 4800);
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
    this.playTone(note, 0.52, definition.musicWave, 0.055, this.musicGain);
    if (this.musicStep % 4 === 1) {
      this.playTone(note / 2, 0.68, 'sine', 0.025, this.musicGain);
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
    gain.gain.value = 0.12;
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
    this.playTone(note, 0.25, 'sine', 0.045, this.ambienceGain);
    if (this.currentProfile === 'glade') {
      this.playTone(note * 1.25, 0.17, 'sine', 0.025, this.ambienceGain, 0.12);
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
