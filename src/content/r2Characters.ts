import type { CharacterDefinition } from './contentTypes';

export const R2_CHARACTERS = [
  {
    id: 'character:willow',
    name: 'Willow',
    role: 'A gentle village gardener who loves helping things grow.',
  },
] as const satisfies readonly CharacterDefinition[];
