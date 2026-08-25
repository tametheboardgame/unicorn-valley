import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { worldDepthForY } from './WorldDepth';

const PRESENTATION_ANCHOR_NAME = 'exploration-geometry-presentation-anchor';
const SUPPORTED_SCENES = new Set([
  'MoonflowerGladeScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
]);

interface HintDefinition {
  startsWith: string;
  replacement: string;
  x: number;
  y: number;
}

interface BranchCueDefinition {
  id: string;
  text: string;
  x: number;
  y: number;
}

const HINTS: Readonly<Partial<Record<string, HintDefinition>>> = {
  CrystalBrookScene: {
    startsWith: 'Follow the water, hop between stones',
    replacement: 'The pale stream is shallow here. Follow it to find little treasures.',
    x: 1640,
    y: 960,
  },
  WhisperingWoodsScene: {
    startsWith: 'The little green lights always follow a safe path.',
    replacement: 'Little green lights mark the safest woodland trail.',
    x: 910,
    y: 1010,
  },
};

const BRANCH_CUES: Readonly<Partial<Record<string, readonly BranchCueDefinition[]>>> = {
  MoonflowerGladeScene: [
    {
      id: 'moonflower-field',
      text: '🌺 Moonflower Field ↓',
      x: 1810,
      y: 1060,
    },
  ],
  RainbowMeadowScene: [
    {
      id: 'rainbow-run',
      text: '🏁 Rainbow Run →',
      x: 2390,
      y: 900,
    },
  ],
  CrystalBrookScene: [
    {
      id: 'prism-grotto',
      text: '🌈 Prism Grotto ↘',
      x: 2490,
      y: 1450,
    },
  ],
  WhisperingWoodsScene: [
    {
      id: 'lantern-clearing',
      text: '🏮 Lantern Clearing ↗',
      x: 2310,
      y: 880,
    },
  ],
};

function replaceLegacyHint(scene: Phaser.Scene): void {
  const definition = HINTS[scene.scene.key];
  if (!definition) {
    return;
  }

  const legacyHint = scene.children.list.find(
    (object): object is Phaser.GameObjects.Text =>
      object instanceof Phaser.GameObjects.Text && object.text.startsWith(definition.startsWith),
  );
  if (!legacyHint) {
    return;
  }

  legacyHint
    .setText(definition.replacement)
    .setName('region-world-guidance')
    .setPosition(definition.x, definition.y)
    .setOrigin(0.5)
    .setScrollFactor(1)
    .setDepth(16);
}

function createBranchCue(scene: Phaser.Scene, cue: BranchCueDefinition): void {
  const post = scene.add.rectangle(0, 24, 12, 58, 0x785f47, 1);
  const board = scene.add
    .rectangle(0, -4, 220, 48, 0xf5e5bd, 0.96)
    .setStrokeStyle(4, 0xa78262, 0.95);
  const label = scene.add
    .text(0, -4, cue.text, {
      color: '#5c4a56',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.add
    .container(cue.x, cue.y, [post, board, label])
    .setName(`region-branch-cue:${cue.id}`)
    .setDepth(worldDepthForY(cue.y, 0.45));
}

function decorateScene(scene: Phaser.Scene): void {
  replaceLegacyHint(scene);
  for (const cue of BRANCH_CUES[scene.scene.key] ?? []) {
    createBranchCue(scene, cue);
  }
}

export class ExplorationGeometryPresentationManager {
  private readonly syncThrottle = new RefreshThrottle(120);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      if (!SUPPORTED_SCENES.has(scene.scene.key)) {
        continue;
      }
      if (scene.children.getByName(PRESENTATION_ANCHOR_NAME)) {
        continue;
      }

      scene.add.zone(-64, -64, 2, 2).setName(PRESENTATION_ANCHOR_NAME).setVisible(false);
      decorateScene(scene);
    }
  }
}

let manager: ExplorationGeometryPresentationManager | null = null;

export function getExplorationGeometryPresentationManager(
  game: Phaser.Game,
): ExplorationGeometryPresentationManager {
  manager ??= new ExplorationGeometryPresentationManager(game);
  return manager;
}
