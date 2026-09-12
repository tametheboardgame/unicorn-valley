import Phaser from 'phaser';
import { resolveInteractionSfxCue, resolveMusicContext } from '../../content/audioBindings';
import { gameEventBus } from '../events/GameEventBus';
import { getVerticalSliceAudio, type VerticalSliceSfx } from './VerticalSliceAudio';

interface SceneInputState {
  scene: Phaser.Scene;
  onGameObjectDown: (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => void;
}

const RATE_LIMIT_MS: Readonly<Record<VerticalSliceSfx, number>> = {
  ui: 70,
  'ui-back': 100,
  dialogue: 180,
  collect: 90,
  discovery: 400,
  'quest-complete': 800,
  friendship: 350,
  door: 250,
  decoration: 160,
  'race-countdown': 100,
  'race-go': 300,
  'race-jump': 90,
  'race-boost': 120,
  'race-impact': 120,
  'race-finish': 800,
};

const WORLD_INTERACTION_OBJECT_NAMES = new Set([
  'exploration-interaction-prompt',
  'exploration-direct-interaction-target',
]);

function shouldIgnoreUiObject(gameObject: Phaser.GameObjects.GameObject): boolean {
  return (
    WORLD_INTERACTION_OBJECT_NAMES.has(gameObject.name) ||
    gameObject.name.startsWith('interaction-direct-zone:')
  );
}

function getUiObjectLabel(gameObject: Phaser.GameObjects.GameObject): string {
  if (gameObject instanceof Phaser.GameObjects.Text) {
    return gameObject.text;
  }
  return gameObject.name;
}

function resolveUiCue(gameObject: Phaser.GameObjects.GameObject): VerticalSliceSfx {
  const label = getUiObjectLabel(gameObject).trim();
  return /^(?:←|back\b|cancel\b|close\b)/i.test(label) ? 'ui-back' : 'ui';
}

/**
 * Owns the integration between game semantics and the audio playback engine.
 *
 * Music follows the last active scene with an explicit audio context. Scenes such as Settings,
 * Inventory and Wonderbook intentionally have no context, so opening them does not restart or
 * replace the music that was already playing underneath the player's current area.
 */
export class AudioWorldManager {
  private readonly audio = getVerticalSliceAudio();
  private readonly sceneInputs = new Map<string, SceneInputState>();
  private readonly lastPlayedAt = new Map<VerticalSliceSfx, number>();
  private readonly unsubscribeEvents: Array<() => void> = [];
  private lastMusicSceneKey: string | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.unsubscribeEvents.push(
      gameEventBus.on('CHARACTER_TALKED', () => this.playCue('dialogue')),
      gameEventBus.on('ITEM_COLLECTED', () => this.playCue('collect')),
      gameEventBus.on('DISCOVERY_UNLOCKED', () => this.playCue('discovery')),
      gameEventBus.on('QUEST_COMPLETED', () => this.playCue('quest-complete')),
      gameEventBus.on('RELATIONSHIP_CHANGED', () => this.playCue('friendship')),
      gameEventBus.on('HOME_DECORATION_CHANGED', () => this.playCue('decoration')),
      gameEventBus.on('INTERACTION_ACTIVATED', (event) => {
        const boundCue = resolveInteractionSfxCue(event.interactionId);
        if (boundCue) {
          this.playCue(boundCue);
          return;
        }
        if (event.actionKind === 'talk' || event.resultType === 'dialogue') {
          this.playCue('dialogue');
        } else if (event.actionKind === 'enter') {
          this.playCue('door');
        }
      }),
    );

    globalThis.addEventListener?.('pointerdown', this.unlockAudio);
    globalThis.addEventListener?.('keydown', this.unlockAudio);
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, this.destroy, this);
  }

  private readonly unlockAudio = (): void => {
    void this.audio.unlock();
  };

  private readonly destroy = (): void => {
    globalThis.removeEventListener?.('pointerdown', this.unlockAudio);
    globalThis.removeEventListener?.('keydown', this.unlockAudio);
    this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    for (const unsubscribe of this.unsubscribeEvents.splice(0)) {
      unsubscribe();
    }
    for (const state of this.sceneInputs.values()) {
      this.detachSceneInput(state);
    }
    this.sceneInputs.clear();
    if (this.lastMusicSceneKey) {
      this.audio.leaveScene(this.lastMusicSceneKey);
    }
    this.lastMusicSceneKey = null;
  };

  private update(): void {
    const activeScenes = this.game.scene.getScenes(true);
    const activeKeys = new Set(activeScenes.map((scene) => scene.scene.key));

    for (const scene of activeScenes) {
      this.ensureSceneInput(scene);
    }
    for (const [sceneKey, state] of this.sceneInputs) {
      if (!activeKeys.has(sceneKey) || state.scene !== this.game.scene.getScene(sceneKey)) {
        this.detachSceneInput(state);
        this.sceneInputs.delete(sceneKey);
      }
    }

    const contextualScene = [...activeScenes]
      .reverse()
      .find((scene) => resolveMusicContext(scene.scene.key) !== null);
    if (contextualScene) {
      this.lastMusicSceneKey = contextualScene.scene.key;
    }

    // Reassert the remembered context each frame. enterScene is idempotent when unchanged, but
    // this also restores music after a legacy scene calls leaveScene while a context-free modal
    // takes over, preventing Settings/Bag/Map/Book transitions from creating silent gaps.
    if (this.lastMusicSceneKey) {
      this.audio.enterScene(this.lastMusicSceneKey);
    }
  }

  private ensureSceneInput(scene: Phaser.Scene): void {
    const existing = this.sceneInputs.get(scene.scene.key);
    if (existing?.scene === scene) {
      return;
    }
    if (existing) {
      this.detachSceneInput(existing);
    }

    const onGameObjectDown = (
      _pointer: Phaser.Input.Pointer,
      gameObject: Phaser.GameObjects.GameObject,
    ): void => {
      if (shouldIgnoreUiObject(gameObject)) {
        return;
      }
      this.playCue(resolveUiCue(gameObject));
    };
    scene.input.on('gameobjectdown', onGameObjectDown);
    this.sceneInputs.set(scene.scene.key, { scene, onGameObjectDown });
  }

  private detachSceneInput(state: SceneInputState): void {
    state.scene.input.off('gameobjectdown', state.onGameObjectDown);
  }

  private playCue(cue: VerticalSliceSfx): void {
    const now = Date.now();
    const lastPlayed = this.lastPlayedAt.get(cue) ?? Number.NEGATIVE_INFINITY;
    if (now - lastPlayed < RATE_LIMIT_MS[cue]) {
      return;
    }
    this.lastPlayedAt.set(cue, now);
    this.audio.playSfx(cue);
  }
}

let browserAudioWorldManager: AudioWorldManager | null = null;

export function getAudioWorldManager(game: Phaser.Game): AudioWorldManager {
  browserAudioWorldManager ??= new AudioWorldManager(game);
  return browserAudioWorldManager;
}
