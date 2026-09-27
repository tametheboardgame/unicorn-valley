import type Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { openExplorationModal } from '../interaction/InteractionModalState';

const SETTINGS_SCENE_REGISTERED_KEY = 'wp6.14:settings-scene-registered';

/** Settings are opened exclusively through the canonical concept navigation. */
export class AudioSettingsPanel {
  private openingFullSettings = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    _manageSceneAudio = true,
  ) {}

  public setLauncherVisible(_visible: boolean): void {}

  public openSettings(): Promise<void> {
    return this.openFullSettings();
  }

  public destroy(): void {}

  private async openFullSettings(): Promise<void> {
    if (
      this.openingFullSettings ||
      !this.scene.scene.isActive() ||
      this.scene.scene.isActive('SettingsScene')
    ) {
      return;
    }

    this.openingFullSettings = true;
    try {
      if (this.scene.registry.get(SETTINGS_SCENE_REGISTERED_KEY) !== true) {
        const { SettingsScene } = await import('../scenes/SettingsScene');
        this.scene.scene.add('SettingsScene', SettingsScene, false);
        this.scene.registry.set(SETTINGS_SCENE_REGISTERED_KEY, true);
      }
      if (!this.scene.scene.isActive()) return;

      if (openExplorationModal(this.scene, 'SettingsScene')) {
        getVerticalSliceAudio().playSfx('ui');
      }
    } finally {
      this.openingFullSettings = false;
    }
  }
}
