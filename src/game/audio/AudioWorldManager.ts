import Phaser from 'phaser';
import { resolveInteractionSfxCue, resolveMusicContext } from '../../content/audioBindings';
import { gameEventBus } from '../events/GameEventBus';
import { getVerticalSliceAudio, type VerticalSliceSfx } from './VerticalSliceAudio';

const RATE_LIMIT_MS: Partial<Record<VerticalSliceSfx, number>> = {
  'ui-back': 100,
  dialogue: 180,
  discovery: 400,
  'quest-complete': 800,
  friendship: 350,
  door: 250,
  decoration: 160,
  'race-go': 300,
  'race-finish': 800,
};

export class AudioWorldManager {
  private readonly audio = getVerticalSliceAudio();
  private readonly attachedScenes = new WeakSet<Phaser.Scene>();
  private readonly lastPlayedAt = new Map<VerticalSliceSfx, number>();
  private lastMusicSceneKey: string | null = null;

  public constructor(private readonly game: Phaser.Game) {
    gameEventBus.on('CHARACTER_TALKED', () => this.playCue('dialogue'));
    gameEventBus.on('ITEM_COLLECTED', () => this.playCue('collect'));
    gameEventBus.on('DISCOVERY_UNLOCKED', () => this.playCue('discovery'));
    gameEventBus.on('QUEST_COMPLETED', () => this.playCue('quest-complete'));
    gameEventBus.on('RELATIONSHIP_CHANGED', () => this.playCue('friendship'));
    gameEventBus.on('HOME_DECORATION_CHANGED', () => this.playCue('decoration'));
    gameEventBus.on('INTERACTION_ACTIVATED', (event) => {
      const override = resolveInteractionSfxCue(event.interactionId);
      if (override) {
        this.playCue(override);
      } else if (event.actionKind === 'talk' || event.resultType === 'dialogue') {
        this.playCue('dialogue');
      } else if (event.actionKind === 'enter') {
        this.playCue('door');
      }
    });
    globalThis.addEventListener?.('pointerdown', this.unlockAudio);
    globalThis.addEventListener?.('keydown', this.unlockAudio);
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private readonly unlockAudio = (): void => {
    void this.audio.unlock();
  };

  private update(): void {
    const scenes = this.game.scene.getScenes(true);
    for (const scene of scenes) {
      if (!this.attachedScenes.has(scene)) {
        scene.input.on('gameobjectdown', this.onGameObjectDown, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.attachedScenes.delete(scene));
        this.attachedScenes.add(scene);
      }
    }
    for (let index = scenes.length - 1; index >= 0; index -= 1) {
      if (resolveMusicContext(scenes[index].scene.key)) {
        this.lastMusicSceneKey = scenes[index].scene.key;
        break;
      }
    }
    if (this.lastMusicSceneKey) {
      this.audio.enterScene(this.lastMusicSceneKey);
    }
  }

  private onGameObjectDown(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
  ): void {
    if (
      gameObject.name === 'exploration-interaction-prompt' ||
      gameObject.name === 'exploration-direct-interaction-target' ||
      gameObject.name.startsWith('interaction-direct-zone:')
    ) {
      return;
    }
    const label =
      gameObject instanceof Phaser.GameObjects.Text ? gameObject.text.trim() : gameObject.name.trim();
    this.playCue(/^(?:←|back\b|cancel\b|close\b)/i.test(label) ? 'ui-back' : 'ui');
  }

  private playCue(cue: VerticalSliceSfx): void {
    const now = Date.now();
    const last = this.lastPlayedAt.get(cue) ?? Number.NEGATIVE_INFINITY;
    if (now - last < (RATE_LIMIT_MS[cue] ?? 90)) {
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
