import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

const LOCATION_TITLES: Readonly<Record<string, string>> = {
  MoonflowerGladeScene: 'Moonflower Glade',
  CottageInteriorScene: 'Moonflower Cottage',
  MoonflowerPatchScene: 'Moonflower Patch',
  SunbeamVillageScene: 'Sunbeam Village',
  RainbowMeadowScene: 'Rainbow Meadow',
};

const LEGACY_STATUS_PREFIXES = [
  'Pip is nearby.',
  'Your Moonflower Sparkle is safely remembered.',
  'Pip noticed!',
];

export class ExplorationChrome {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly helpObjects: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text> = [];
  private readonly titleText: Phaser.GameObjects.Text | null;
  private readonly controlsButton: Phaser.GameObjects.Rectangle | null;
  private readonly controlsLabel: Phaser.GameObjects.Text | null;
  private helpOpen = false;

  public constructor(private readonly scene: Phaser.Scene) {
    const locationTitle = LOCATION_TITLES[scene.scene.key];
    if (!locationTitle) {
      this.titleText = null;
      this.controlsButton = null;
      this.controlsLabel = null;
      return;
    }

    const titleShadow = createUiShadow(scene, GAME_WIDTH / 2, 43, 340, 58, 123, 0.15);
    const titlePanel = scene.add
      .rectangle(GAME_WIDTH / 2, 40, 340, 58, UI_COLOURS.cream, 0.96)
      .setName('exploration-location-title-panel')
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.92)
      .setScrollFactor(0)
      .setDepth(124);
    this.titleText = scene.add
      .text(GAME_WIDTH / 2, 40, locationTitle, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setName('exploration-location-title')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(125);

    const buttonX = GAME_WIDTH - 112;
    const buttonY = GAME_HEIGHT - 38;
    const buttonShadow = createUiShadow(scene, buttonX, buttonY, 188, 52, 123, 0.16);
    this.controlsButton = scene.add
      .rectangle(buttonX, buttonY, 188, 52, UI_COLOURS.cream, 0.98)
      .setName('exploration-controls-button')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.96)
      .setScrollFactor(0)
      .setDepth(124)
      .setInteractive({ useHandCursor: true });
    this.controlsLabel = scene.add
      .text(buttonX, buttonY, 'Controls  ?', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(125);
    applyButtonHover(this.controlsButton, UI_COLOURS.cream, UI_COLOURS.gold);

    const panelX = GAME_WIDTH - 190;
    const panelY = GAME_HEIGHT - 144;
    const panelShadow = createUiShadow(scene, panelX, panelY, 350, 140, 126, 0.2);
    const panel = scene.add
      .rectangle(panelX, panelY, 350, 140, UI_COLOURS.cream, 0.99)
      .setName('exploration-controls-panel')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(127);
    const heading = scene.add
      .text(panelX, panelY - 45, 'How to play', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(128);
    const help = scene.add
      .text(
        panelX,
        panelY + 12,
        'Move: WASD / arrows\nInteract: E / Enter / Space\nB: Wonderbook   I: Bag   Esc: title',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '14px',
          align: 'center',
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(128);

    this.helpObjects.push(panelShadow, panel, heading, help);
    this.objects.push(
      titleShadow,
      titlePanel,
      this.titleText,
      buttonShadow,
      this.controlsButton,
      this.controlsLabel,
      ...this.helpObjects,
    );

    this.controlsButton.on('pointerdown', () => {
      this.helpOpen = !this.helpOpen;
      this.setHelpVisible(this.helpOpen);
    });

    this.setHelpVisible(false);
    this.refresh();
  }

  public refresh(): void {
    const locationTitle = LOCATION_TITLES[this.scene.scene.key];
    if (!locationTitle) {
      return;
    }

    for (const object of this.scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text) || object === this.titleText) {
        continue;
      }

      const text = object.text.trim();
      const isLegacyTitle = text === locationTitle && object.scrollFactorX === 0 && object.depth >= 100;
      const isLegacyControls = text.startsWith('Move: WASD / arrows');
      const isLegacyStatus = LEGACY_STATUS_PREFIXES.some((prefix) => text.startsWith(prefix));
      if (isLegacyTitle || isLegacyControls || isLegacyStatus) {
        object.setVisible(false);
      }
    }
  }

  public destroy(): void {
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
    this.helpObjects.length = 0;
  }

  private setHelpVisible(visible: boolean): void {
    for (const object of this.helpObjects) {
      object.setVisible(visible);
    }
    this.controlsLabel?.setText(visible ? 'Controls  ×' : 'Controls  ?');
  }
}
