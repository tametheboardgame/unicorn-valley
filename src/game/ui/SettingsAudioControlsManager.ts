import type Phaser from 'phaser';
import { MUSIC_CATALOGUE } from '../../generated/audioCatalogue';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';

const VOLUMES = [
  ['master-volume', 'masterVolume', 'All sound'],
  ['music-volume', 'musicVolume', 'Music volume'],
  ['ambience-volume', 'ambienceVolume', 'Ambience volume'],
  ['sfx-volume', 'sfxVolume', 'Effects volume'],
] as const;
const TRACK_GAP = 58;

type LayoutScene = Phaser.Scene & {
  rows?: Array<{ kind: string; contentY: number }>;
  sectionHeadings?: Array<{ contentY: number }>;
  contentHeight?: number;
  maxScroll?: number;
  scrollOffset?: number;
  setScrollOffset?: (value: number) => void;
};

export function getSettingsAudioControlsManager(game: Phaser.Game): void {
  const host = document.getElementById('game-container')!;
  const audio = getVerticalSliceAudio();
  const arranged = new WeakMap<Phaser.Scene, object>();
  const sliders = VOLUMES.map(([kind, key, label]) => {
    const input = document.createElement('input');
    input.type = 'range';
    input.max = '1';
    input.step = '.01';
    input.ariaLabel = label;
    input.style.position = 'absolute';
    input.style.zIndex = '50';
    input.style.accentColor = '#7b4ea3';
    input.oninput = () => audio.updateSettings({ [key]: +input.value });
    host.append(input);
    return [kind, key, input] as const;
  });

  const select = document.createElement('select');
  select.ariaLabel = 'Chosen music track';
  select.style.position = 'absolute';
  select.style.zIndex = '51';
  select.style.height = '34px';
  select.style.borderRadius = '9px';
  for (const track of MUSIC_CATALOGUE) {
    select.add(new Option(track.path.slice(track.path.lastIndexOf('/') + 1, -4).replaceAll('-', ' '), track.id));
  }
  select.onchange = () => audio.updateSettings({ selectedMusicTrackId: select.value });
  select.onpointerdown = (event) => event.stopPropagation();
  host.append(select);

  const reserveTrackSpace = (scene: LayoutScene) => {
    const rows = scene.rows;
    if (!rows?.length || arranged.get(scene) === rows) return;
    const musicY = rows.find((row) => row.kind === 'music')?.contentY;
    if (musicY === undefined) return;
    for (const row of rows) if (row.contentY > musicY) row.contentY += TRACK_GAP;
    for (const heading of scene.sectionHeadings ?? []) {
      if (heading.contentY > musicY) heading.contentY += TRACK_GAP;
    }
    scene.contentHeight = (scene.contentHeight ?? 0) + TRACK_GAP;
    scene.maxScroll = (scene.maxScroll ?? 0) + TRACK_GAP;
    scene.setScrollOffset?.(scene.scrollOffset ?? 0);
    arranged.set(scene, rows);
  };

  game.events.on('poststep', () => {
    const scene = game.scene.getScene('SettingsScene') as LayoutScene | null;
    if (!scene?.scene.isActive()) {
      select.hidden = true;
      for (const [, , input] of sliders) input.hidden = true;
      return;
    }
    reserveTrackSpace(scene);
    const settings = audio.getSettings();
    const canvas = game.canvas.getBoundingClientRect();
    const box = host.getBoundingClientRect();
    const sx = canvas.width / 1280;
    const sy = canvas.height / 720;
    const row = (kind: string) =>
      scene.children.getByName(`settings-row-${kind}`) as Phaser.GameObjects.Rectangle | null;

    for (const [kind, key, input] of sliders) {
      const target = row(kind);
      input.value = String(settings[key]);
      input.hidden = !target?.visible;
      if (!target || input.hidden) continue;
      const label = scene.children.getByName(
        `settings-row-${kind}-label`,
      ) as Phaser.GameObjects.Text | null;
      label?.setY(target.y - 13);
      input.style.width = `${470 * sx}px`;
      input.style.left = `${canvas.left - box.left + 405 * sx}px`;
      input.style.top = `${canvas.top - box.top + (target.y + 4) * sy}px`;
    }

    const mode = row('music');
    select.hidden = settings.musicEnabled || !mode?.visible;
    if (!select.hidden && mode) {
      select.value = settings.selectedMusicTrackId ?? MUSIC_CATALOGUE[0]?.id ?? '';
      select.style.left = `${canvas.left - box.left + 380 * sx}px`;
      select.style.top = `${canvas.top - box.top + (mode.y + 40) * sy}px`;
      select.style.width = `${520 * sx}px`;
    }
  });
}
