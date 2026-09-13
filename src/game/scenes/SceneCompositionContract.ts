export type SceneCategory =
  | 'bootstrap'
  | 'exploration'
  | 'interior'
  | 'modal'
  | 'activity'
  | 'race'
  | 'onboarding'
  | 'story'
  | 'hud'
  | 'utility'
  | 'diagnostic';

export type SceneLoadBoundary = 'startup' | 'runtime-eager' | 'on-demand';

export interface SceneCompositionContract<Key extends string = string> {
  key: Key;
  category: SceneCategory;
  loadBoundary: SceneLoadBoundary;
  audioContext: 'none' | 'menu' | 'world' | 'activity' | 'inherit';
  persistence: 'none' | 'profile' | 'save-location' | 'settings' | 'return-payload';
  spawnReturn: 'none' | 'scene-owned' | 'save-location' | 'return-payload';
  shell: 'none' | 'exploration' | 'modal' | 'activity';
  interaction: 'none' | 'scene-owned' | 'world-coordinator';
  responsive: 'canvas-fit' | 'touch-adaptive' | 'portrait-companion';
  teardown: 'scene-lifecycle-scope' | 'scene-owned' | 'app-owned';
  testTags: readonly string[];
}

export function defineSceneContract<const Key extends string>(
  contract: SceneCompositionContract<Key>,
): SceneCompositionContract<Key> {
  return contract;
}
