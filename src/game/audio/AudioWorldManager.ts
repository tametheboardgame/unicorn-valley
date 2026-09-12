import type Phaser from 'phaser';
import { resolveInteractionSfxCue, resolveMusicContext } from '../../content/audioBindings';
import { gameEventBus } from '../events/GameEventBus';
import { getVerticalSliceAudio, type VerticalSliceSfx } from './VerticalSliceAudio';

const EVENT_CUES = [
  ['CHARACTER_TALKED', 'dialogue'],
  ['ITEM_COLLECTED', 'collect'],
  ['DISCOVERY_UNLOCKED', 'discovery'],
  ['QUEST_COMPLETED', 'quest-complete'],
  ['RELATIONSHIP_CHANGED', 'friendship'],
  ['HOME_DECORATION_CHANGED', 'decoration'],
] as const;

class AudioWorldManager {
  private readonly audio = getVerticalSliceAudio();
  private readonly attachedScenes = new WeakSet<Phaser.Scene>();
  private lastCue: VerticalSliceSfx | null = null;
  private lastCueAt = 0;

  public constructor(private readonly game: Phaser.Game) {
    for (const [event, cue] of EVENT_CUES) {
      gameEventBus.on(event, () => this.play(cue));
    }
    gameEventBus.on('INTERACTION_ACTIVATED', (event) => {
      const cue =
        resolveInteractionSfxCue(event.interactionId) ??
        (event.actionKind === 'talk' || event.resultType === 'dialogue'
          ? 'dialogue'
          : event.actionKind === 'enter'
            ? 'door'
            : null);
      if (cue) {
        this.play(cue);
      }
    });
    const unlock = () => queueMicrotask(() => void this.audio.unlock());
    globalThis.addEventListener?.('pointerdown', unlock, { once: true });
    globalThis.addEventListener?.('keydown', unlock, { once: true });
    game.events.on('poststep', this.update, this);
  }

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
        return;
      }
    }
  }

  private onGameObjectDown(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject,
  ): void {
    const name = gameObject.name;
    if (name.includes('interaction') || name === 'race-jump-control') {
      return;
    }
    const text = (gameObject as Phaser.GameObjects.GameObject & { text?: unknown }).text;
    const label = typeof text === 'string' ? text : name;
    this.play(/(?:←|back|cancel|close)/i.test(label) ? 'ui-back' : 'ui');
  }

  private play(cue: VerticalSliceSfx): void {
    const now = Date.now();
    if (cue === this.lastCue && now - this.lastCueAt < 120) {
      return;
    }
    this.lastCue = cue;
    this.lastCueAt = now;
    this.audio.playSfx(cue);
  }
}

let manager: AudioWorldManager | undefined;

export function getAudioWorldManager(game: Phaser.Game): AudioWorldManager {
  if (!manager) {
    manager = new AudioWorldManager(game);
  }
  return manager;
}
