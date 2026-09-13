import '../../settingsAudioControls.css';
import type Phaser from 'phaser';
import { MUSIC_CATALOGUE } from '../../generated/audioCatalogue';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { CanvasDomOverlayBridge, type CanvasDomOverlayPlacement } from './CanvasDomOverlayBridge';
import { UI_DESIGN_TOKENS } from './UiDesignSystem';

const VOLUMES = [
  ['master', 'masterVolume', 'All sound'],
  ['music', 'musicVolume', 'Music volume'],
  ['ambience', 'ambienceVolume', 'Ambience volume'],
  ['sfx', 'sfxVolume', 'Effects volume'],
] as const;

const CONTROL_X = 640 - 245;
const CONTROL_WIDTH = 490;
const CONTROL_HEIGHT = UI_DESIGN_TOKENS.control.nativeHeightPx;
const CONTROL_MIN_CSS_WIDTH = 260;
const SETTINGS_VIEWPORT = {
  left: CONTROL_X,
  top: 145,
  right: CONTROL_X + CONTROL_WIDTH,
  bottom: 565,
} as const;
const INSTALLED = new WeakSet<Phaser.Game>();

function applyDesignTokens(host: HTMLElement): void {
  host.style.setProperty('--uv-ui-ink', UI_DESIGN_TOKENS.colour.ink);
  host.style.setProperty('--uv-ui-cream-text', UI_DESIGN_TOKENS.colour.creamText);
  host.style.setProperty('--uv-ui-parchment', UI_DESIGN_TOKENS.colour.parchment);
  host.style.setProperty('--uv-ui-lavender-strong', UI_DESIGN_TOKENS.colour.lavenderStrong);
  host.style.setProperty('--uv-ui-ribbon', UI_DESIGN_TOKENS.colour.ribbon);
  host.style.setProperty('--uv-ui-ribbon-strong', UI_DESIGN_TOKENS.colour.ribbonStrong);
  host.style.setProperty('--uv-ui-gold', UI_DESIGN_TOKENS.colour.gold);
  host.style.setProperty('--uv-ui-focus', UI_DESIGN_TOKENS.colour.focus);
  host.style.setProperty('--uv-ui-shadow', UI_DESIGN_TOKENS.colour.shadow);
  host.style.setProperty('--uv-ui-font', UI_DESIGN_TOKENS.typography.family);
  host.style.setProperty('--uv-ui-control-radius', `${UI_DESIGN_TOKENS.radius.controlPx}px`);
  host.style.setProperty('--uv-ui-pill-radius', `${UI_DESIGN_TOKENS.radius.pillPx}px`);
  host.style.setProperty('--uv-ui-dom-depth', String(UI_DESIGN_TOKENS.depth.domOverlay));
}

export function getSettingsAudioControlsManager(game: Phaser.Game): void {
  if (INSTALLED.has(game)) return;
  INSTALLED.add(game);

  const host = document.getElementById('game-container')!;
  applyDesignTokens(host);
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
    containInViewport = false,
  ): CanvasDomOverlayPlacement | null => {
    if (!target || !visible) return null;
    return {
      x: CONTROL_X,
      y: target.y + 1,
      width: CONTROL_WIDTH,
      height: CONTROL_HEIGHT,
      minCssWidth: CONTROL_MIN_CSS_WIDTH,
      minCssHeight: CONTROL_HEIGHT,
      ...(containInViewport
        ? {
            visibilityBounds: SETTINGS_VIEWPORT,
            visibilityMode: 'contain' as const,
          }
        : {}),
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
    select.value = settings.selectedMusicTrackId ?? MUSIC_CATALOGUE[0]?.id ?? '';
    return placement(target, Boolean(!settings.musicEnabled && target?.visible), true);
  });
}
