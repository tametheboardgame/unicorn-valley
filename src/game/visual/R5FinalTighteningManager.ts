import Phaser from 'phaser';

const FIREFLY_BUTTON_WIDTH = 244;
const FIREFLY_BUTTON_HEIGHT = 80;
const FIREFLY_BUTTON_XS = [354, 640, 926] as const;
const COTTAGE_WALL_ANCHOR = 'r5-final-cottage-wall-anchor';
const RAIN_CONTAINER_NAME = 'magical-weather-rain-screen';
const SUGGESTION_CARD_NAME = 'activity-suggestion-card';

function findNamedContainer(
  scene: Phaser.Scene,
  name: string,
): Phaser.GameObjects.Container | null {
  const object = scene.children.getByName(name);
  return object instanceof Phaser.GameObjects.Container ? object : null;
}

function tightenFireflySelector(scene: Phaser.Scene): void {
  const selector =
    findNamedContainer(scene, 'firefly-mode-selector') ??
    findNamedContainer(scene, 'firefly-difficulty-selector');
  if (!selector) {
    return;
  }

  const buttons = selector.list
    .filter(
      (object): object is Phaser.GameObjects.Text =>
        object instanceof Phaser.GameObjects.Text && /^\s*[123]\s/.test(object.text),
    )
    .sort((left, right) => left.x - right.x);

  buttons.forEach((button, index) => {
    const x = FIREFLY_BUTTON_XS[index];
    if (x === undefined) {
      return;
    }
    button
      .setName(`r5-final-firefly-selector-button:${index + 1}`)
      .setX(x)
      .setFontSize(17)
      .setPadding(8, 10, 8, 10)
      .setFixedSize(FIREFLY_BUTTON_WIDTH, FIREFLY_BUTTON_HEIGHT)
      .setOrigin(0.5);
  });
}

function tightenSuggestionCard(scene: Phaser.Scene): void {
  const panel = scene.children.getByName(SUGGESTION_CARD_NAME);
  if (!(panel instanceof Phaser.GameObjects.Rectangle) || !panel.visible) {
    return;
  }

  const buttonY = panel.y + panel.displayHeight / 2 - 44;
  const footerY = panel.y + panel.displayHeight / 2 - 15;
  for (const object of scene.children.list) {
    if (object instanceof Phaser.GameObjects.Text) {
      if (object.text === 'Another idea' || object.text === 'Got it! ✨') {
        object.setY(buttonY);
      } else if (object.text === 'Hide ideas for now') {
        object.setName('r5-final-suggestion-footer').setY(footerY);
      }
      continue;
    }

    if (
      object instanceof Phaser.GameObjects.Rectangle &&
      object !== panel &&
      object.depth === 118 &&
      Math.abs(object.y - (panel.y + panel.displayHeight / 2 - 36)) < 2
    ) {
      object.setY(buttonY);
    }
  }
}

function strengthenRain(scene: Phaser.Scene): void {
  const rain = findNamedContainer(scene, RAIN_CONTAINER_NAME);
  if (!rain) {
    return;
  }

  for (const object of rain.list) {
    if (!(object instanceof Phaser.GameObjects.Rectangle)) {
      continue;
    }
    object
      .setName('r5-final-rain-drop')
      .setFillStyle(0x6f9eb4, 0.68)
      .setDisplaySize(Math.max(4, object.displayWidth), object.displayHeight);
  }
}

function tightenCottageInterior(scene: Phaser.Scene): void {
  if (scene.children.getByName(COTTAGE_WALL_ANCHOR)) {
    return;
  }

  scene.add.rectangle(900, 210, 1610, 260, 0xf7e8d6, 1).setName(COTTAGE_WALL_ANCHOR).setDepth(2.4);
  scene.add
    .rectangle(900, 340, 1610, 12, 0xb98b72, 0.42)
    .setName('r5-final-cottage-baseboard')
    .setDepth(4.4);

  for (const x of [670, 1130]) {
    scene.add
      .rectangle(x, 218, 224, 14, 0x9b785f, 0.96)
      .setName('r5-final-cottage-window-sill')
      .setDepth(6.2);
  }
}

export class R5FinalTighteningManager {
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      tightenSuggestionCard(scene);
      strengthenRain(scene);

      if (scene.scene.key === 'FireflyLanternScene') {
        tightenFireflySelector(scene);
      } else if (scene.scene.key === 'CottageInteriorScene') {
        tightenCottageInterior(scene);
      }
    }
  }
}

let manager: R5FinalTighteningManager | null = null;

export function getR5FinalTighteningManager(game: Phaser.Game): R5FinalTighteningManager {
  manager ??= new R5FinalTighteningManager(game);
  return manager;
}
