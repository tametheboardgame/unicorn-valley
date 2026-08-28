import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

export type VillageInteriorId = 'bakery' | 'accessory-shop' | 'library';

interface VillageInteriorSceneData {
  interiorId?: VillageInteriorId;
  returnScene?: string;
}

interface VillageInteriorDefinition {
  id: VillageInteriorId;
  title: string;
  subtitle: string;
  icon: string;
  wallColour: number;
  floorColour: number;
  accentColour: number;
  actionLabel: string;
  feedback: string;
}

const VILLAGE_INTERIORS: Readonly<Record<VillageInteriorId, VillageInteriorDefinition>> = {
  bakery: {
    id: 'bakery',
    title: 'Sunbeam Bakery',
    subtitle: 'Warm ovens, berry buns and a window full of treats.',
    icon: '🥐',
    wallColour: 0xffd6a3,
    floorColour: 0xd99d6b,
    accentColour: 0xf28b62,
    actionLabel: 'Try a berry bun',
    feedback: 'The berry bun is warm, jammy and dusted with sparkling sugar. Delicious! ✨',
  },
  'accessory-shop': {
    id: 'accessory-shop',
    title: 'Twinkle & Thread',
    subtitle: 'Ribbons, charms and tiny treasures for unicorn adventures.',
    icon: '🎀',
    wallColour: 0xf6d5ef,
    floorColour: 0xc894bd,
    accentColour: 0xc56fb6,
    actionLabel: 'Browse accessories',
    feedback: 'Pick something lovely from the shelves.',
  },
  library: {
    id: 'library',
    title: 'Story House',
    subtitle: 'A cosy little library where every shelf has a valley story.',
    icon: '📚',
    wallColour: 0xd9edff,
    floorColour: 0x8eb5c8,
    accentColour: 0x648fac,
    actionLabel: 'Read a valley story',
    feedback: 'You find a story about a moonflower that only opened for a brave little unicorn. 🌙',
  },
};

function isVillageInteriorId(value: unknown): value is VillageInteriorId {
  return value === 'bakery' || value === 'accessory-shop' || value === 'library';
}

export class VillageInteriorScene extends Phaser.Scene {
  private interiorId: VillageInteriorId = 'accessory-shop';
  private returnScene = 'SunbeamVillageScene';
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private closing = false;

  public constructor() {
    super('VillageInteriorScene');
  }

  public create(data: VillageInteriorSceneData): void {
    this.interiorId = isVillageInteriorId(data.interiorId) ? data.interiorId : 'accessory-shop';
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;

    const definition = VILLAGE_INTERIORS[this.interiorId];
    this.cameras.main.setBackgroundColor('#5d4964');
    this.createRoom(definition);
    this.createControls(definition);

    this.input.keyboard?.on('keydown-ESC', this.leaveInterior, this);
    this.input.keyboard?.on('keydown-E', this.activateInterior, this);
    this.input.keyboard?.on('keydown-ENTER', this.activateInterior, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveInterior, this);
      this.input.keyboard?.off('keydown-E', this.activateInterior, this);
      this.input.keyboard?.off('keydown-ENTER', this.activateInterior, this);
      this.feedbackText = null;
    });
  }

  private createRoom(definition: VillageInteriorDefinition): void {
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x5b4662, 1)
      .setName(`village-interior:${definition.id}`);
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1120, 650, 1, 0.28);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1120, 650, definition.wallColour, 1)
      .setStrokeStyle(8, definition.accentColour, 0.95)
      .setDepth(2);
    this.add.rectangle(GAME_WIDTH / 2, 565, 1100, 245, definition.floorColour, 1).setDepth(3);
    this.add.rectangle(GAME_WIDTH / 2, 444, 1100, 18, 0xffffff, 0.4).setDepth(4);

    this.add
      .text(GAME_WIDTH / 2, 88, `${definition.icon}  ${definition.title}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.add
      .text(GAME_WIDTH / 2, 132, definition.subtitle, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.createWindow(300, 270, definition.accentColour);
    this.createWindow(980, 270, definition.accentColour);

    if (definition.id === 'bakery') {
      this.createBakeryDetails();
    } else if (definition.id === 'library') {
      this.createLibraryDetails();
    } else {
      this.createAccessoryDetails();
    }

    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 605, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#fff8e8e8',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setVisible(false);
  }

  private createWindow(x: number, y: number, accentColour: number): void {
    this.add
      .rectangle(x, y, 220, 150, 0xbce9f4, 1)
      .setStrokeStyle(10, accentColour, 0.85)
      .setDepth(5);
    this.add.rectangle(x, y, 10, 140, 0xffffff, 0.68).setDepth(6);
    this.add.rectangle(x, y, 210, 10, 0xffffff, 0.68).setDepth(6);
    this.add.circle(x - 56, y - 38, 22, 0xffef9d, 0.82).setDepth(5.5);
  }

  private createBakeryDetails(): void {
    this.add
      .rectangle(640, 382, 430, 132, 0xb77456, 1)
      .setStrokeStyle(5, 0x8d553f, 0.9)
      .setDepth(6)
      .setName('village-interior-bakery-counter');
    for (const [x, icon] of [
      [525, '🥐'],
      [610, '🧁'],
      [695, '🍓'],
      [780, '🥖'],
    ] as const) {
      this.add
        .text(x, 335, icon, { fontFamily: UI_FONT, fontSize: '42px' })
        .setOrigin(0.5)
        .setDepth(7);
    }
    this.add.rectangle(640, 485, 300, 66, 0x7c5947, 1).setDepth(5);
    this.add
      .text(640, 485, 'TODAY: BERRY SUNBUNS', {
        color: '#fff4d8',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(7);
  }

  private createAccessoryDetails(): void {
    this.add
      .rectangle(640, 380, 390, 126, 0xb77baa, 1)
      .setStrokeStyle(5, 0x8e5d86, 0.9)
      .setDepth(6)
      .setName('village-interior-accessory-counter');
    for (const [x, icon] of [
      [515, '🎀'],
      [600, '✨'],
      [685, '🌸'],
      [770, '👑'],
    ] as const) {
      this.add.circle(x, 320, 42, 0xfff6fb, 0.82).setStrokeStyle(3, 0xd8a4cf, 0.9).setDepth(6);
      this.add
        .text(x, 320, icon, { fontFamily: UI_FONT, fontSize: '34px' })
        .setOrigin(0.5)
        .setDepth(7);
    }
    this.add
      .text(640, 465, 'Little treasures • no story purchase required', {
        color: '#684c67',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(7);
  }

  private createLibraryDetails(): void {
    for (const x of [480, 640, 800]) {
      this.add
        .rectangle(x, 360, 135, 250, 0x6f8aa0, 1)
        .setStrokeStyle(5, 0x526f86, 0.9)
        .setDepth(5)
        .setName(x === 640 ? 'village-interior-library-shelves' : '');
      for (let row = 0; row < 4; row += 1) {
        this.add.rectangle(x, 286 + row * 54, 112, 9, 0x435d72, 0.9).setDepth(6);
        for (let column = 0; column < 5; column += 1) {
          this.add
            .rectangle(
              x - 42 + column * 21,
              270 + row * 54,
              13,
              28,
              0xe8a178 + column * 0x030303,
              1,
            )
            .setDepth(6);
        }
      }
    }
    this.add.ellipse(640, 535, 360, 120, 0xf2d7a7, 1).setDepth(5);
    this.add
      .text(640, 528, '🌙   📖   ✨', { fontFamily: UI_FONT, fontSize: '34px' })
      .setOrigin(0.5)
      .setDepth(6);
  }

  private createControls(definition: VillageInteriorDefinition): void {
    const backButton = this.add
      .rectangle(430, GAME_HEIGHT - 55, 290, 62, UI_COLOURS.lavender, 1)
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setName('village-interior-back')
      .setDepth(14);
    const backLabel = this.add
      .text(430, GAME_HEIGHT - 55, '← Back to the village', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);

    const actionButton = this.add
      .rectangle(850, GAME_HEIGHT - 55, 340, 62, UI_COLOURS.gold, 1)
      .setStrokeStyle(4, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setName('village-interior-action')
      .setDepth(14);
    const actionLabel = this.add
      .text(850, GAME_HEIGHT - 55, definition.actionLabel, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);

    applyButtonHover(backButton, UI_COLOURS.lavender, UI_COLOURS.blush);
    applyButtonHover(actionButton, UI_COLOURS.gold, UI_COLOURS.blush);
    backButton.on('pointerdown', this.leaveInterior, this);
    backLabel.on('pointerdown', this.leaveInterior, this);
    actionButton.on('pointerdown', this.activateInterior, this);
    actionLabel.on('pointerdown', this.activateInterior, this);
  }

  private activateInterior(): void {
    if (this.closing) {
      return;
    }

    const definition = VILLAGE_INTERIORS[this.interiorId];
    if (definition.id === 'accessory-shop') {
      this.feedbackText?.setText(definition.feedback).setVisible(true);
      this.scene.launch('ShopScene', { returnScene: 'VillageInteriorScene' });
      this.scene.pause();
      return;
    }

    this.feedbackText?.setText(definition.feedback).setVisible(true);
    this.cameras.main.flash(120, 255, 240, 184, false);
  }

  private leaveInterior(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.scene.start(this.returnScene);
  }
}
