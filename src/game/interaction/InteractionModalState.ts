import type Phaser from 'phaser';

const lockedScenes = new WeakSet<Phaser.Scene>();
let lockCount = 0;
let suppressInteractionUntil = 0;
const CLOSE_CLICK_THROUGH_GUARD_MS = 160;

/**
 * Shared gameplay lock for an active conversation/interaction surface.
 * It suppresses exploration movement and contextual background interaction without pausing the scene,
 * so the active surface can still receive close/continue input.
 */
export function setInteractionModalActive(scene: Phaser.Scene, active: boolean): void {
  const wasActive = lockedScenes.has(scene);
  if (active === wasActive) {
    return;
  }

  if (active) {
    lockedScenes.add(scene);
    lockCount += 1;
    return;
  }

  lockedScenes.delete(scene);
  lockCount = Math.max(0, lockCount - 1);
  suppressInteractionUntil = Math.max(
    suppressInteractionUntil,
    Date.now() + CLOSE_CLICK_THROUGH_GUARD_MS,
  );
}

export function isInteractionModalActive(scene?: Phaser.Scene): boolean {
  return scene ? lockedScenes.has(scene) : lockCount > 0;
}

export function isInteractionActivationSuppressed(): boolean {
  return lockCount > 0 || Date.now() < suppressInteractionUntil;
}

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

  if (!source.sys.game.scene.keys[modalSceneKey]) {
    return false;
  }

  try {
    source.scene.launch(modalSceneKey, {
      ...data,
      returnScene: source.scene.key,
    });
    // Phaser can queue launch activation until the next scene step. Pause the caller
    // immediately after a valid registered launch instead of requiring isActive() here.
    source.scene.pause();
    return true;
  } catch {
    return false;
  }
}

export function resolveExplorationReturnRecovery(returnScene: string): string {
  return SAFE_RETURN_RECOVERY[returnScene] ?? returnScene;
}

export function closeExplorationModal(modal: Phaser.Scene, returnScene: string): string {
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
