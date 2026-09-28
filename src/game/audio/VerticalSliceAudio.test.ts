import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioSettingsStore } from './AudioSettings';
import { VerticalSliceAudio } from './VerticalSliceAudio';

class FakeVisibilityDocument {
  public hidden = false;
  private listener: (() => void) | null = null;

  public addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type !== 'visibilitychange') {
      return;
    }
    this.listener =
      typeof listener === 'function'
        ? () => listener({ type: 'visibilitychange' } as Event)
        : () => listener.handleEvent({ type: 'visibilitychange' } as Event);
  }

  public setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.listener?.();
  }
}

class FakeAudioElement {
  public static instances: FakeAudioElement[] = [];

  public loop = false;
  public volume = 1;
  public currentTime = 0;
  public paused = true;
  public playCount = 0;
  public pauseCount = 0;

  public constructor(public readonly src: string) {
    FakeAudioElement.instances.push(this);
  }

  public play(): Promise<void> {
    this.paused = false;
    this.playCount += 1;
    return Promise.resolve();
  }

  public pause(): void {
    this.paused = true;
    this.pauseCount += 1;
  }
}

describe('VerticalSliceAudio visibility continuity', () => {
  afterEach(() => {
    FakeAudioElement.instances = [];
    vi.unstubAllGlobals();
  });

  it('resumes the same music element at the existing playback position after tab visibility returns', async () => {
    const document = new FakeVisibilityDocument();
    vi.stubGlobal('document', document);
    vi.stubGlobal('Audio', FakeAudioElement);

    const audio = new VerticalSliceAudio(new AudioSettingsStore(null));
    audio.enterScene('MoonflowerGladeScene');
    await Promise.resolve();

    expect(FakeAudioElement.instances).toHaveLength(1);
    const track = FakeAudioElement.instances[0];
    expect(track).toBeDefined();
    if (!track) {
      throw new Error('Expected the Glade music element to exist.');
    }

    track.currentTime = 41.25;
    document.setHidden(true);

    expect(track.paused).toBe(true);
    expect(track.pauseCount).toBe(1);
    expect(track.currentTime).toBe(41.25);

    document.setHidden(false);
    await Promise.resolve();

    expect(FakeAudioElement.instances).toHaveLength(1);
    expect(track.paused).toBe(false);
    expect(track.playCount).toBe(2);
    expect(track.currentTime).toBe(41.25);
  });
});
