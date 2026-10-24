import Phaser from 'phaser';
import {
  ECHO_CRYSTAL_SONG_COMPLETE_FLAG,
  ECHO_CRYSTAL_SONG_QUEST_ID,
} from '../../content/r6CrystalBrookDepthContent';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import type { InteractionActionKind, InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { launchMiniGame } from '../minigames/MiniGameLauncher';
import { getGrottoGateAccess } from '../minigames/crystalarium/CrystalariumGrottoGate';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { CrystalGrottoStoryService } from '../story/CrystalGrottoStoryService';
import {
  CRYSTAL_BROOK_GROTTO_THRESHOLD,
  CRYSTAL_BROOK_CRYSTALARIUM_NURSERY,
  CRYSTAL_BROOK_PEBBLE_STACK,
  CRYSTAL_BROOK_REFLECTION_POOL,
  CRYSTAL_BROOK_SHALLOW_RIPPLE,
  CRYSTAL_BROOK_SHELL_SPARKLE,
  CRYSTAL_BROOK_SINGING_CRYSTALS,
  CRYSTAL_BROOK_WATERFALL_MIST,
} from './CrystalBrookMap';
import { worldDepthForY } from './WorldDepth';

interface Point {
  x: number;
  y: number;
}

interface BrookInteractionDefinition {
  id: string;
  label: string;
  actionLabel: string;
  actionKind: InteractionActionKind;
  position: Point;
  radius: number;
  icon: string;
}

interface BrookInteractionRuntime {
  definition: BrookInteractionDefinition;
  container: Phaser.GameObjects.Container;
}

interface BrookDepthState {
  scene: Phaser.Scene;
  interactions: BrookInteractionRuntime[];
  feedback: Phaser.GameObjects.Text;
  persistent: Phaser.GameObjects.Container | null;
  signature: string;
}

const REGISTRY_OWNER = 'crystal-brook-depth';
const INTERACTIONS: readonly BrookInteractionDefinition[] = [
  {
    id: 'crystalarium-nursery',
    label: 'Crystalarium Nursery',
    actionLabel: 'Play Crystalarium',
    actionKind: 'interact',
    position: CRYSTAL_BROOK_CRYSTALARIUM_NURSERY,
    radius: 160,
    icon: '🎼',
  },
  {
    id: 'crystal-grotto',
    label: 'Crystal Grotto',
    actionLabel: 'Listen at the sealed arch',
    actionKind: 'enter',
    position: CRYSTAL_BROOK_GROTTO_THRESHOLD.position,
    radius: 155,
    icon: '💎',
  },
  {
    id: 'waterfall-mist',
    label: 'Waterfall Mist',
    actionLabel: 'Step into the mist',
    actionKind: 'interact',
    position: CRYSTAL_BROOK_WATERFALL_MIST,
    radius: 145,
    icon: '🌈',
  },
  {
    id: 'reflection-pool',
    label: 'Reflection Pool',
    actionLabel: 'Look into the water',
    actionKind: 'inspect',
    position: CRYSTAL_BROOK_REFLECTION_POOL,
    radius: 120,
    icon: '💧',
  },
  {
    id: 'shallow-ripple',
    label: 'Shallow Brook',
    actionLabel: 'Splash',
    actionKind: 'interact',
    position: CRYSTAL_BROOK_SHALLOW_RIPPLE,
    radius: 145,
    icon: '≈',
  },
  {
    id: 'singing-crystals',
    label: 'River crystal cluster',
    actionLabel: 'Tap a crystal',
    actionKind: 'interact',
    position: CRYSTAL_BROOK_SINGING_CRYSTALS,
    radius: 145,
    icon: '🔷',
  },
  {
    id: 'shell-sparkle',
    label: 'Shell-sparkle bank',
    actionLabel: 'Search',
    actionKind: 'inspect',
    position: CRYSTAL_BROOK_SHELL_SPARKLE,
    radius: 145,
    icon: '🐚',
  },
  {
    id: 'pebble-stack',
    label: 'Flat pebble pile',
    actionLabel: 'Stack',
    actionKind: 'interact',
    position: CRYSTAL_BROOK_PEBBLE_STACK,
    radius: 145,
    icon: '🪨',
  },
];

export class CrystalBrookDepthWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly story = new CrystalGrottoStoryService(this.saveService, getBrowserQuestEngine());
  private readonly time = getBrowserAtmosphericTimeService(this.saveService);
  private readonly weather = getBrowserMagicalWeatherService(this.saveService);
  private state: BrookDepthState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      this.destroyState();
    });
  }

  private update(): void {
    const scene = this.game.scene.getScene('CrystalBrookScene');
    if (!scene?.scene.isActive()) {
      this.destroyState();
      return;
    }

    const state = this.ensureState(scene);
    this.syncPersistent(state);
  }

  private ensureState(scene: Phaser.Scene): BrookDepthState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.destroyState();

    const state: BrookDepthState = {
      scene,
      interactions: [],
      feedback: scene.add
        .text(640, 116, '', {
          color: '#435d66',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 760 },
          backgroundColor: '#f3fff8f2',
          padding: { x: 17, y: 9 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(188)
        .setVisible(false),
      persistent: null,
      signature: '',
    };
    state.interactions = INTERACTIONS.map((definition) =>
      this.createInteraction(state, definition),
    );
    this.state = state;
    this.publishTargets(state);
    this.syncPersistent(state, true);
    return state;
  }

  private createInteraction(
    state: BrookDepthState,
    definition: BrookInteractionDefinition,
  ): BrookInteractionRuntime {
    const glow = state.scene.add.circle(0, 0, 25, 0xb8f3ff, 0.07).setStrokeStyle(2, 0xffffff, 0.15);
    const icon = state.scene.add
      .text(0, 0, definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
      })
      .setOrigin(0.5)
      .setAlpha(0.75);
    const container = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, icon])
      .setName(`brook-depth:${definition.id}`)
      .setDepth(worldDepthForY(definition.position.y + 15, 0.35));

    state.scene.tweens.add({
      targets: [glow, icon],
      alpha: { from: 0.38, to: 0.86 },
      duration: 1080,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return { definition, container };
  }

  private publishTargets(state: BrookDepthState): void {
    const targets: InteractionTarget[] = state.interactions.map(({ definition, container }) => ({
      id: `interaction:brook-depth:${definition.id}`,
      label: definition.label,
      actionLabel:
        definition.id === 'crystal-grotto'
          ? this.story.isGrottoOpen()
            ? 'Go inside'
            : this.story.isOpeningMelodyReady()
              ? 'Play opening melody'
              : 'Listen at the sealed arch'
          : definition.actionLabel,
      actionKind:
        definition.id === 'crystal-grotto' && !this.story.isGrottoOpen()
          ? 'interact'
          : definition.actionKind,
      position: definition.position,
      interactionRadius: definition.radius,
      priority: definition.actionKind === 'talk' ? 30 : definition.actionKind === 'enter' ? 20 : 12,
      visible: () => container.active,
      result: { type: 'callback', activate: () => this.activate(state, definition) },
    }));
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private activate(state: BrookDepthState, definition: BrookInteractionDefinition): void {
    switch (definition.id) {
      case 'crystalarium-nursery':
        void launchMiniGame(state.scene, {
          gameId: 'crystalarium',
          variantId: 'resonance-patterns',
          source: 'world',
          worldContext: {
            locationId: 'crystal-brook',
            interactionId: 'crystalarium-nursery',
          },
        }).catch(() => {
          this.showFeedback(state, 'The crystal nursery is quiet for now. Try again.');
        });
        return;
      case 'crystal-grotto':
        if (this.story.isGrottoOpen()) {
          state.scene.scene.start('CrystalGrottoScene');
        } else if (this.story.isOpeningMelodyReady()) {
          void launchMiniGame(state.scene, {
            gameId: 'crystalarium',
            variantId: 'opening-melody',
            source: 'world',
            worldContext: {
              locationId: 'crystal-brook',
              interactionId: 'crystal-grotto',
              questContext: ECHO_CRYSTAL_SONG_QUEST_ID,
            },
          }).catch(() => {
            this.showFeedback(state, 'The crystals went quiet for a moment. Try again.');
          });
        } else {
          this.showFeedback(
            state,
            'The Grotto doorway is sealed by three sleeping crystal notes. Talk to Echo to learn the opening melody.',
          );
        }
        return;
      case 'waterfall-mist':
        this.activateWaterfall(state);
        return;
      case 'reflection-pool':
        this.activateReflectionPool(state);
        return;
      case 'shallow-ripple':
        state.scene.cameras.main.flash(70, 196, 241, 246, false);
        this.showFeedback(
          state,
          'Splish! The shallow water runs around your hooves and sends bright rings downstream. 💧',
        );
        return;
      case 'singing-crystals':
        state.scene.cameras.main.flash(75, 211, 248, 255, false);
        this.showFeedback(
          state,
          'Ping… pong… ting! Three river crystals answer one another, but the deeper Grotto sounds are richer still. 🔷',
        );
        return;
      case 'shell-sparkle':
        this.showFeedback(
          state,
          'A shell flashes under a smooth stone, then the water rolls it gently back into place. Not every shiny thing needs collecting. 🐚',
        );
        return;
      case 'pebble-stack':
        state.scene.cameras.main.shake(90, 0.0015);
        this.showFeedback(
          state,
          'One, two, three… wobble… four! The tiny pebble tower stays up. For now. 🪨',
        );
        return;
    }
  }

  private activateWaterfall(state: BrookDepthState): void {
    const specialLight = ['sunset', 'night'].includes(this.time.getState());
    const specialWeather = this.weather.getState() !== 'clear';
    if (!specialLight && !specialWeather) {
      this.showFeedback(
        state,
        'Cool mist drifts over the bank. Tiny drops glitter everywhere, as if they are waiting for different light.',
      );
      return;
    }
    const fresh = this.story.discoverWaterfallRainbow();
    this.showFeedback(
      state,
      fresh
        ? 'The mist catches the changed light and a tiny rainbow hangs above the bank without touching the ground. 🌈✨'
        : 'The little mist rainbow appears again, brighter at the edges and gone in a blink.',
    );
    state.scene.cameras.main.flash(100, 225, 248, 255, false);
  }

  private activateReflectionPool(state: BrookDepthState): void {
    const specialLight = ['sunset', 'night'].includes(this.time.getState());
    if (!specialLight) {
      this.showFeedback(
        state,
        'The pool is almost perfectly still. It reflects reeds, crystals and a patch of sky with suspicious neatness.',
      );
      return;
    }
    const fresh = this.story.discoverReflectionPool();
    this.showFeedback(
      state,
      fresh
        ? 'Tiny bright points appear in the still water. There are more reflected stars than there are stars overhead. ✨💧'
        : 'The extra reflected stars are still there, quietly refusing to explain themselves.',
    );
  }

  private syncPersistent(state: BrookDepthState, force = false): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const signature = [
      getGrottoGateAccess(save).unlocked ? 'open' : '',
      this.story.isOpeningMelodyReady() ? 'ready' : '',
      save.world.flags[ECHO_CRYSTAL_SONG_COMPLETE_FLAG] === true ? 'song' : '',
      Math.min(5, Math.floor((save.activities.crystalarium?.completed ?? 0) / 10)),
    ].join('|');
    if (!force && signature === state.signature) {
      return;
    }

    state.signature = signature;
    state.persistent?.destroy(true);
    const objects: Phaser.GameObjects.GameObject[] = [];
    this.addGrottoEntrance(state.scene, objects, this.story.isGrottoOpen());
    this.addNurseryRestoration(state.scene, objects, save.activities.crystalarium?.completed ?? 0);
    this.publishTargets(state);
    state.persistent = state.scene.add
      .container(0, 0, objects)
      .setName('brook-depth:persistent-state')
      .setDepth(12);
  }

  private addGrottoEntrance(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    open: boolean,
  ): void {
    const grotto = CRYSTAL_BROOK_GROTTO_THRESHOLD.position;
    // The permanent rock arch and portal are now painted once by CrystalBrookScene.
    // This manager owns only the unlock-state glimmer, not duplicate cave geometry.
    const marker = scene.add
      .graphics()
      .setPosition(grotto.x, grotto.y)
      .setName('brook-depth:crystal-grotto-entrance');
    marker.fillStyle(open ? 0xd5faff : 0xc7a7e5, open ? 0.78 : 0.36);
    marker.fillCircle(0, -151, open ? 9 : 5);
    marker.lineStyle(2, 0xf1e3ff, open ? 0.8 : 0.35);
    marker.strokeCircle(0, -151, open ? 17 : 12);
    objects.push(marker);
    if (!open) {
      const seal = scene.add
        .graphics()
        .setPosition(grotto.x, grotto.y)
        .setName('brook-depth:grotto-sealed-resonance');
      seal.fillStyle(0x9d7cc9, 0.42);
      seal.fillEllipse(0, -65, 122, 126);
      seal.lineStyle(3, 0xe0c5ff, 0.92);
      seal.strokeEllipse(0, -65, 122, 126);
      for (const [index, colour] of [0x568acc, 0x66d5ba, 0xb99aeb].entries()) {
        seal.fillStyle(colour, 0.9);
        seal.fillCircle((index - 1) * 34, -67, 11);
        seal.lineStyle(2, 0xffffff, 0.75);
        seal.strokeCircle((index - 1) * 34, -67, 11);
      }
      objects.push(seal);
    }
    if (open) {
      objects.push(
        scene.add
          .text(grotto.x, grotto.y - 50, '✦  💎  ✦', {
            color: '#d6fbff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '26px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
    }
  }

  private addNurseryRestoration(
    scene: Phaser.Scene,
    objects: Phaser.GameObjects.GameObject[],
    patternsCompleted: number,
  ): void {
    const { x, y } = CRYSTAL_BROOK_CRYSTALARIUM_NURSERY;
    const chapters = Math.min(5, Math.floor(patternsCompleted / 10));
    const garden = scene.add.graphics().setName('brook-depth:crystalarium-garden');
    garden.fillStyle(0x375c7e, 0.42);
    garden.fillEllipse(x, y - 6, 140, 54);
    const colours = [0x568acc, 0x66d5ba, 0xb99aeb, 0xffdba4, 0xd8fff5];
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI + (Math.PI * i) / 4;
      const px = x + Math.cos(angle) * 52;
      const py = y + Math.sin(angle) * 32 - 17;
      const grown = i < chapters;
      garden.fillStyle(colours[i], grown ? 0.9 : 0.3);
      garden.fillTriangle(px, py - (grown ? 45 : 18), px - 13, py + 9, px + 13, py + 9);
      garden.lineStyle(2, grown ? 0xf0f9ff : 0x89a9c4, grown ? 0.85 : 0.3);
      garden.strokeTriangle(px, py - (grown ? 45 : 18), px - 13, py + 9, px + 13, py + 9);
    }
    objects.push(garden);
    if (chapters > 0) {
      objects.push(
        scene.add.text(x, y - 96, '✦ ' + chapters + ' / 5 restored ✦', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#e5faff',
          backgroundColor: '#294d70dd',
          padding: { x: 7, y: 3 },
        }).setOrigin(0.5).setName('brook-depth:crystalarium-restoration-label'),
      );
    }
  }

  private showFeedback(state: BrookDepthState, message: string): void {
    const serial = ((state.feedback.getData('feedback-serial') as number | undefined) ?? 0) + 1;
    state.feedback.setData('feedback-serial', serial).setText(message).setVisible(true);
    state.scene.time.delayedCall(3900, () => {
      if (state.feedback.active && state.feedback.getData('feedback-serial') === serial) {
        state.feedback.setVisible(false);
      }
    });
  }

  private destroyState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const runtime of this.state.interactions) {
      runtime.container.destroy(true);
    }
    this.state.persistent?.destroy(true);
    this.state.feedback.destroy();
    this.state = null;
  }
}

let browserCrystalBrookDepthWorldManager: CrystalBrookDepthWorldManager | null = null;

export function getCrystalBrookDepthWorldManager(game: Phaser.Game): CrystalBrookDepthWorldManager {
  browserCrystalBrookDepthWorldManager ??= new CrystalBrookDepthWorldManager(game);
  return browserCrystalBrookDepthWorldManager;
}

export function getCrystalBrookDepthQuestId(): string {
  return ECHO_CRYSTAL_SONG_QUEST_ID;
}
