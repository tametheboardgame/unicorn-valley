import type Phaser from 'phaser';
import { MUSIC_CATALOGUE } from '../../generated/audioCatalogue';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';

const VOLUMES = [
  ['master-volume', 'masterVolume', 'All sound'],
  ['music-volume', 'musicVolume', 'Music volume'],
  ['ambience-volume', 'ambienceVolume', 'Ambience volume'],
  ['sfx-volume', 'sfxVolume', 'Effects volume'],
] as const;

export function getSettingsAudioControlsManager(game: Phaser.Game): void {
  const host = document.getElementById('game-container')!;
  const audio = getVerticalSliceAudio();
  const sliders = VOLUMES.map(([kind, key, label]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.max = '1';
    input.step = '.01';
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
  select.onpointerdown = (event) => event.stopPropagation();
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
    const row = (kind: string) =>
      scene.children.getByName(`settings-row-${kind}`) as Phaser.GameObjects.Rectangle | null;
    const place = (target: Phaser.GameObjects.Rectangle, control: HTMLElement) => {
      control.style.width = `${470 * sx}px`;
      control.style.left = `${canvas.left - box.left + 405 * sx}px`;
      control.style.top = `${canvas.top - box.top + (target.y + 4) * sy}px`;
    };

    for (const [kind, key, input] of sliders) {
      const target = row(kind);
      input.value = String(settings[key]);
      input.hidden = !target?.visible;
      if (!target || input.hidden) continue;
      const label = scene.children.getByName(
        `settings-row-${kind}-label`,
      ) as Phaser.GameObjects.Text | null;
      label?.setY(target.y - 13);
      place(target, input);
    }

    const mode = row('music');
    const modeLabel = scene.children.getByName(
      'settings-row-music-label',
    ) as Phaser.GameObjects.Text | null;
    select.hidden = settings.musicEnabled || !mode?.visible;
    if (mode) modeLabel?.setY(mode.y - (select.hidden ? 0 : 13));
    if (!select.hidden && mode) {
      select.value = settings.selectedMusicTrackId ?? MUSIC_CATALOGUE[0]?.id ?? '';
      place(mode, select);
    }
  });
}
