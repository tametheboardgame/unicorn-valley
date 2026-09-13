import '../../settingsAudioControls.css';
import type Phaser from 'phaser';
import { MUSIC_CATALOGUE } from '../../generated/audioCatalogue';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { CanvasDomOverlayBridge, type CanvasDomOverlayPlacement } from './CanvasDomOverlayBridge';

const VOLUMES = [
  ['master', 'masterVolume', 'All sound'],
  ['music', 'musicVolume', 'Music volume'],
  ['ambience', 'ambienceVolume', 'Ambience volume'],
  ['sfx', 'sfxVolume', 'Effects volume'],
] as const;

const CONTROL_X = 640 - 245;
const CONTROL_WIDTH = 490;
const CONTROL_HEIGHT = 44;
const CONTROL_MIN_CSS_WIDTH = 260;
const VIEWPORT_TOP = 145;
const VIEWPORT_BOTTOM = 565;
const INSTALLED = new WeakSet<Phaser.Game>();

export function getSettingsAudioControlsManager(game: Phaser.Game): void {
  if (INSTALLED.has(game)) return;
  INSTALLED.add(game);

  const host = document.getElementById('game-container')!;
  const audio = getVerticalSliceAudio();
  const bridge = new CanvasDomOverlayBridge(game, host);
  const row = (kind: string) => {
    const scene = game.scene.getScene('SettingsScene');
    return scene?.scene.isActive()
      ? (scene.children.getByName(`settings-row-${kind}`) as Phaser.GameObjects.Rectangle | null)
      : null;
  };
  const placement = (
    target: Phaser.GameObjects.Rectangle | null,
    visible: boolean,
  ): CanvasDomOverlayPlacement | null => {
    if (!target || !visible) return null;
    return {
      x: CONTROL_X,
      y: target.y + 1,
      width: CONTROL_WIDTH,
      height: CONTROL_HEIGHT,
      minCssWidth: CONTROL_MIN_CSS_WIDTH,
      minCssHeight: CONTROL_HEIGHT,
    };
  };

  for (const [kind, key, label] of VOLUMES) {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '.01';
    input.ariaLabel = label;
    input.className = 'settings-audio-control settings-audio-slider';
    input.oninput = () => audio.updateSettings({ [key]: +input.value });

    bridge.register(input, () => {
      const target = row(`${kind}-volume`);
      const settings = audio.getSettings();
      input.value = String(settings[key]);
      input.style.setProperty('--settings-audio-progress', `${settings[key] * 100}%`);
      return placement(target, Boolean(target?.input?.enabled));
    });
  }

  const select = document.createElement('select');
  select.ariaLabel = 'Chosen music track';
  select.className = 'settings-audio-control settings-audio-select';
  for (const track of MUSIC_CATALOGUE) {
    select.add(new Option(track.path.slice(track.path.lastIndexOf('/') + 1, -4), track.id));
  }
  select.onchange = () => audio.updateSettings({ selectedMusicTrackId: select.value });

  bridge.register(select, () => {
    const target = row('music-track');
    const settings = audio.getSettings();
    const visible = Boolean(
      !settings.musicEnabled &&
        target?.visible &&
        target.y - target.height / 2 >= VIEWPORT_TOP &&
        target.y + target.height / 2 + 6 <= VIEWPORT_BOTTOM,
    );
    select.value = settings.selectedMusicTrackId ?? MUSIC_CATALOGUE[0]?.id ?? '';
    return placement(target, visible);
  });
}
