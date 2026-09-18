import type { CottageWallKey } from '../save/saveSchema';

export const COTTAGE_WALL_LABELS: Readonly<Record<CottageWallKey, string>> = {
  back: 'Back',
  left: 'Left',
  right: 'Right',
  front: 'Front / Door',
};

export const COTTAGE_STYLE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  'cottage-wall:moon-cream': 'Warm cream walls with the cosy look Moonflower Cottage started with.',
  'cottage-wall:blush-dawn': 'A soft rosy wall colour, warm without becoming too bright.',
  'cottage-wall:misty-lilac': 'A pale magical lilac that keeps the room calm and storybook-soft.',
  'cottage-wall:sea-glass': 'A gentle green-blue inspired by smooth glass from Starlight Beach.',
  'cottage-wall:buttercup': 'A light sunny yellow that makes the cottage feel bright and cheerful.',
  'cottage-wallpaper:plain': 'Just the chosen wall colour, simple and cosy.',
  'cottage-wallpaper:moon-sprigs': 'Tiny moons and leafy sprigs scattered gently across the wall.',
  'cottage-wallpaper:star-scatter':
    'A quiet dusting of little stars, like bedtime light across the room.',
  'cottage-wallpaper:meadow-vines': 'Soft curling vines and leaves inspired by the meadow outside.',
  'cottage-floor:honey-oak': 'Warm honey-coloured boards that preserve the original cottage feel.',
  'cottage-floor:rosewood': 'Soft rosy timber with deeper seams for a snug evening feel.',
  'cottage-floor:whitewashed-oak': 'Pale boards that make the cottage feel airy and bright.',
  'cottage-floor:lavender-boards': 'A muted lavender finish with enough warmth to stay cosy.',
};

export function getCottageStyleDescription(id: string): string {
  return COTTAGE_STYLE_DESCRIPTIONS[id] ?? 'A curated Moonflower Cottage style.';
}
