import { describe, expect, it } from 'vitest';
import {
  CORE_NPC_IDS,
  CORE_NPC_VISUALS,
  getCoreNpcTextureKey,
  PIP_SPECIES_NAME,
} from './CoreNpcProductionArt';

describe('CoreNpcProductionArt', () => {
  it('defines six stable and visually distinct core identities', () => {
    expect(CORE_NPC_IDS).toEqual(['nova', 'willow', 'pip', 'pebble', 'lumi', 'marigold']);
    expect(new Set(CORE_NPC_IDS.map((id) => CORE_NPC_VISUALS[id].silhouette)).size).toBe(6);
    expect(new Set(CORE_NPC_IDS.map((id) => CORE_NPC_VISUALS[id].motif)).size).toBe(6);
    expect(new Set(CORE_NPC_IDS.map((id) => CORE_NPC_VISUALS[id].body)).size).toBe(6);
  });

  it('defines Pip as a glimmerling rather than a unicorn silhouette', () => {
    expect(PIP_SPECIES_NAME).toBe('Glimmerling');
    expect(CORE_NPC_VISUALS.pip.silhouette).toBe('glimmerling');
    expect(CORE_NPC_VISUALS.pip.silhouette).not.toBe(CORE_NPC_VISUALS.nova.silhouette);
  });

  it('keeps neutral and happy expression textures stable and collision-free', () => {
    const keys = CORE_NPC_IDS.flatMap((id) => [
      getCoreNpcTextureKey(id, 'neutral'),
      getCoreNpcTextureKey(id, 'happy'),
    ]);
    expect(new Set(keys).size).toBe(CORE_NPC_IDS.length * 2);
    expect(getCoreNpcTextureKey('nova', 'neutral')).toBe('core-npc-production:nova:neutral');
    expect(getCoreNpcTextureKey('pip', 'happy')).toBe('core-npc-production:pip:happy');
  });
});
