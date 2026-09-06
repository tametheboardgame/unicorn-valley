export type CreatorCategoryId =
  | 'main'
  | 'colours'
  | 'mane-tail'
  | 'horn'
  | 'markings'
  | 'accessories';

export interface CreatorCategoryDefinition {
  id: CreatorCategoryId;
  label: string;
  icon: string;
}

export const CREATOR_CATEGORIES = [
  { id: 'main', label: 'Main', icon: '🦄' },
  { id: 'colours', label: 'Colours', icon: '🎨' },
  { id: 'mane-tail', label: 'Mane & Tail', icon: '✨' },
  { id: 'horn', label: 'Horn', icon: '🌟' },
  { id: 'markings', label: 'Markings', icon: '💫' },
  { id: 'accessories', label: 'Accessories', icon: '🎀' },
] as const satisfies readonly CreatorCategoryDefinition[];

export function creatorCategoryLabel(category: CreatorCategoryId): string {
  return CREATOR_CATEGORIES.find((definition) => definition.id === category)?.label ?? 'Main';
}
