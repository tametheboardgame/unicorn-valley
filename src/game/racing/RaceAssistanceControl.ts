import Phaser from 'phaser';
import {
  getBrowserRaceSettingsStore,
  getRaceAssistanceOption,
  type RaceAssistanceMode,
} from './RaceSettings';

export interface RaceAssistanceControl {
  container: Phaser.GameObjects.Container;
  getMode(): RaceAssistanceMode;
}

export function createRaceAssistanceControl(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onModeChanged?: (mode: RaceAssistanceMode, description: string) => void,
): RaceAssistanceControl {
  const store = getBrowserRaceSettingsStore();
  let mode = store.load().assistanceMode;

  const background = scene.add
    .rectangle(0, 0, 250, 58, 0xfff8e8, 0.96)
    .setName('race-assistance-toggle')
    .setStrokeStyle(3, 0xb996c6, 0.95)
    .setInteractive({ useHandCursor: true });
  const modeText = scene.add
    .text(0, -9, '', {
      color: '#5c4668',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
    })
    .setName('race-assistance-toggle-label')
    .setOrigin(0.5);
  const hintText = scene.add
    .text(0, 14, 'tap to change', {
      color: '#7b6782',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
    })
    .setName('race-assistance-toggle-hint')
    .setOrigin(0.5);

  const refreshLabel = (): void => {
    modeText.setText(`Race help: ${getRaceAssistanceOption(mode).label}`);
  };

  refreshLabel();

  const container = scene.add
    .container(x, y, [background, modeText, hintText])
    .setName('race-assistance-control')
    .setScrollFactor(0)
    .setDepth(113);

  background.on('pointerdown', () => {
    mode = mode === 'standard' ? 'extra-help' : 'standard';
    store.update({ assistanceMode: mode });
    refreshLabel();
    const option = getRaceAssistanceOption(mode);
    onModeChanged?.(mode, option.description);
  });

  return {
    container,
    getMode: () => mode,
  };
}
