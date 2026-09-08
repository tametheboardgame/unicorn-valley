import Phaser from 'phaser';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';

const SETTINGS_SCENE_REGISTERED_KEY = 'wp6.14:settings-scene-registered';

/**
 * Exploration audio/settings bridge.
 *
 * The retired standalone Sound launcher and mini audio panel have been deleted. Settings are opened
 * exclusively through the canonical concept Settings navigation button, so no hidden legacy
 * exploration control can be revealed by viewport or orientation changes.
 */
export class AudioSettingsPanel {
  private readonly audio = getVerticalSliceAudio();
  private openingFullSettings = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly manageSceneAudio = true,
  ) {
    if (this.manageSceneAudio) {
      this.audio.enterScene(scene.scene.key);
    }
    scene.input.once('pointerdown', () => void this.audio.unlock());
    scene.input.keyboard?.once('keydown', () => void this.audio.unlock());
  }

  /**
   * Compatibility no-op for older callers. There is no launcher object to show or hide.
   */
  public setLauncherVisible(_visible: boolean): void {}

  public openSettings(): Promise<void> {
    return this.openFullSettings();
  }

  public destroy(): void {
    if (this.manageSceneAudio) {
      this.audio.leaveScene(this.scene.scene.key);
    }
  }

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

      if (!this.scene.scene.isActive()) {
        return;
      }

      void this.audio.unlock();
      this.audio.playSfx('ui');
      const returnScene = this.scene.scene.key;
      this.scene.scene.launch('SettingsScene', { returnScene });
      this.scene.scene.pause();
    } finally {
      this.openingFullSettings = false;
    }
  }
}
