import type Phaser from 'phaser';
import { MUSIC_CATALOGUE } from '../../generated/audioCatalogue';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';

const VOLUMES = [
  ['master-volume', 'masterVolume'],
  ['music-volume', 'musicVolume'],
  ['ambience-volume', 'ambienceVolume'],
  ['sfx-volume', 'sfxVolume'],
] as const;

export function getSettingsAudioControlsManager(game: Phaser.Game): void {
  const host = document.getElementById('game-container')!;
  const audio = getVerticalSliceAudio();
  const sliders = VOLUMES.map(([kind, key]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.max = '1';
    input.step = '.01';
    input.ariaLabel = kind;
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
    const canvas = game.canvas;
    const sx = canvas.clientWidth / 1280;
    const sy = canvas.clientHeight / 720;
    const row = (kind: string) =>
      scene.children.getByName(`settings-row-${kind}`) as Phaser.GameObjects.Rectangle | null;
    const place = (target: Phaser.GameObjects.Rectangle, control: HTMLElement) => {
      control.style.width = `${470 * sx}px`;
      control.style.left = `${canvas.offsetLeft + 405 * sx}px`;
      control.style.top = `${canvas.offsetTop + (target.y + 13) * sy}px`;
    };

    for (const [kind, key, input] of sliders) {
      const target = row(kind);
      input.value = String(settings[key]);
      input.hidden = !target?.visible;
      if (!input.hidden) place(target!, input);
    }

    const mode = row('music');
    select.hidden = settings.musicEnabled || !mode?.visible;
    if (!select.hidden) {
      select.value = settings.selectedMusicTrackId ?? MUSIC_CATALOGUE[0]?.id ?? '';
      place(mode!, select);
    }
  });
}
