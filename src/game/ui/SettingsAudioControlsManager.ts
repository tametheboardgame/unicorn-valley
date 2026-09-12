import type Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';

const VOLUMES = [
  ['master-volume', 'masterVolume', 'All sound'],
  ['music-volume', 'musicVolume', 'Music volume'],
  ['ambience-volume', 'ambienceVolume', 'Ambience volume'],
  ['sfx-volume', 'sfxVolume', 'Effects volume'],
] as const;

class SettingsAudioControlsManager {
  private readonly audio = getVerticalSliceAudio();
  private readonly controls = new Map<string, HTMLInputElement>();
  private trackSelect: HTMLSelectElement | null = null;

  public constructor(private readonly game: Phaser.Game) {
    game.events.on('poststep', this.update, this);
  }

  private update(): void {
    const scene = this.game.scene.getScene('SettingsScene');
    if (!scene?.scene.isActive()) {
      this.setVisible(false);
      return;
    }
    this.ensureControls();
    const settings = this.audio.getSettings();
    if (!settings.musicEnabled && !settings.selectedMusicTrackId) {
      const first = this.audio.getMusicTracks()[0];
      if (first) this.audio.updateSettings({ selectedMusicTrackId: first.id });
    }

    for (const [kind, key, label] of VOLUMES) {
      const input = this.controls.get(kind);
      if (!input) continue;
      input.value = String(this.audio.getSettings()[key]);
      this.place(scene, kind, input, 220);
      const text = scene.children.getByName(
        `settings-row-${kind}-label`,
      ) as Phaser.GameObjects.Text | null;
      text
        ?.setText(`${label} · ${Math.round(Number(input.value) * 100)}%`)
        .setX(430)
        .setOrigin(0, 0.5);
      const row = scene.children.getByName(
        `settings-row-${kind}`,
      ) as Phaser.GameObjects.Rectangle | null;
      if (row?.input) row.input.enabled = false;
    }

    const trackRow = scene.children.getByName(
      'settings-row-music-track',
    ) as Phaser.GameObjects.Rectangle | null;
    const trackLabel = scene.children.getByName(
      'settings-row-music-track-label',
    ) as Phaser.GameObjects.Text | null;
    if (trackRow?.input) trackRow.input.enabled = false;
    trackLabel
      ?.setText(settings.musicEnabled ? 'Track follows each area' : 'Chosen track')
      .setX(settings.musicEnabled ? 640 : 430)
      .setOrigin(settings.musicEnabled ? 0.5 : 0, 0.5);
    if (this.trackSelect) {
      this.trackSelect.value = settings.selectedMusicTrackId ?? this.trackSelect.value;
      this.place(scene, 'music-track', this.trackSelect, 255, !settings.musicEnabled);
    }
  }

  private ensureControls(): void {
    if (this.trackSelect) return;
    const host = document.getElementById('game-container');
    if (!host) return;

    for (const [kind, key, label] of VOLUMES) {
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '1';
      input.step = '0.01';
      input.setAttribute('aria-label', label);
      input.style.cssText =
        'position:absolute;z-index:1100;accent-color:#9d72ad;cursor:pointer;height:28px';
      input.addEventListener('input', () =>
        this.audio.updateSettings({ [key]: Number(input.value) }),
      );
      host.append(input);
      this.controls.set(kind, input);
    }

    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Chosen music track');
    select.style.cssText =
      'position:absolute;z-index:1100;border:3px solid #9d72ad;border-radius:12px;background:#fffbee;color:#5c4568;font:700 14px system-ui;padding:7px 10px;cursor:pointer';
    for (const track of this.audio.getMusicTracks()) {
      const option = document.createElement('option');
      option.value = track.id;
      option.textContent = track.label;
      select.append(option);
    }
    select.addEventListener('change', () =>
      this.audio.updateSettings({ musicEnabled: false, selectedMusicTrackId: select.value }),
    );
    host.append(select);
    this.trackSelect = select;
  }

  private place(
    scene: Phaser.Scene,
    kind: string,
    control: HTMLElement,
    width: number,
    enabled = true,
  ): void {
    const row = scene.children.getByName(
      `settings-row-${kind}`,
    ) as Phaser.GameObjects.Rectangle | null;
    const host = document.getElementById('game-container');
    if (!row || !host || !enabled || !row.visible) {
      control.hidden = true;
      return;
    }
    const canvas = this.game.canvas.getBoundingClientRect();
    const box = host.getBoundingClientRect();
    const sx = canvas.width / 1280;
    const sy = canvas.height / 720;
    control.hidden = false;
    control.style.width = `${width * sx}px`;
    control.style.left = `${canvas.left - box.left + 695 * sx}px`;
    control.style.top = `${canvas.top - box.top + (row.y - 18) * sy}px`;
  }

  private setVisible(visible: boolean): void {
    for (const control of this.controls.values()) control.hidden = !visible;
    if (this.trackSelect) this.trackSelect.hidden = !visible;
  }
}

let manager: SettingsAudioControlsManager | null = null;

export function getSettingsAudioControlsManager(game: Phaser.Game): SettingsAudioControlsManager {
  manager ??= new SettingsAudioControlsManager(game);
  return manager;
}
