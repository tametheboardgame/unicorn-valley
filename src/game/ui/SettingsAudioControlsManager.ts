import type Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';

const VOLUMES = [
  ['master-volume', 'masterVolume', 'All sound'],
  ['music-volume', 'musicVolume', 'Music volume'],
  ['ambience-volume', 'ambienceVolume', 'Ambience volume'],
  ['sfx-volume', 'sfxVolume', 'Effects volume'],
] as const;

let installed = false;

export function getSettingsAudioControlsManager(game: Phaser.Game): void {
  if (installed) return;
  const host = document.getElementById('game-container');
  if (!host) return;
  installed = true;

  const audio = getVerticalSliceAudio();
  const sliders = VOLUMES.map(([kind, key, label]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.setAttribute('aria-label', label);
    input.style.cssText = 'position:absolute;z-index:1100;accent-color:#9d72ad';
    input.addEventListener('input', () =>
      audio.updateSettings({ [key]: Number(input.value) }),
    );
    host.append(input);
    return [kind, key, input] as const;
  });

  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Chosen music track');
  select.style.cssText =
    'position:absolute;z-index:1100;border:3px solid #9d72ad;border-radius:12px;padding:7px';
  for (const track of audio.getMusicTracks()) {
    const option = document.createElement('option');
    option.value = track.id;
    option.textContent = track.label;
    select.append(option);
  }
  select.addEventListener('change', () =>
    audio.updateSettings({ musicEnabled: false, selectedMusicTrackId: select.value }),
  );
  host.append(select);

  const controls = [...sliders.map(([, , input]) => input), select];
  game.events.on('poststep', () => {
    const scene = game.scene.getScene('SettingsScene');
    if (!scene?.scene.isActive()) {
      for (const control of controls) control.hidden = true;
      return;
    }
    const settings = audio.getSettings();
    const canvas = game.canvas.getBoundingClientRect();
    const box = host.getBoundingClientRect();
    const sx = canvas.width / 1280;
    const sy = canvas.height / 720;
    const place = (kind: string, control: HTMLElement, width: number, show = true) => {
      const row = scene.children.getByName(
        `settings-row-${kind}`,
      ) as Phaser.GameObjects.Rectangle | null;
      if (row?.input) row.input.enabled = false;
      control.hidden = !show || !row?.visible;
      if (control.hidden || !row) return;
      control.style.width = `${width * sx}px`;
      control.style.left = `${canvas.left - box.left + 695 * sx}px`;
      control.style.top = `${canvas.top - box.top + (row.y - 18) * sy}px`;
    };

    for (const [kind, key, input] of sliders) {
      input.value = String(settings[key]);
      place(kind, input, 220);
    }
    select.value = settings.selectedMusicTrackId ?? select.value;
    place('music-track', select, 255, !settings.musicEnabled);
  });
}
