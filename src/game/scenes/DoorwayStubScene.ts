import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConstants';
import { defineSceneContract } from './SceneCompositionContract';
import { SceneInputRuntime } from './SceneInputRuntime';
import { bindSceneLifecycle, type SceneLifecycleScope } from './SceneLifecycleScope';

interface DoorwayStubData {
  title?: string;
  message?: string;
  returnScene?: string;
}

export const DOORWAY_STUB_SCENE_CONTRACT = defineSceneContract({
  key: 'DoorwayStubScene',
  category: 'utility',
  loadBoundary: 'startup',
  audioContext: 'inherit',
  persistence: 'return-payload',
  spawnReturn: 'return-payload',
  shell: 'none',
  interaction: 'scene-owned',
  responsive: 'canvas-fit',
  teardown: 'scene-lifecycle-scope',
  testTags: ['navigation', 'input', 'scene-lifecycle'],
});

export class DoorwayStubScene extends Phaser.Scene {
  private lifecycle: SceneLifecycleScope | null = null;
  private sceneInput: SceneInputRuntime | null = null;
  private returnScene = 'MoonflowerGladeScene';

  public constructor() {
    super(DOORWAY_STUB_SCENE_CONTRACT.key);
  }

  public create(data: DoorwayStubData): void {
    this.lifecycle?.close();
    const lifecycle = bindSceneLifecycle(this.events);
    this.lifecycle = lifecycle;
    lifecycle.own(() => {
      this.sceneInput = null;
      this.lifecycle = null;
    });

    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.cameras.main.setBackgroundColor('#5f4778');

    this.add.circle(230, 180, 190, 0xffddf3, 0.12);
    this.add.circle(1080, 560, 240, 0xffefae, 0.08);

    this.add
      .text(GAME_WIDTH / 2, 205, data.title ?? 'A Doorway', {
        color: '#fff8ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        330,
        data.message ?? 'This doorway is connected, but the room behind it is still being made.',
        {
          color: '#f4ecfb',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '25px',
          align: 'center',
          wordWrap: { width: 760 },
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const button = this.add
      .rectangle(GAME_WIDTH / 2, 520, 320, 80, 0xfff9ed, 0.98)
      .setStrokeStyle(5, 0xe2b9ed, 1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, 520, 'Back outside', {
        color: '#513a64',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.sceneInput = new SceneInputRuntime(this, lifecycle);
    this.sceneInput.bindActionTarget(button, 'INTERACT');
  }

  public update(): void {
    this.sceneInput?.update();

    if (this.sceneInput?.justPressed('INTERACT') || this.sceneInput?.justPressed('BACK')) {
      this.scene.start(this.returnScene);
    }
  }
}
