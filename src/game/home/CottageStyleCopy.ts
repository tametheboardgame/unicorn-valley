import type { CottageFurnitureStyleKey, CottageWallKey } from '../save/saveSchema';

export const COTTAGE_WALL_LABELS: Readonly<Record<CottageWallKey, string>> = {
  back: 'Back',
  left: 'Left',
  right: 'Right',
  front: 'Front / Door',
};

export const COTTAGE_FURNITURE_LABELS: Readonly<Record<CottageFurnitureStyleKey, string>> = {
  bed: 'Bed',
  sofa: 'Sofa',
  teaSet: 'Tea Set',
  fireplace: 'Fireplace',
};

export const COTTAGE_STYLE_NAMES: Readonly<Record<string, string>> = {
  'cottage-wall:moon-cream': 'Moon Cream',
  'cottage-wall:blush-dawn': 'Blush Dawn',
  'cottage-wall:misty-lilac': 'Misty Lilac',
  'cottage-wall:sea-glass': 'Sea Glass',
  'cottage-wall:buttercup': 'Buttercup',
  'cottage-wallpaper:plain': 'Plain',
  'cottage-wallpaper:moon-sprigs': 'Moon Sprigs',
  'cottage-wallpaper:star-scatter': 'Star Scatter',
  'cottage-wallpaper:meadow-vines': 'Meadow Vines',
  'cottage-floor:honey-oak': 'Honey Oak',
  'cottage-floor:rosewood': 'Rosewood',
  'cottage-floor:whitewashed-oak': 'Whitewashed Oak',
  'cottage-floor:lavender-boards': 'Lavender Boards',
  'cottage-furniture:bed:moonflower': 'Moonflower',
  'cottage-furniture:bed:rose-dream': 'Rose Dream',
  'cottage-furniture:bed:sea-glass': 'Sea Glass',
  'cottage-furniture:sofa:sage': 'Sage',
  'cottage-furniture:sofa:berry': 'Berry',
  'cottage-furniture:sofa:starlight': 'Starlight',
  'cottage-furniture:tea-set:honey-oak': 'Honey Oak',
  'cottage-furniture:tea-set:rosewood': 'Rosewood',
  'cottage-furniture:tea-set:whitewashed': 'Whitewashed',
  'cottage-furniture:fireplace:warm-stone': 'Warm Stone',
  'cottage-furniture:fireplace:moonstone': 'Moonstone',
  'cottage-furniture:fireplace:rose-stone': 'Rose Stone',
};

export function getCottageStyleName(id: string): string {
  return COTTAGE_STYLE_NAMES[id] ?? 'Cottage Style';
}

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
  'cottage-furniture:bed:moonflower': 'The original cosy Moonflower bed finish.',
  'cottage-furniture:bed:rose-dream': 'Rosy timber and soft berry bedding for a warmer bedtime look.',
  'cottage-furniture:bed:sea-glass': 'Cool sea-glass greens with pale fresh bedding.',
  'cottage-furniture:sofa:sage': 'The original soft sage sofa with mixed cottage cushions.',
  'cottage-furniture:sofa:berry': 'A richer berry upholstery with warm contrasting cushions.',
  'cottage-furniture:sofa:starlight': 'Dusky lilac upholstery with cool starlight accents.',
  'cottage-furniture:tea-set:honey-oak': 'The original honey-oak table and chairs.',
  'cottage-furniture:tea-set:rosewood': 'A deeper rosewood tea set with blush details.',
  'cottage-furniture:tea-set:whitewashed': 'A pale whitewashed finish with cool blue tableware.',
  'cottage-furniture:fireplace:warm-stone': 'The original warm stone and timber fireplace.',
  'cottage-furniture:fireplace:moonstone': 'Cool moonstone masonry with dusky violet timber.',
  'cottage-furniture:fireplace:rose-stone': 'Soft rose stone with warm berry-toned timber.',
};

export function getCottageStyleDescription(id: string): string {
  return COTTAGE_STYLE_DESCRIPTIONS[id] ?? 'A curated Moonflower Cottage style.';
}
