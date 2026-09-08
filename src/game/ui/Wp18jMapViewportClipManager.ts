import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { RefreshThrottle } from '../performance/RefreshThrottle';

const MAP_CAMERA_NAME = 'wp18j-map-content-camera';
const MAP_OVERLAY_CAMERA_NAME = 'wp18j-map-overlay-camera';

// Phaser 4 GeometryMask is Canvas-only. The game normally runs in WebGL, so the earlier geometry
// mask could not reliably clip the draggable map. A dedicated camera viewport gives us a renderer-
// independent hard clip. It is inset slightly from the rounded parchment opening so moving content
// always disappears beneath the frame rather than leaking through the rounded corners.
const MAP_CLIP_VIEWPORT = { x: 132, y: 156, width: 1016, height: 406 } as const;

function byName<T extends Phaser.GameObjects.GameObject>(
  scene: Phaser.Scene,
  name: string,
): T | null {
  return (scene.children.list.find((object) => object.name === name) as T | undefined) ?? null;
}

function installMapCameraClip(scene: Phaser.Scene): void {
  if (scene.scene.key !== 'InventoryScene' || scene.cameras.getCamera(MAP_CAMERA_NAME)) {
    return;
  }

  const mapContent = byName<Phaser.GameObjects.Container>(scene, 'bag-map-content');
  const panZone = byName<Phaser.GameObjects.Zone>(scene, 'wp18j-map-pan-zone');
  const frame = byName<Phaser.GameObjects.Graphics>(scene, 'wp18j-map-pan-frame');
  const compass = byName<Phaser.GameObjects.Arc>(scene, 'wp18j-map-compass');
  const compassLabel = byName<Phaser.GameObjects.Text>(scene, 'wp18j-map-compass-label');
  const panHint = byName<Phaser.GameObjects.Text>(scene, 'wp18j-map-pan-hint');

  // Wait until the existing WP18J map presentation has finished constructing the draggable layer
  // and its fixed overlays. This manager can load before or after the polish manager without racing.
  if (!mapContent || !panZone || !frame || !compass || !compassLabel || !panHint) {
    return;
  }

  // The previous GeometryMask cannot clip WebGL in Phaser 4. Remove it before assigning the map
  // content exclusively to the camera viewport below.
  mapContent.clearMask();

  const clipGuard = scene.add
    .zone(
      MAP_CLIP_VIEWPORT.x + MAP_CLIP_VIEWPORT.width / 2,
      MAP_CLIP_VIEWPORT.y + MAP_CLIP_VIEWPORT.height / 2,
      MAP_CLIP_VIEWPORT.width,
      MAP_CLIP_VIEWPORT.height,
    )
    .setName('wp18j-map-camera-clip-guard');

  const mapCamera = scene.cameras
    .add(
      MAP_CLIP_VIEWPORT.x,
      MAP_CLIP_VIEWPORT.y,
      MAP_CLIP_VIEWPORT.width,
      MAP_CLIP_VIEWPORT.height,
      false,
      MAP_CAMERA_NAME,
    )
    .setScroll(MAP_CLIP_VIEWPORT.x, MAP_CLIP_VIEWPORT.y)
    .setRoundPixels(true);

  // The main camera owns the modal shell, parchment, footer and controls. The clipped camera owns
  // only the moving geography container, preventing any node/route/label from drawing outside the
  // inner parchment window regardless of how far the player drags it.
  scene.cameras.main.ignore(mapContent);
  mapCamera.ignore(scene.children.list.filter((object) => object !== mapContent));

  const overlayObjects: Phaser.GameObjects.GameObject[] = [frame, compass, compassLabel, panHint];
  scene.cameras.main.ignore(overlayObjects);

  const overlayCamera = scene.cameras
    .add(0, 0, GAME_WIDTH, GAME_HEIGHT, false, MAP_OVERLAY_CAMERA_NAME)
    .setScroll(0, 0)
    .setRoundPixels(true);
  overlayCamera.ignore(
    scene.children.list.filter((object) => !overlayObjects.includes(object)),
  );

  // Keep the non-rendering diagnostic marker out of all visual cameras.
  scene.cameras.main.ignore(clipGuard);
  mapCamera.ignore(clipGuard);
  overlayCamera.ignore(clipGuard);
}

export class Wp18jMapViewportClipManager {
  private readonly throttle = new RefreshThrottle(80);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.sync, this);
  }

  private readonly sync = (): void => {
    if (!this.throttle.shouldRun(this.game.loop.time)) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      installMapCameraClip(scene);
    }
  };
}

let manager: Wp18jMapViewportClipManager | null = null;

export function getWp18jMapViewportClipManager(game: Phaser.Game): Wp18jMapViewportClipManager {
  manager ??= new Wp18jMapViewportClipManager(game);
  return manager;
}
