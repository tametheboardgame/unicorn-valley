import Phaser from 'phaser';
import '../../creatorPortraitControls.css';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { BODY_COLOURS, EYE_COLOURS, HAIR_COLOURS } from '../player/UnicornAppearance';

const CREATOR_SCENE_KEY = 'UnicornCreatorScene';
const SYNC_INTERVAL_MS = 100;

type ColourKey = 'bodyColour' | 'eyeColour' | 'maneColour' | 'tailColour';
type CycleKey = 'maneStyle' | 'tailStyle' | 'hornStyle' | 'marking' | 'accessory';
type SectionKey = 'colours' | 'hair' | 'magic';

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
}

interface DomColourChoice {
  definition: ColourDefinition;
  choiceId: string;
  button: HTMLButtonElement;
}

interface DomCycleRow {
  definition: CycleDefinition;
  value: HTMLElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
}

interface DomAction {
  objectName: string;
  labelName: string;
  button: HTMLButtonElement;
}

const COLOUR_DEFINITIONS: readonly ColourDefinition[] = [
  { key: 'bodyColour', label: 'Body', section: 'colours', choices: BODY_COLOURS },
  { key: 'eyeColour', label: 'Eyes', section: 'colours', choices: EYE_COLOURS },
  { key: 'maneColour', label: 'Mane colour', section: 'hair', choices: HAIR_COLOURS },
  { key: 'tailColour', label: 'Tail colour', section: 'hair', choices: HAIR_COLOURS },
];

const CYCLE_DEFINITIONS: readonly CycleDefinition[] = [
  { key: 'maneStyle', label: 'Mane style', section: 'hair' },
  { key: 'tailStyle', label: 'Tail style', section: 'hair' },
  { key: 'hornStyle', label: 'Horn', section: 'magic' },
  { key: 'marking', label: 'Marking', section: 'magic' },
  { key: 'accessory', label: 'Accessory', section: 'magic' },
];

const SECTION_LABELS: Readonly<Record<SectionKey, string>> = {
  colours: 'Colours',
  hair: 'Hair & Tail',
  magic: 'Magic',
};

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
    nameLabel.textContent = 'Name';
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
    for (const key of Object.keys(SECTION_LABELS) as SectionKey[]) {
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

    for (const key of Object.keys(SECTION_LABELS) as SectionKey[]) {
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
      button.addEventListener('click', () =>
        this.activate(`creator-${definition.key}-${choice.id}`),
      );
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
    controls.className = 'creator-portrait-cycle-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'creator-portrait-cycle-button';
    previous.textContent = '‹';
    previous.setAttribute('aria-label', `Previous ${definition.label}`);
    previous.addEventListener('click', () => this.activate(`creator-${definition.key}-previous`));

    const value = document.createElement('strong');
    value.className = 'creator-portrait-cycle-value';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'creator-portrait-cycle-button';
    next.textContent = '›';
    next.setAttribute('aria-label', `Next ${definition.label}`);
    next.addEventListener('click', () => this.activate(`creator-${definition.key}-next`));

    controls.append(previous, value, next);
    row.append(label, controls);
    panel.append(row);
    this.cycleRows.push({ definition, value, previous, next });
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
      const target = scene.children.getByName(`creator-${definition.key}-${choiceId}`);
      const selected = target instanceof Phaser.GameObjects.Arc && target.scaleX > 1.03;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-selected', selected);
      button.disabled = !isEnabled(target);
    }

    for (const { definition, value, previous, next } of this.cycleRows) {
      const valueObject = scene.children.getByName(`creator-${definition.key}-value`);
      value.textContent = valueObject instanceof Phaser.GameObjects.Text ? valueObject.text : '';
      previous.disabled = !isEnabled(
        scene.children.getByName(`creator-${definition.key}-previous`),
      );
      next.disabled = !isEnabled(scene.children.getByName(`creator-${definition.key}-next`));
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
