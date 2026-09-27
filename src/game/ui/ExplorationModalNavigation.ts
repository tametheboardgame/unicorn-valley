import type Phaser from 'phaser';
import { isInteractionActivationSuppressed } from '../interaction/InteractionModalState';

export const EXPLORATION_MODAL_SCENE_KEYS = new Set([
  'InventoryScene',
  'WonderbookScene',
  'SettingsScene',
  'ShopScene',
  'CottageDecorateScene',
  'CottageStyleScene',
  'UnicornCreatorScene',
  'MapleBakingActivityScene',
]);

const SAFE_RETURN_RECOVERY: Readonly<Record<string, string>> = {
  VillageInteriorScene: 'SunbeamVillageScene',
  CottageInteriorScene: 'MoonflowerGladeScene',
  MoonflowerPatchScene: 'MoonflowerGladeScene',
  HollowTreeNookScene: 'MoonflowerGladeScene',
  WindmillLookoutScene: 'RainbowMeadowScene',
  CrystalGrottoScene: 'CrystalBrookScene',
  FireflyGroveScene: 'WhisperingWoodsScene',
};

export function hasOpenExplorationModal(scene: Phaser.Scene): boolean {
  for (const sceneKey of EXPLORATION_MODAL_SCENE_KEYS) {
    if (scene.scene.isActive(sceneKey)) {
      return true;
    }
  }
  return false;
}

export function openExplorationModal(
  source: Phaser.Scene,
  modalSceneKey: string,
  data: Record<string, unknown> = {},
): boolean {
  if (
    !source.scene.isActive() ||
    isInteractionActivationSuppressed() ||
    hasOpenExplorationModal(source)
  ) {
    return false;
  }

  source.scene.launch(modalSceneKey, {
    ...data,
    returnScene: source.scene.key,
  });

  if (!source.scene.isActive(modalSceneKey)) {
    return false;
  }

  source.scene.pause();
  return true;
}

export function resolveExplorationReturnRecovery(returnScene: string): string {
  return SAFE_RETURN_RECOVERY[returnScene] ?? returnScene;
}

export function closeExplorationModal(modal: Phaser.Scene, returnScene: string): string {
  // Stop the foreground scene first so close input cannot hit a resumed scene behind it.
  modal.scene.stop();

  if (modal.scene.isPaused(returnScene)) {
    modal.scene.resume(returnScene);
    return returnScene;
  }

  if (modal.scene.isActive(returnScene)) {
    return returnScene;
  }

  const recoveryScene = resolveExplorationReturnRecovery(returnScene);
  if (modal.scene.isPaused(recoveryScene)) {
    modal.scene.resume(recoveryScene);
    return recoveryScene;
  }
  if (!modal.scene.isActive(recoveryScene)) {
    modal.scene.start(recoveryScene);
  }
  return recoveryScene;
}
