import type Phaser from 'phaser';
import { MUSIC_CATALOGUE } from '../../generated/audioCatalogue';
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
    input.max = '1';
    input.step = '0.01';
    input.ariaLabel = label;
    input.style.position = 'absolute';
    input.oninput = () => audio.updateSettings({ [key]: +input.value });
    host.append(input);
    return [kind, key, input] as const;
  });
  const select = document.createElement('select');
  select.ariaLabel = 'Chosen music track';
  select.style.position = 'absolute';
  for (const track of MUSIC_CATALOGUE) {
    select.add(new Option(track.path.slice(track.path.lastIndexOf('/') + 1, -4), track.id));
  }
  select.onchange = () => audio.updateSettings({ selectedMusicTrackId: select.value });
  host.append(select);

  game.events.on('poststep', () => {
    const scene = game.scene.getScene('SettingsScene');
    if (!scene?.scene.isActive()) {
      select.hidden = true;
      for (const [, , input] of sliders) input.hidden = true;
      return;
    }
    const settings = audio.getSettings();
    const canvas = game.canvas.getBoundingClientRect();
    const box = host.getBoundingClientRect();
    const sx = canvas.width / 1280;
    const sy = canvas.height / 720;
    const left = `${canvas.left - box.left + 695 * sx}px`;
    const place = (kind: string, control: HTMLElement, show = true) => {
      const row = scene.children.getByName(
        `settings-row-${kind}`,
      ) as Phaser.GameObjects.Rectangle | null;
      if (row?.input) row.input.enabled = false;
      control.hidden = !show || !row?.visible;
      if (!row || control.hidden) return;
      control.style.width = `${220 * sx}px`;
      control.style.left = left;
      control.style.top = `${canvas.top - box.top + (row.y - 18) * sy}px`;
    };
    for (const [kind, key, input] of sliders) {
      input.value = String(settings[key]);
      place(kind, input);
    }
    select.value = settings.selectedMusicTrackId ?? select.value;
    place('music', select, !settings.musicEnabled);
  });
}
