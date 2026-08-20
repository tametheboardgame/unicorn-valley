import type { DialogueEffect } from '../../content/contentTypes';
import type { SaveService } from '../save/SaveService';

export function applyDialogueEffects(
  saveService: SaveService,
  effects: readonly DialogueEffect[],
): void {
  if (effects.length === 0) {
    return;
  }

  const save = saveService.load() ?? saveService.createNewGame();
  const flags = { ...save.world.flags };

  for (const effect of effects) {
    if (effect.type === 'set-flag') {
      flags[effect.flagId] = effect.value;
    }
  }

  saveService.save({
    ...save,
    world: {
      ...save.world,
      flags,
    },
  });
}
