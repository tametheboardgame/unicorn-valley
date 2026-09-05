import { shouldUsePortraitTouchControls } from '../input/TouchMovementPad';

export interface PortraitModalCard {
  id: string;
  icon?: string;
  title: string;
  description: string;
  badge?: string;
}

export interface PortraitModalAction {
  id: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export interface PortraitModalActionGroup {
  id: string;
  label?: string;
  actions: readonly PortraitModalAction[];
}

function shouldRenderPortraitModalCompanion(): boolean {
  if (typeof globalThis.document === 'undefined') {
    return false;
  }

  return shouldUsePortraitTouchControls(
    globalThis.innerWidth,
    globalThis.innerHeight,
    globalThis.navigator?.maxTouchPoints ?? 0,
    'ontouchstart' in globalThis,
  );
}

export class PortraitModalCompanion {
  private readonly root: HTMLDivElement;
  private readonly heading: HTMLHeadingElement;
  private readonly intro: HTMLParagraphElement;
  private readonly cards: HTMLDivElement;
  private readonly actions: HTMLDivElement;

  public static create(id: string, ariaLabel: string): PortraitModalCompanion | null {
    if (!shouldRenderPortraitModalCompanion()) {
      return null;
    }
    return new PortraitModalCompanion(id, ariaLabel);
  }

  private constructor(id: string, ariaLabel: string) {
    this.root = globalThis.document.createElement('div');
    this.root.className = 'mobile-modal-companion';
    this.root.dataset.mobileModalCompanion = id;
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-label', ariaLabel);

    this.heading = globalThis.document.createElement('h2');
    this.heading.className = 'mobile-modal-heading';

    this.intro = globalThis.document.createElement('p');
    this.intro.className = 'mobile-modal-intro';

    this.cards = globalThis.document.createElement('div');
    this.cards.className = 'mobile-modal-cards';

    this.actions = globalThis.document.createElement('div');
    this.actions.className = 'mobile-modal-actions';

    this.root.append(this.heading, this.intro, this.cards, this.actions);
    (globalThis.document.querySelector('#game-shell') ?? globalThis.document.body).append(this.root);
  }

  public setHeader(title: string, intro: string): void {
    this.heading.textContent = title;
    this.intro.textContent = intro;
  }

  public setCards(cards: readonly PortraitModalCard[]): void {
    this.cards.replaceChildren();
    this.cards.hidden = cards.length === 0;

    for (const card of cards) {
      const article = globalThis.document.createElement('article');
      article.className = 'mobile-modal-card';
      article.dataset.mobileModalCard = card.id;

      const title = globalThis.document.createElement('h3');
      title.className = 'mobile-modal-card-title';
      title.textContent = `${card.icon ? `${card.icon} ` : ''}${card.title}`;

      const description = globalThis.document.createElement('p');
      description.className = 'mobile-modal-card-description';
      description.textContent = card.description;

      article.append(title, description);
      if (card.badge) {
        const badge = globalThis.document.createElement('p');
        badge.className = 'mobile-modal-card-badge';
        badge.textContent = card.badge;
        article.append(badge);
      }
      this.cards.append(article);
    }
  }

  public setActionGroups(groups: readonly PortraitModalActionGroup[]): void {
    this.actions.replaceChildren();

    for (const group of groups) {
      const wrapper = globalThis.document.createElement('div');
      wrapper.className = 'mobile-modal-action-group';
      wrapper.dataset.mobileModalActionGroup = group.id;

      if (group.label) {
        const label = globalThis.document.createElement('p');
        label.className = 'mobile-modal-action-group-label';
        label.textContent = group.label;
        wrapper.append(label);
      }

      const grid = globalThis.document.createElement('div');
      grid.className = 'mobile-modal-action-grid';
      for (const action of group.actions) {
        const button = globalThis.document.createElement('button');
        button.type = 'button';
        button.className = 'mobile-modal-button';
        button.dataset.mobileModalAction = action.id;
        button.textContent = action.label;
        button.disabled = action.disabled === true;
        button.classList.toggle('is-selected', action.selected === true);
        button.setAttribute('aria-pressed', action.selected === true ? 'true' : 'false');
        button.addEventListener('click', (event) => {
          event.preventDefault();
          if (!button.disabled) {
            action.onPress();
          }
        });
        grid.append(button);
      }
      wrapper.append(grid);
      this.actions.append(wrapper);
    }
  }

  public destroy(): void {
    this.root.remove();
  }
}
