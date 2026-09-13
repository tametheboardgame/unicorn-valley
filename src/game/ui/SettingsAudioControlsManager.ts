import type Phaser from 'phaser';
import { MUSIC_CATALOGUE } from '../../generated/audioCatalogue';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';

const VOLUMES = [
  ['master-volume', 'masterVolume', 'All sound'],
  ['music-volume', 'musicVolume', 'Music volume'],
  ['ambience-volume', 'ambienceVolume', 'Ambience volume'],
  ['sfx-volume', 'sfxVolume', 'Effects volume'],
] as const;
const TRACK_ROW_GAP = 64;

type AudioLayoutScene = Phaser.Scene & {
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
  const arrangedRows = new WeakMap<Phaser.Scene, object>();
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
    input.onpointerdown = (event) => event.stopPropagation();
    input.onclick = (event) => event.stopPropagation();
    host.append(input);
    return [kind, key, input] as const;
  });

  const trackRow = document.createElement('div');
  trackRow.style.position = 'absolute';
  trackRow.style.zIndex = '51';
  trackRow.style.display = 'flex';
  trackRow.style.alignItems = 'center';
  trackRow.style.gap = '12px';
  trackRow.style.boxSizing = 'border-box';
  trackRow.style.padding = '6px 14px';
  trackRow.style.background = 'rgba(232, 246, 235, 0.98)';
  trackRow.style.border = '2px solid #8bc49c';
  trackRow.style.borderRadius = '14px';
  trackRow.style.color = '#4b3d58';
  trackRow.style.fontFamily = 'system-ui, sans-serif';
  trackRow.style.fontWeight = '700';
  trackRow.textContent = 'Chosen track';
  trackRow.onpointerdown = (event) => event.stopPropagation();
  trackRow.onclick = (event) => event.stopPropagation();

  const select = document.createElement('select');
  select.ariaLabel = 'Chosen music track';
  select.style.flex = '1';
  select.style.minWidth = '0';
  select.style.height = '34px';
  select.style.border = '1px solid #8f7ba2';
  select.style.borderRadius = '9px';
  select.style.background = '#fffdf8';
  select.style.color = '#3f344b';
  select.style.padding = '0 8px';
  for (const track of MUSIC_CATALOGUE) {
    const filename = track.path.slice(track.path.lastIndexOf('/') + 1, -4);
    select.add(new Option(filename.replaceAll('-', ' '), track.id));
  }
  select.onchange = () => audio.updateSettings({ selectedMusicTrackId: select.value });
  select.onpointerdown = (event) => event.stopPropagation();
  select.onclick = (event) => event.stopPropagation();
  trackRow.append(select);
  host.append(trackRow);

  const reserveTrackRow = (scene: AudioLayoutScene) => {
    const rows = scene.rows;
    if (!rows?.length || arrangedRows.get(scene) === rows) return;
    const music = rows.find((row) => row.kind === 'music');
    if (!music) return;
    for (const row of rows) {
      if (row.contentY > music.contentY) row.contentY += TRACK_ROW_GAP;
    }
    for (const heading of scene.sectionHeadings ?? []) {
      if (heading.contentY > music.contentY) heading.contentY += TRACK_ROW_GAP;
    }
    scene.contentHeight = (scene.contentHeight ?? 0) + TRACK_ROW_GAP;
    scene.maxScroll = (scene.maxScroll ?? 0) + TRACK_ROW_GAP;
    scene.setScrollOffset?.(scene.scrollOffset ?? 0);
    arrangedRows.set(scene, rows);
  };

  game.events.on('poststep', () => {
    const scene = game.scene.getScene('SettingsScene') as AudioLayoutScene | null;
    if (!scene?.scene.isActive()) {
      trackRow.hidden = true;
      for (const [, , input] of sliders) input.hidden = true;
      return;
    }
    reserveTrackRow(scene);
    const settings = audio.getSettings();
    const canvas = game.canvas.getBoundingClientRect();
    const box = host.getBoundingClientRect();
    const sx = canvas.width / 1280;
    const sy = canvas.height / 720;
    const row = (kind: string) =>
      scene.children.getByName(`settings-row-${kind}`) as Phaser.GameObjects.Rectangle | null;

    for (const [kind, key, input] of sliders) {
      const target = row(kind);
      const label = scene.children.getByName(
        `settings-row-${kind}-label`,
      ) as Phaser.GameObjects.Text | null;
      input.value = String(settings[key]);
      input.hidden = !target?.visible;
      if (!target || input.hidden) continue;
      label?.setY(target.y - 13);
      input.style.width = `${470 * sx}px`;
      input.style.left = `${canvas.left - box.left + 405 * sx}px`;
      input.style.top = `${canvas.top - box.top + (target.y + 4) * sy}px`;
      input.style.height = `${Math.max(24, 22 * sy)}px`;
    }

    const mode = row('music');
    const showTrack = !settings.musicEnabled && Boolean(mode?.visible);
    trackRow.hidden = !showTrack;
    if (mode && showTrack) {
      select.value = settings.selectedMusicTrackId ?? MUSIC_CATALOGUE[0]?.id ?? '';
      trackRow.style.left = `${canvas.left - box.left + 345 * sx}px`;
      trackRow.style.top = `${canvas.top - box.top + (mode.y + 39) * sy}px`;
      trackRow.style.width = `${590 * sx}px`;
      trackRow.style.minHeight = `${Math.max(40, 46 * sy)}px`;
      trackRow.style.fontSize = `${Math.max(12, 15 * sy)}px`;
    }
  });
}
