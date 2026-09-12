import type Phaser from 'phaser';
import { resolveInteractionSfxCue, resolveMusicContext } from '../../content/audioBindings';
import { gameEventBus } from '../events/GameEventBus';
import { getVerticalSliceAudio, type VerticalSliceSfx } from './VerticalSliceAudio';

const RATE_LIMIT_MS: Partial<Record<VerticalSliceSfx, number>> = {
  dialogue: 180,
  discovery: 400,
  'quest-complete': 800,
  friendship: 350,
  door: 250,
  decoration: 160,
  'race-finish': 800,
};

export class AudioWorldManager {
  private readonly audio = getVerticalSliceAudio();
  private readonly attachedScenes = new WeakSet<Phaser.Scene>();
  private lastCue: VerticalSliceSfx | null = null;
  private lastCueAt = 0;

  public constructor(private readonly game: Phaser.Game) {
    gameEventBus.on('CHARACTER_TALKED', () => this.play('dialogue'));
    gameEventBus.on('ITEM_COLLECTED', () => this.play('collect'));
    gameEventBus.on('DISCOVERY_UNLOCKED', () => this.play('discovery'));
    gameEventBus.on('QUEST_COMPLETED', () => this.play('quest-complete'));
    gameEventBus.on('RELATIONSHIP_CHANGED', () => this.play('friendship'));
    gameEventBus.on('HOME_DECORATION_CHANGED', () => this.play('decoration'));
    gameEventBus.on('INTERACTION_ACTIVATED', (event) => {
      const cue = resolveInteractionSfxCue(event.interactionId);
      if (cue) {
        this.play(cue);
      } else if (event.actionKind === 'talk' || event.resultType === 'dialogue') {
        this.play('dialogue');
      } else if (event.actionKind === 'enter') {
        this.play('door');
      }
    });
    globalThis.addEventListener?.('pointerdown', this.unlock);
    globalThis.addEventListener?.('keydown', this.unlock);
    game.events.on('poststep', this.update, this);
  }

  private readonly unlock = (): void => {
    void this.audio.unlock();
  };

  private update(): void {
    const scenes = this.game.scene.getScenes(true);
    for (const scene of scenes) {
      if (!this.attachedScenes.has(scene)) {
        scene.input.on('gameobjectdown', this.onGameObjectDown, this);
        scene.events.once('shutdown', () => this.attachedScenes.delete(scene));
        this.attachedScenes.add(scene);
      }
    }
    for (let index = scenes.length - 1; index >= 0; index -= 1) {
      const key = scenes[index].scene.key;
      if (resolveMusicContext(key)) {
        this.audio.enterScene(key);
        break;
      }
    }
  }

  private onGameObjectDown(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
  ): void {
    if (
      gameObject.name === 'exploration-interaction-prompt' ||
      gameObject.name === 'exploration-direct-interaction-target' ||
      gameObject.name === 'race-jump-control' ||
      gameObject.name.startsWith('interaction-direct-zone:')
    ) {
      return;
    }
    const text = (gameObject as Phaser.GameObjects.GameObject & { text?: unknown }).text;
    const label = typeof text === 'string' ? text.trim() : gameObject.name.trim();
    this.play(/^(?:←|back\b|cancel\b|close\b)/i.test(label) ? 'ui-back' : 'ui');
  }

  private play(cue: VerticalSliceSfx): void {
    const now = Date.now();
    if (cue === this.lastCue && now - this.lastCueAt < (RATE_LIMIT_MS[cue] ?? 90)) {
      return;
    }
    this.lastCue = cue;
    this.lastCueAt = now;
    this.audio.playSfx(cue);
  }
}

let manager: AudioWorldManager | null = null;

export function getAudioWorldManager(game: Phaser.Game): AudioWorldManager {
  manager ??= new AudioWorldManager(game);
  return manager;
}
