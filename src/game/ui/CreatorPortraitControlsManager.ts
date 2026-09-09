import Phaser from 'phaser';
import '../../creatorPortraitControls.css';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import {
  ACCESSORIES,
  BODY_COLOURS,
  EYE_COLOURS,
  HAIR_COLOURS,
  HORN_STYLES,
  MANE_STYLES,
  MARKINGS,
  TAIL_STYLES,
  type UnicornAppearance,
} from '../player/UnicornAppearance';
import { CREATOR_CATEGORIES, type CreatorCategoryId } from './CreatorProgressiveModel';

const CREATOR_SCENE_KEY = 'UnicornCreatorScene';
const SYNC_INTERVAL_MS = 100;

type ColourKey = 'bodyColour' | 'eyeColour' | 'maneColour' | 'tailColour';
type CycleKey = 'maneStyle' | 'tailStyle' | 'hornStyle' | 'marking' | 'accessory';
type SectionKey = CreatorCategoryId;

interface ColourDefinition {
  key: ColourKey;
  label: string;
  section: SectionKey;
  choices: readonly { id: string; label: string; value: number }[];
}

interface CycleDefinition {
  key: CycleKey;
  label: string;
  section: SectionKey;
  choices: readonly { id: string; label: string }[];
}

interface DomColourChoice {
  definition: ColourDefinition;
  choiceId: string;
  button: HTMLButtonElement;
}

interface DomCycleRow {
  definition: CycleDefinition;
  choices: { id: string; button: HTMLButtonElement }[];
}

const COMPONENT_SYMBOLS: Readonly<Record<CycleKey, Record<string, string>>> = {
  maneStyle: { soft: '〰', fluffy: '☁', swept: '◒', braid: '⛓', crest: '♒' },
  tailStyle: { swish: '〰', curl: '➰', ribbon: '◢', braid: '⛓', puff: '☁' },
  hornStyle: { classic: '◭', spiral: '▱', short: '▴', star: '★', crystal: '♦' },
  marking: { none: '—', star: '★', heart: '♥', moon: '☾', freckles: '⠿', sparkles: '✦' },
  accessory: { none: '—', flower: '✿', bow: '⋈', bell: '♢', crown: '♛', ribbon: '🎀', scarf: '⌁' },
};

interface DomAction {
  objectName: string;
  labelName: string;
  button: HTMLButtonElement;
}

const COLOUR_DEFINITIONS: readonly ColourDefinition[] = [
  { key: 'bodyColour', label: 'Body', section: 'colours', choices: BODY_COLOURS },
  { key: 'eyeColour', label: 'Eyes', section: 'colours', choices: EYE_COLOURS },
  { key: 'maneColour', label: 'Mane colour', section: 'mane', choices: HAIR_COLOURS },
  { key: 'tailColour', label: 'Tail colour', section: 'tail', choices: HAIR_COLOURS },
];

const CYCLE_DEFINITIONS: readonly CycleDefinition[] = [
  { key: 'maneStyle', label: 'Choose a mane', section: 'mane', choices: MANE_STYLES },
  { key: 'tailStyle', label: 'Choose a tail', section: 'tail', choices: TAIL_STYLES },
  { key: 'hornStyle', label: 'Choose a horn', section: 'horn', choices: HORN_STYLES },
  { key: 'marking', label: 'Choose a marking', section: 'markings', choices: MARKINGS },
  { key: 'accessory', label: 'Choose an accessory', section: 'accessories', choices: ACCESSORIES },
];

const SECTION_LABELS = Object.fromEntries(
  CREATOR_CATEGORIES.map(({ id, label }) => [id, label]),
) as Readonly<Record<SectionKey, string>>;

const ACTION_DEFINITIONS = [
  ['creator-action-surprise', 'creator-action-surprise-label', false],
  ['creator-action-restore-saved', 'creator-action-restore-saved-label', false],
  ['creator-action-default', 'creator-action-default-label', false],
  ['creator-action-cancel', 'creator-action-cancel-label', false],
  ['creator-action-save-changes', 'creator-action-save-changes-label', true],
  ['creator-action-confirm-new', 'creator-action-confirm-new-label', true],
] as const;

function isVisible(object: Phaser.GameObjects.GameObject | null): boolean {
  return Boolean(object && 'visible' in object && object.visible);
}

function isEnabled(object: Phaser.GameObjects.GameObject | null): boolean {
  if (!object || !('input' in object)) {
    return false;
  }
  return Boolean(object.input?.enabled);
}

function colourCss(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}

export class CreatorPortraitControlsManager {
  private readonly syncThrottle = new RefreshThrottle(SYNC_INTERVAL_MS);
  private readonly root: HTMLElement;
  private readonly heading: HTMLElement;
  private readonly status: HTMLElement;
  private readonly nameInput: HTMLInputElement;
  private readonly sectionButtons = new Map<SectionKey, HTMLButtonElement>();
  private readonly sectionPanels = new Map<SectionKey, HTMLElement>();
  private readonly colourChoices: DomColourChoice[] = [];
  private readonly cycleRows: DomCycleRow[] = [];
  private readonly actions: DomAction[] = [];
  private activeSection: SectionKey = 'colours';

  public constructor(private readonly game: Phaser.Game) {
    this.root = document.createElement('section');
    this.root.className = 'creator-portrait-controls';
    this.root.dataset.creatorPortraitControls = 'true';
    this.root.setAttribute('aria-label', 'Unicorn creator controls');
    this.root.hidden = true;

    this.heading = document.createElement('h1');
    this.heading.className = 'creator-portrait-heading';
    this.heading.textContent = 'Make Your Unicorn';
    this.root.append(this.heading);

    const previewHint = document.createElement('p');
    previewHint.className = 'creator-portrait-preview-hint';
    previewHint.textContent = 'Your unicorn updates in the picture above as you choose.';
    this.root.append(previewHint);

    const nameGroup = document.createElement('label');
    nameGroup.className = 'creator-portrait-name-group';
    const nameLabel = document.createElement('span');
    nameLabel.textContent = '✎ Change name';
    this.nameInput = document.createElement('input');
    this.nameInput.className = 'creator-portrait-name-input';
    this.nameInput.maxLength = 16;
    this.nameInput.autocomplete = 'off';
    this.nameInput.spellcheck = false;
    this.nameInput.setAttribute('aria-label', 'Your unicorn name');
    this.nameInput.addEventListener('input', () => this.copyNameToScene());
    nameGroup.append(nameLabel, this.nameInput);
    this.root.append(nameGroup);

    const sectionTabs = document.createElement('div');
    sectionTabs.className = 'creator-portrait-tabs';
    sectionTabs.setAttribute('role', 'group');
    sectionTabs.setAttribute('aria-label', 'Customisation sections');
    for (const key of CREATOR_CATEGORIES.map(({ id }) => id)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'creator-portrait-tab';
      button.textContent = SECTION_LABELS[key];
      button.dataset.creatorSection = key;
      button.addEventListener('click', () => this.showSection(key));
      this.sectionButtons.set(key, button);
      sectionTabs.append(button);
    }
    this.root.append(sectionTabs);

    for (const key of CREATOR_CATEGORIES.map(({ id }) => id)) {
      const panel = document.createElement('div');
      panel.className = 'creator-portrait-section';
      panel.dataset.creatorSectionPanel = key;
      panel.setAttribute('aria-label', SECTION_LABELS[key]);
      this.sectionPanels.set(key, panel);
      this.root.append(panel);
    }

    for (const definition of COLOUR_DEFINITIONS) {
      this.createColourRow(definition);
    }
    for (const definition of CYCLE_DEFINITIONS) {
      this.createCycleRow(definition);
    }

    this.status = document.createElement('p');
    this.status.className = 'creator-portrait-status';
    this.status.setAttribute('aria-live', 'polite');
    this.root.append(this.status);

    const actions = document.createElement('div');
    actions.className = 'creator-portrait-actions';
    for (const [objectName, labelName, primary] of ACTION_DEFINITIONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `creator-portrait-action${primary ? ' creator-portrait-primary' : ''}`;
      button.dataset.creatorAction = objectName;
      button.addEventListener('click', () => this.activate(objectName));
      actions.append(button);
      this.actions.push({ objectName, labelName, button });
    }
    this.root.append(actions);

    (document.querySelector('#game-shell') ?? document.body).append(this.root);
    this.showSection(this.activeSection);
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private createColourRow(definition: ColourDefinition): void {
    const panel = this.sectionPanels.get(definition.section);
    if (!panel) {
      return;
    }

    const row = document.createElement('fieldset');
    row.className = 'creator-portrait-colour-row';
    const legend = document.createElement('legend');
    legend.textContent = definition.label;
    row.append(legend);

    const choices = document.createElement('div');
    choices.className = 'creator-portrait-swatches';
    for (const choice of definition.choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'creator-portrait-swatch';
      button.dataset.creatorChoice = `${definition.key}:${choice.id}`;
      button.setAttribute('aria-label', `${definition.label}: ${choice.label}`);
      button.style.setProperty('--creator-swatch', colourCss(choice.value));

      const dot = document.createElement('span');
      dot.className = 'creator-portrait-swatch-dot';
      const text = document.createElement('span');
      text.textContent = choice.label;
      button.append(dot, text);
      button.addEventListener('click', () => this.selectChoice(definition.key, choice.id));
      choices.append(button);
      this.colourChoices.push({ definition, choiceId: choice.id, button });
    }
    row.append(choices);
    panel.append(row);
  }

  private createCycleRow(definition: CycleDefinition): void {
    const panel = this.sectionPanels.get(definition.section);
    if (!panel) {
      return;
    }

    const row = document.createElement('div');
    row.className = 'creator-portrait-cycle-row';
    const label = document.createElement('span');
    label.className = 'creator-portrait-cycle-label';
    label.textContent = definition.label;

    const controls = document.createElement('div');
    controls.className = 'creator-portrait-style-cards';
    const choices = definition.choices.map((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'creator-portrait-style-card';
      button.dataset.creatorComponent = definition.key;
      button.dataset.creatorComponentId = choice.id;
      const art = document.createElement('span');
      art.className = 'creator-portrait-component-art';
      art.setAttribute('aria-hidden', 'true');
      art.textContent = COMPONENT_SYMBOLS[definition.key][choice.id] ?? '✦';
      const text = document.createElement('span');
      text.textContent = choice.label;
      button.append(art, text);
      button.addEventListener('click', () => this.selectChoice(definition.key, choice.id));
      controls.append(button);
      return { id: choice.id, button };
    });
    row.append(label, controls);
    panel.append(row);
    this.cycleRows.push({ definition, choices });
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }
    this.sync();
  }

  private sync(): void {
    const scene = this.activeScene();
    if (!scene) {
      this.root.hidden = true;
      return;
    }

    this.root.hidden = false;

    const heading = scene.children.getByName('creator-heading');
    if (heading instanceof Phaser.GameObjects.Text) {
      this.heading.textContent = heading.text;
    }
    const status = scene.children.getByName('creator-status');
    if (status instanceof Phaser.GameObjects.Text) {
      this.status.textContent = status.text;
    }

    const sceneNameInput = this.sceneNameInput();
    if (sceneNameInput && document.activeElement !== this.nameInput) {
      this.nameInput.value = sceneNameInput.value;
    }

    for (const { definition, choiceId, button } of this.colourChoices) {
      const selected = this.choiceSelected(scene, definition.key, choiceId);
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-selected', selected);
      button.disabled = false;
    }

    for (const { definition, choices } of this.cycleRows) {
      for (const choice of choices) {
        const selected =
          (
            scene as Phaser.Scene & {
              creatorChoiceSelected?: (key: CycleKey, value: string) => boolean;
            }
          ).creatorChoiceSelected?.(definition.key, choice.id) ?? false;
        choice.button.setAttribute('aria-pressed', String(selected));
      }
    }

    for (const action of this.actions) {
      const target = scene.children.getByName(action.objectName);
      const label = scene.children.getByName(action.labelName);
      action.button.hidden = !isVisible(target);
      action.button.disabled = !isEnabled(target);
      if (label instanceof Phaser.GameObjects.Text) {
        action.button.textContent = label.text;
      }
    }
  }

  private choiceSelected(scene: Phaser.Scene, key: ColourKey, value: string): boolean {
    const owner = scene as Phaser.Scene & {
      creatorChoiceSelected?: (key: ColourKey, value: string) => boolean;
    };
    return owner.creatorChoiceSelected?.(key, value) ?? false;
  }

  private showSection(section: SectionKey): void {
    this.activeSection = section;
    for (const [key, button] of this.sectionButtons) {
      const selected = key === section;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-selected', selected);
    }
    for (const [key, panel] of this.sectionPanels) {
      panel.hidden = key !== section;
    }
  }

  private selectChoice(key: keyof UnicornAppearance, value: string): void {
    const scene = this.activeScene() as
      | (Phaser.Scene & {
          creatorSelect?: (key: keyof UnicornAppearance, value: string) => void;
        })
      | null;
    scene?.creatorSelect?.(key, value);
    this.sync();
  }

  private copyNameToScene(): void {
    const input = this.sceneNameInput();
    if (input) {
      input.value = this.nameInput.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private sceneNameInput(): HTMLInputElement | null {
    return document.querySelector<HTMLInputElement>('#game-container .unicorn-name-input');
  }

  private activeScene(): Phaser.Scene | null {
    return (
      this.game.scene.getScenes(true).find((scene) => scene.scene.key === CREATOR_SCENE_KEY) ?? null
    );
  }

  private activate(objectName: string): void {
    const scene = this.activeScene();
    const target = scene?.children.getByName(objectName);
    if (!scene || !target || !isVisible(target) || !isEnabled(target)) {
      return;
    }

    void getVerticalSliceAudio().unlock();
    target.emit('pointerdown');
    this.sync();
  }
}

let manager: CreatorPortraitControlsManager | null = null;

export function getCreatorPortraitControlsManager(
  game: Phaser.Game,
): CreatorPortraitControlsManager {
  manager ??= new CreatorPortraitControlsManager(game);
  return manager;
}
