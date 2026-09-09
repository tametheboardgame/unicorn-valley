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

export type CreatorAppearanceKey = keyof UnicornAppearance;

export interface CreatorControlDescriptor {
  category: Exclude<CreatorCategoryId, 'main'>;
  namePrefix: string;
  targetY: number;
}

export const CREATOR_CONTROL_DESCRIPTORS: readonly CreatorControlDescriptor[] = [
  { category: 'colours', namePrefix: 'creator-bodyColour-', targetY: 410 },
  { category: 'colours', namePrefix: 'creator-eyeColour-', targetY: 490 },
  { category: 'mane-tail', namePrefix: 'creator-maneStyle-', targetY: 390 },
  { category: 'mane-tail', namePrefix: 'creator-maneColour-', targetY: 450 },
  { category: 'mane-tail', namePrefix: 'creator-tailStyle-', targetY: 515 },
  { category: 'mane-tail', namePrefix: 'creator-tailColour-', targetY: 575 },
  { category: 'horn', namePrefix: 'creator-hornStyle-', targetY: 465 },
  { category: 'markings', namePrefix: 'creator-marking-', targetY: 465 },
  { category: 'accessories', namePrefix: 'creator-accessory-', targetY: 465 },
] as const;

/** Unsaved creator state. It is deliberately detached from the loaded SaveGame. */
export class CreatorDraft {
  private current: UnicornAppearance;

  public constructor(
    private readonly original: UnicornAppearance,
    public readonly editMode: boolean,
  ) {
    this.current = { ...original };
  }

  public get appearance(): UnicornAppearance {
    return { ...this.current };
  }

  public set<Key extends CreatorAppearanceKey>(key: Key, value: UnicornAppearance[Key]): void {
    this.current = { ...this.current, [key]: value };
  }

  public replace(appearance: UnicornAppearance): void {
    this.current = { ...appearance };
  }

  public randomise(random: () => number = Math.random): void {
    this.replace(randomiseUnicornAppearance(random));
  }

  public resetToDefault(): void {
    this.replace(DEFAULT_UNICORN_APPEARANCE);
  }

  public restoreOriginal(): void {
    this.replace(this.original);
  }
}
import {
  DEFAULT_UNICORN_APPEARANCE,
  randomiseUnicornAppearance,
  type UnicornAppearance,
} from '../player/UnicornAppearance';
