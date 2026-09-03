import Phaser from 'phaser';
import { ensureStarlightBeachScene } from '../scenes/StarlightBeachSceneRegistration';
import { getBrowserSaveService } from './browserSaveService';
import {
  resolveContinueDestination,
  STARLIGHT_BEACH_CONTINUE_LOCATION_ID,
} from './ContinueLocation';

interface MutableTitleScene extends Phaser.Scene {
  continueScene: string;
  starting: boolean;
  resetArmed: boolean;
  statusText: Phaser.GameObjects.Text | null;
}

const TITLE_SCENE_KEY = 'TitleScene';

function asMutableTitleScene(scene: Phaser.Scene): MutableTitleScene {
  return scene as unknown as MutableTitleScene;
}

export class ContinueRestoreManager {
  private beachRegistration: Promise<void> | null = null;
  private lastTitleScene: Phaser.Scene | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.prepareLazyDestination();
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private prepareLazyDestination(): void {
    const locationId = getBrowserSaveService().load()?.profile.currentLocationId;
    if (locationId !== STARLIGHT_BEACH_CONTINUE_LOCATION_ID) {
      return;
    }
    this.ensureBeachRegistered();
  }

  private ensureBeachRegistered(): Promise<void> {
    this.beachRegistration ??= ensureStarlightBeachScene(this.game);
    return this.beachRegistration;
  }

  private update(): void {
    const scene = this.game.scene.getScene(TITLE_SCENE_KEY);
    if (!scene?.scene.isActive()) {
      this.lastTitleScene = null;
      return;
    }

    const title = asMutableTitleScene(scene);
    const locationId = getBrowserSaveService().load()?.profile.currentLocationId;
    const destination = resolveContinueDestination(locationId);

    if (destination.lazyScene && !this.game.scene.keys[destination.sceneKey]) {
      if (!title.starting) {
        title.starting = true;
        title.statusText?.setText('Opening your saved place…');
      }
      void this.ensureBeachRegistered().then(() => {
        if (!scene.scene.isActive()) {
          return;
        }
        title.continueScene = destination.sceneKey;
        title.starting = false;
        if (!title.resetArmed) {
          title.statusText?.setText(destination.status);
        }
      });
      this.lastTitleScene = scene;
      return;
    }

    title.continueScene = destination.sceneKey;
    if ((!title.starting && !title.resetArmed) || this.lastTitleScene !== scene) {
      title.statusText?.setText(destination.status);
    }
    this.lastTitleScene = scene;
  }
}

let manager: ContinueRestoreManager | null = null;

export function getContinueRestoreManager(game: Phaser.Game): ContinueRestoreManager {
  manager ??= new ContinueRestoreManager(game);
  return manager;
}
