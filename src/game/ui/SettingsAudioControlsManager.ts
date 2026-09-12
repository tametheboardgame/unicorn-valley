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
  for (const track of MUSIC_CATALOGUE) select.add(new Option(track.label, track.id));
  select.onchange = () => audio.updateSettings({ selectedMusicTrackId: select.value });
  host.append(select);

  game.events.on('poststep', () => {
    const scene = game.scene.getScene('SettingsScene');
    const active = scene?.scene.isActive();
    const settings = audio.getSettings();
    const canvas = game.canvas.getBoundingClientRect();
    const box = host.getBoundingClientRect();
    const sx = canvas.width / 1280;
    const sy = canvas.height / 720;
    const place = (kind: string, control: HTMLElement, width: number, show = true) => {
      const row = active
        ? (scene.children.getByName(`settings-row-${kind}`) as Phaser.GameObjects.Rectangle | null)
        : null;
      if (row?.input) row.input.enabled = false;
      control.hidden = !show || !row?.visible;
      if (!row || control.hidden) return;
      control.style.width = `${width * sx}px`;
      control.style.left = `${canvas.left - box.left + 695 * sx}px`;
      control.style.top = `${canvas.top - box.top + (row.y - 18) * sy}px`;
    };

    for (const [kind, key, input] of sliders) {
      input.value = String(settings[key]);
      place(kind, input, 220);
    }
    select.value = settings.selectedMusicTrackId ?? select.value;
    place('music', select, 220, !settings.musicEnabled);
  });
}
