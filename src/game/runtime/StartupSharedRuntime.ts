import type Phaser from 'phaser';
import type {
  CharacterId,
  DiscoveryId,
  FriendshipTier,
  ItemCategory,
  ItemDefinition,
  ItemId,
} from '../../content/contentTypes';
import { characterRegistry, itemRegistry } from '../../content/registries';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { InputAdapter } from '../input/InputAdapter';
import type { AxisInputAction, ButtonInputAction } from '../input/InputAction';
import type { InteractionCondition, InteractionTarget } from '../interaction/InteractionTarget';
import type { SaveService } from '../save/SaveService';
import type { RelationshipProgress, SaveGame } from '../save/saveSchema';
import { cssColourToPhaser, UI_DESIGN_TOKENS } from '../ui/UiDesignSystem';
import type { MapPoint } from '../world/MapTraversal';

// scene keys
export const SCENE_KEYS = [
  'BootScene',
  'PreloadScene',
  'TitleScene',
  'ResizeTestScene',
  'MovementTestScene',
  'MoonflowerGladeScene',
  'CottageInteriorScene',
  'CottageDecorateScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
  'FireflyLanternScene',
  'RainbowRunEntryScene',
  'CrystalCupEntryScene',
  'NovaTutorialRaceScene',
  'RaceScene',
  'PipEggHatchScene',
  'DoorwayStubScene',
  'DialogueTestScene',
  'UnicornCreatorScene',
  'JustGamesScene',
  'InventoryScene',
  'WonderbookScene',
  'ShopScene',
  'VillageInteriorScene',
  'HollowTreeNookScene',
  'WindmillLookoutScene',
  'CrystalGrottoScene',
  'FireflyGroveScene',
  'CottageStyleScene',
  'SettingsScene',
  'StarlightBeachScene',
  'MapleBakingActivityScene',
  'CoralBeachcombingActivityScene',
  'RainbowDiscActivityScene',
  'ChessPlazaActivityScene',
  'PondLeapActivityScene',
  'ExplorationHudOverlayScene',
] as const;

export type SceneKey = (typeof SCENE_KEYS)[number];

const SCENE_KEY_SET = new Set<string>(SCENE_KEYS);

export function isSceneKey(value: string): value is SceneKey {
  return SCENE_KEY_SET.has(value);
}

// world depth
const WORLD_DEPTH_BASE = 20;
const WORLD_DEPTH_Y_SCALE = 0.02;

export const WORLD_SORTABLE_DEPTH_FLOOR = 4;
export const WORLD_UI_DEPTH_FLOOR = 100;

export function worldDepthForY(y: number, offset = 0): number {
  return WORLD_DEPTH_BASE + Math.max(0, y) * WORLD_DEPTH_Y_SCALE + offset;
}

export function isWorldDepthSortable(currentDepth: number): boolean {
  return currentDepth >= WORLD_SORTABLE_DEPTH_FLOOR && currentDepth < WORLD_UI_DEPTH_FLOOR;
}

// exploration gallop
export const EXPLORATION_GALLOP_MULTIPLIER = 1.6;
export const EXPLORATION_SNACK_MULTIPLIER = 1.18;
export const EXPLORATION_SNACK_DURATION_MS = 45_000;

const GALLOP_CODES = new Set(['ShiftLeft', 'ShiftRight']);
const OUTDOOR_EXPLORATION_SCENES = new Set([
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
  'StarlightBeachScene',
]);

let keyboardGallopHeld = false;
let touchGallopHeld = false;
let trackingInstalled = false;
let snackBoostExpiresAt = 0;

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const element = target as {
    tagName?: string;
    isContentEditable?: boolean;
  } | null;
  const tagName = element?.tagName?.toUpperCase();
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    element?.isContentEditable === true
  );
}

export function ensureExplorationGallopTracking(): void {
  if (trackingInstalled || typeof globalThis.addEventListener !== 'function') {
    return;
  }

  globalThis.addEventListener('keydown', (event: KeyboardEvent) => {
    if (GALLOP_CODES.has(event.code) && !isEditableKeyboardTarget(event.target)) {
      keyboardGallopHeld = true;
    }
  });
  globalThis.addEventListener('keyup', (event: KeyboardEvent) => {
    if (GALLOP_CODES.has(event.code)) {
      keyboardGallopHeld = false;
    }
  });
  globalThis.addEventListener('blur', () => {
    keyboardGallopHeld = false;
    touchGallopHeld = false;
  });
  trackingInstalled = true;
}

export function setTouchGallopHeld(held: boolean): void {
  touchGallopHeld = held;
}

export function isExplorationGallopHeld(sceneKey: string): boolean {
  ensureExplorationGallopTracking();
  return OUTDOOR_EXPLORATION_SCENES.has(sceneKey) && (keyboardGallopHeld || touchGallopHeld);
}

export function activateExplorationSnackBoost(now = Date.now()): number {
  snackBoostExpiresAt = now + EXPLORATION_SNACK_DURATION_MS;
  return snackBoostExpiresAt;
}

export function clearExplorationSnackBoost(): void {
  snackBoostExpiresAt = 0;
}

export function getExplorationSnackBoostRemainingMs(now = Date.now()): number {
  return Math.max(0, snackBoostExpiresAt - now);
}

export function getExplorationSnackBoostRemainingSeconds(now = Date.now()): number {
  return Math.ceil(getExplorationSnackBoostRemainingMs(now) / 1000);
}

export function isExplorationSnackBoostActive(now = Date.now()): boolean {
  return getExplorationSnackBoostRemainingMs(now) > 0;
}

export function explorationSpeedMultiplier(
  sceneKey: string,
  gallopHeld: boolean,
  now = Date.now(),
): number {
  if (!OUTDOOR_EXPLORATION_SCENES.has(sceneKey)) {
    return 1;
  }
  if (gallopHeld) {
    return EXPLORATION_GALLOP_MULTIPLIER;
  }
  return isExplorationSnackBoostActive(now) ? EXPLORATION_SNACK_MULTIPLIER : 1;
}

// pointer input
function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export class PointerTouchInputAdapter implements InputAdapter {
  private readonly axes = new Map<AxisInputAction, number>();
  private readonly down = new Set<ButtonInputAction>();
  private readonly pendingPressed = new Set<ButtonInputAction>();
  private readonly pressedThisFrame = new Set<ButtonInputAction>();

  public setAxis(action: AxisInputAction, value: number): void {
    this.axes.set(action, clampAxis(value));
  }

  public setButton(action: ButtonInputAction, isDown: boolean): void {
    const wasDown = this.down.has(action);

    if (action === 'GALLOP') {
      setTouchGallopHeld(isDown);
    }

    if (isDown) {
      this.down.add(action);
      if (!wasDown) {
        this.pendingPressed.add(action);
      }
      return;
    }

    this.down.delete(action);
  }

  public update(): void {
    this.pressedThisFrame.clear();
    for (const action of this.pendingPressed) {
      this.pressedThisFrame.add(action);
    }
    this.pendingPressed.clear();
  }

  public getAxis(action: AxisInputAction): number {
    return this.axes.get(action) ?? 0;
  }

  public isDown(action: ButtonInputAction): boolean {
    return this.down.has(action);
  }

  public justPressed(action: ButtonInputAction): boolean {
    return this.pressedThisFrame.has(action);
  }

  public destroy(): void {
    if (this.down.has('GALLOP')) {
      setTouchGallopHeld(false);
    }
    this.axes.clear();
    this.down.clear();
    this.pendingPressed.clear();
    this.pressedThisFrame.clear();
  }
}

// UI primitives
export interface UiPanelStyle {
  fill?: number;
  stroke?: number;
  lineWidth?: number;
  radius?: number;
  alpha?: number;
}

export interface UiPanelShadowStyle {
  colour?: number;
  offsetX?: number;
  offsetY?: number;
  alpha?: number;
}

export function drawUiPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  style: UiPanelStyle = {},
): void {
  const radius = style.radius ?? UI_DESIGN_TOKENS.radius.panelPx;
  const fill = style.fill ?? cssColourToPhaser(UI_DESIGN_TOKENS.colour.cream);
  const stroke = style.stroke ?? cssColourToPhaser(UI_DESIGN_TOKENS.colour.conceptLavenderLine);
  const lineWidth = style.lineWidth ?? UI_DESIGN_TOKENS.border.strongPx;
  const alpha = style.alpha ?? 0.98;

  graphics.fillStyle(fill, alpha);
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  graphics.lineStyle(lineWidth, stroke, 1);
  graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
}

export function drawUiPanelShadow(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = UI_DESIGN_TOKENS.radius.panelPx,
  style: UiPanelShadowStyle = {},
): void {
  graphics.fillStyle(
    style.colour ?? cssColourToPhaser(UI_DESIGN_TOKENS.colour.conceptShadow),
    style.alpha ?? 0.2,
  );
  graphics.fillRoundedRect(
    x - width / 2 + (style.offsetX ?? UI_DESIGN_TOKENS.shadow.offsetXPx),
    y - height / 2 + (style.offsetY ?? UI_DESIGN_TOKENS.shadow.offsetYPx),
    width,
    height,
    radius,
  );
}

export function createUiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    color: UI_DESIGN_TOKENS.colour.ink,
    fontFamily: UI_DESIGN_TOKENS.typography.family,
    fontSize: `${UI_DESIGN_TOKENS.typography.bodyPx}px`,
    ...style,
  });
}

export function createUiActionHitTarget(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  name: string,
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(
      x,
      y,
      Math.max(width, UI_DESIGN_TOKENS.control.minimumTouchTargetPx),
      Math.max(height, UI_DESIGN_TOKENS.control.minimumTouchTargetPx),
      0xffffff,
      0.001,
    )
    .setName(name)
    .setInteractive({ useHandCursor: true });
}

// transient feedback
export type TransientFeedbackKind = 'reaction' | 'reward' | 'guidance' | 'quest-complete';

const PRIORITY: Record<TransientFeedbackKind, number> = {
  reaction: 10,
  reward: 20,
  guidance: 30,
  'quest-complete': 40,
};

interface ActiveTransientFeedback {
  token: symbol;
  kind: TransientFeedbackKind;
  priority: number;
  onPreempt: () => void;
}

const activeByScene = new WeakMap<Phaser.Scene, ActiveTransientFeedback>();

/**
 * Claims the single non-dialogue transient feedback slot for a scene.
 *
 * Higher-priority feedback pre-empts lower-priority feedback at its canonical presenter. Equal
 * priority replaces the previous surface, which keeps repeated guidance/reward events from stacking.
 * Lower-priority callers receive null and can choose to queue or suppress their message.
 */
export function claimTransientFeedback(
  scene: Phaser.Scene,
  kind: TransientFeedbackKind,
  onPreempt: () => void,
): (() => void) | null {
  const priority = PRIORITY[kind];
  const current = activeByScene.get(scene);
  if (current && current.priority > priority) {
    return null;
  }

  const token = Symbol(kind);
  const next: ActiveTransientFeedback = { token, kind, priority, onPreempt };
  activeByScene.set(scene, next);

  if (current) {
    current.onPreempt();
  }

  return () => {
    const active = activeByScene.get(scene);
    if (active?.token === token) {
      activeByScene.delete(scene);
    }
  };
}

export function getTransientFeedbackKind(scene: Phaser.Scene): TransientFeedbackKind | null {
  return activeByScene.get(scene)?.kind ?? null;
}

/** Dialogue owns the screen above every transient notification, so starting dialogue clears it. */
export function preemptTransientFeedbackForDialogue(scene: Phaser.Scene): void {
  const active = activeByScene.get(scene);
  if (!active) {
    return;
  }
  activeByScene.delete(scene);
  active.onPreempt();
}

// location checkpoint
export const MOONFLOWER_GLADE_LOCATION_ID = 'location:moonflower-glade';

export function saveLocationCheckpoint(saveService: SaveService, locationId: string): SaveGame {
  const current = saveService.load() ?? saveService.createNewGame();

  if (current.profile.currentLocationId === locationId) {
    return current;
  }

  return saveService.save({
    ...current,
    profile: {
      ...current.profile,
      currentLocationId: locationId,
    },
  });
}

// interaction modal state
const lockedScenes = new WeakSet<Phaser.Scene>();
let lockCount = 0;
let suppressInteractionUntil = 0;
const CLOSE_CLICK_THROUGH_GUARD_MS = 160;

/**
 * Shared gameplay lock for an active conversation/interaction surface.
 * It suppresses exploration movement and contextual background interaction without pausing the scene,
 * so the active surface can still receive close/continue input.
 */
export function setInteractionModalActive(scene: Phaser.Scene, active: boolean): void {
  const wasActive = lockedScenes.has(scene);
  if (active === wasActive) {
    return;
  }

  if (active) {
    lockedScenes.add(scene);
    lockCount += 1;
    return;
  }

  lockedScenes.delete(scene);
  lockCount = Math.max(0, lockCount - 1);
  suppressInteractionUntil = Math.max(
    suppressInteractionUntil,
    Date.now() + CLOSE_CLICK_THROUGH_GUARD_MS,
  );
}

export function isInteractionModalActive(scene?: Phaser.Scene): boolean {
  return scene ? lockedScenes.has(scene) : lockCount > 0;
}

export function isInteractionActivationSuppressed(): boolean {
  return lockCount > 0 || Date.now() < suppressInteractionUntil;
}

export const EXPLORATION_MODAL_SCENE_KEYS = new Set([
  'InventoryScene',
  'WonderbookScene',
  'SettingsScene',
  'ShopScene',
  'CottageDecorateScene',
  'CottageStyleScene',
  'UnicornCreatorScene',
  'MapleBakingActivityScene',
]);

const SAFE_RETURN_RECOVERY: Readonly<Record<string, string>> = {
  VillageInteriorScene: 'SunbeamVillageScene',
  CottageInteriorScene: 'MoonflowerGladeScene',
  MoonflowerPatchScene: 'MoonflowerGladeScene',
  HollowTreeNookScene: 'MoonflowerGladeScene',
  WindmillLookoutScene: 'RainbowMeadowScene',
  CrystalGrottoScene: 'CrystalBrookScene',
  FireflyGroveScene: 'WhisperingWoodsScene',
};

export function hasOpenExplorationModal(scene: Phaser.Scene): boolean {
  for (const sceneKey of EXPLORATION_MODAL_SCENE_KEYS) {
    if (scene.scene.isActive(sceneKey)) {
      return true;
    }
  }
  return false;
}

export function openExplorationModal(
  source: Phaser.Scene,
  modalSceneKey: string,
  data: Record<string, unknown> = {},
): boolean {
  if (
    !source.scene.isActive() ||
    isInteractionActivationSuppressed() ||
    hasOpenExplorationModal(source)
  ) {
    return false;
  }

  if (!source.sys.game.scene.keys[modalSceneKey]) {
    return false;
  }

  try {
    source.scene.launch(modalSceneKey, {
      ...data,
      returnScene: source.scene.key,
    });
    // A modal may have been registered earlier in the session than a later-loaded interior.
    // Phaser preserves scene-manager ordering across stops/restarts, so merely launching that
    // older modal can leave it rendering underneath the opaque source scene. Always promote the
    // launched modal before pausing its source so Bag/Map/Book/Settings ownership is visible.
    source.scene.bringToTop(modalSceneKey);
    // Phaser can queue launch activation until the next scene step. Pause the caller
    // immediately after a valid registered launch instead of requiring isActive() here.
    source.scene.pause();
    return true;
  } catch {
    return false;
  }
}

export function resolveExplorationReturnRecovery(returnScene: string): string {
  return SAFE_RETURN_RECOVERY[returnScene] ?? returnScene;
}

export function closeExplorationModal(modal: Phaser.Scene, returnScene: string): string {
  modal.scene.stop();

  if (modal.scene.isPaused(returnScene)) {
    modal.scene.resume(returnScene);
    return returnScene;
  }

  if (modal.scene.isActive(returnScene)) {
    return returnScene;
  }

  const recoveryScene = resolveExplorationReturnRecovery(returnScene);
  if (modal.scene.isPaused(recoveryScene)) {
    modal.scene.resume(recoveryScene);
    return recoveryScene;
  }
  if (!modal.scene.isActive(recoveryScene)) {
    modal.scene.start(recoveryScene);
  }
  return recoveryScene;
}

// interaction targeting
interface ScoredTarget {
  target: InteractionTarget;
  distanceSquared: number;
}

export interface InteractionSelectionOptions {
  preferredTargetId?: string | null;
  retainedTargetId?: string | null;
  retentionMargin?: number;
}

function distanceSquared(left: MapPoint, right: MapPoint): number {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;
  return deltaX * deltaX + deltaY * deltaY;
}

function conditionIsTrue(condition: InteractionCondition | undefined): boolean {
  if (condition === undefined) {
    return true;
  }
  return typeof condition === 'function' ? condition() : condition;
}

export function getInteractionTargetPosition(target: InteractionTarget): MapPoint {
  return typeof target.position === 'function' ? target.position() : target.position;
}

export function getInteractionApproachPosition(target: InteractionTarget): MapPoint | null {
  if (!target.approachPosition) {
    return null;
  }
  return typeof target.approachPosition === 'function'
    ? target.approachPosition()
    : target.approachPosition;
}

export function isInteractionTargetAvailable(target: InteractionTarget): boolean {
  return conditionIsTrue(target.visible) && conditionIsTrue(target.enabled);
}

function isInteractionTargetInRange(playerPosition: MapPoint, target: InteractionTarget): boolean {
  if (!isInteractionTargetAvailable(target)) {
    return false;
  }
  if (target.reachable !== undefined) {
    const reachable =
      typeof target.reachable === 'function'
        ? (target.reachable as (position: MapPoint) => boolean)(playerPosition)
        : target.reachable;
    if (!reachable) {
      return false;
    }
  }

  const targetPosition = getInteractionTargetPosition(target);
  return distanceSquared(playerPosition, targetPosition) <= target.interactionRadius ** 2;
}

export function isInteractionTargetEligible(
  playerPosition: MapPoint,
  target: InteractionTarget,
): boolean {
  return (
    target.activationMode !== 'automatic' && isInteractionTargetInRange(playerPosition, target)
  );
}

export function isAutomaticInteractionTargetEligible(
  playerPosition: MapPoint,
  target: InteractionTarget,
): boolean {
  return (
    target.activationMode === 'automatic' && isInteractionTargetInRange(playerPosition, target)
  );
}

function scoreEligibleTargets(
  playerPosition: MapPoint,
  targets: readonly InteractionTarget[],
  isEligible: (playerPosition: MapPoint, target: InteractionTarget) => boolean,
): ScoredTarget[] {
  const candidates: ScoredTarget[] = [];
  for (const target of targets) {
    if (!isEligible(playerPosition, target)) {
      continue;
    }
    candidates.push({
      target,
      distanceSquared: distanceSquared(playerPosition, getInteractionTargetPosition(target)),
    });
  }

  candidates.sort((left, right) => {
    if (left.distanceSquared !== right.distanceSquared) {
      return left.distanceSquared - right.distanceSquared;
    }
    const priorityDifference = (right.target.priority ?? 0) - (left.target.priority ?? 0);
    if (priorityDifference !== 0) {
      return priorityDifference;
    }
    return left.target.id.localeCompare(right.target.id);
  });
  return candidates;
}

/**
 * Selects exactly one explicit interaction. Distance always wins over priority, explicit direct
 * taps win only while still eligible, and a small retention margin prevents the prompt flickering
 * between two neighbours when the player is standing on their boundary.
 */
export function selectInteractionTarget(
  playerPosition: MapPoint,
  targets: readonly InteractionTarget[],
  options: InteractionSelectionOptions = {},
): InteractionTarget | null {
  const candidates = scoreEligibleTargets(playerPosition, targets, isInteractionTargetEligible);
  if (candidates.length === 0) {
    return null;
  }

  if (options.preferredTargetId) {
    const preferred = candidates.find(({ target }) => target.id === options.preferredTargetId);
    if (preferred) {
      return preferred.target;
    }
  }

  const best = candidates[0];
  if (!options.retainedTargetId || best.target.id === options.retainedTargetId) {
    return best.target;
  }

  const retained = candidates.find(({ target }) => target.id === options.retainedTargetId);
  if (!retained) {
    return best.target;
  }

  const retentionMargin = Math.max(0, options.retentionMargin ?? 18);
  const bestDistance = Math.sqrt(best.distanceSquared);
  const retainedDistance = Math.sqrt(retained.distanceSquared);
  return retainedDistance <= bestDistance + retentionMargin ? retained.target : best.target;
}

/**
 * Selects the nearest automatic crossing/trigger independently from explicit actions. Automatic
 * targets never enter the prompt/direct-tap route, but use the same visibility, reachability and
 * distance contracts as ordinary interactions.
 */
export function selectAutomaticInteractionTarget(
  playerPosition: MapPoint,
  targets: readonly InteractionTarget[],
): InteractionTarget | null {
  return (
    scoreEligibleTargets(playerPosition, targets, isAutomaticInteractionTargetEligible)[0]
      ?.target ?? null
  );
}

// accessibility settings
export interface AccessibilitySettings {
  reducedMotion: boolean;
  highVisibilityInteractions: boolean;
}

export interface AccessibilitySettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type AccessibilitySettingsListener = (settings: AccessibilitySettings) => void;

export const ACCESSIBILITY_SETTINGS_STORAGE_KEY = 'unicorn-valley:accessibility-settings:v1';

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  highVisibilityInteractions: false,
};

export function normaliseAccessibilitySettings(value: unknown): AccessibilitySettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
  }

  const candidate = value as Partial<AccessibilitySettings>;
  return {
    reducedMotion:
      typeof candidate.reducedMotion === 'boolean'
        ? candidate.reducedMotion
        : DEFAULT_ACCESSIBILITY_SETTINGS.reducedMotion,
    highVisibilityInteractions:
      typeof candidate.highVisibilityInteractions === 'boolean'
        ? candidate.highVisibilityInteractions
        : DEFAULT_ACCESSIBILITY_SETTINGS.highVisibilityInteractions,
  };
}

function resolveBrowserStorage(): AccessibilitySettingsStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class AccessibilitySettingsStore {
  private readonly listeners = new Set<AccessibilitySettingsListener>();

  public constructor(
    private readonly storage: AccessibilitySettingsStorage | null = resolveBrowserStorage(),
  ) {}

  public load(): AccessibilitySettings {
    if (!this.storage) {
      return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    }

    try {
      const raw = this.storage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
      }
      return normaliseAccessibilitySettings(JSON.parse(raw) as unknown);
    } catch {
      return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    }
  }

  public save(settings: AccessibilitySettings): AccessibilitySettings {
    const normalised = normaliseAccessibilitySettings(settings);
    try {
      this.storage?.setItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY, JSON.stringify(normalised));
    } catch {
      // Accessibility preferences are non-critical; keep the game playable without storage.
    }
    for (const listener of [...this.listeners]) {
      listener({ ...normalised });
    }
    return normalised;
  }

  public update(patch: Partial<AccessibilitySettings>): AccessibilitySettings {
    return this.save({ ...this.load(), ...patch });
  }

  public subscribe(listener: AccessibilitySettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

let browserAccessibilitySettingsStore: AccessibilitySettingsStore | null = null;

export function getBrowserAccessibilitySettingsStore(): AccessibilitySettingsStore {
  browserAccessibilitySettingsStore ??= new AccessibilitySettingsStore();
  return browserAccessibilitySettingsStore;
}

export function isReducedMotionEnabled(): boolean {
  return getBrowserAccessibilitySettingsStore().load().reducedMotion;
}

// discovery service
export interface UnlockDiscoveryOptions {
  suppressRewardFeedback?: boolean;
}

export class DiscoveryService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public hasDiscovery(discoveryId: DiscoveryId): boolean {
    const save = this.saveService.load();
    return Boolean(
      save?.collections.discoveryIds.includes(discoveryId) ||
        save?.world.uniqueDiscoveryIds.includes(discoveryId),
    );
  }

  public unlockDiscovery(
    discoveryId: DiscoveryId,
    worldFlagId?: string,
    options: UnlockDiscoveryOptions = {},
  ): SaveGame {
    const current = this.saveService.load() ?? this.saveService.createNewGame();
    const alreadyUnlocked =
      current.collections.discoveryIds.includes(discoveryId) ||
      current.world.uniqueDiscoveryIds.includes(discoveryId);
    const discoveryIds = current.collections.discoveryIds.includes(discoveryId)
      ? current.collections.discoveryIds
      : [...current.collections.discoveryIds, discoveryId];
    const uniqueDiscoveryIds = current.world.uniqueDiscoveryIds.includes(discoveryId)
      ? current.world.uniqueDiscoveryIds
      : [...current.world.uniqueDiscoveryIds, discoveryId];

    const saved = this.saveService.save({
      ...current,
      collections: {
        ...current.collections,
        discoveryIds,
      },
      world: {
        ...current.world,
        uniqueDiscoveryIds,
        flags: worldFlagId
          ? {
              ...current.world.flags,
              [worldFlagId]: true,
            }
          : current.world.flags,
      },
    });

    if (!alreadyUnlocked) {
      this.events.emit('DISCOVERY_UNLOCKED', {
        discoveryId,
        suppressRewardFeedback: options.suppressRewardFeedback,
      });
    }
    if (worldFlagId && current.world.flags[worldFlagId] !== true) {
      this.events.emit('WORLD_FLAG_CHANGED', { flagId: worldFlagId, value: true });
    }

    return saved;
  }
}

// inventory service
export interface OwnedInventoryItem {
  definition: ItemDefinition;
  quantity: number;
}

export interface InventoryItemPresentation {
  icon: string;
  category: ItemCategory;
  description: string;
}

export interface AddItemOptions {
  suppressRewardFeedback?: boolean;
}

export interface RemoveItemOptions {
  allowQuestCritical?: boolean;
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`Inventory quantity must be a positive integer. Received: ${quantity}`);
  }
}

export function getItemPresentation(item: ItemDefinition): InventoryItemPresentation {
  return {
    icon: item.icon ?? '✨',
    category: item.category ?? 'collectable',
    description: item.description ?? 'A little treasure from Unicorn Valley.',
  };
}

export class InventoryService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public getQuantity(itemId: ItemId): number {
    itemRegistry.get(itemId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return save.inventory.itemQuantities[itemId] ?? 0;
  }

  public hasItem(itemId: ItemId, quantity = 1): boolean {
    assertQuantity(quantity);
    return this.getQuantity(itemId) >= quantity;
  }

  public addItem(itemId: ItemId, quantity = 1, options: AddItemOptions = {}): number {
    itemRegistry.get(itemId);
    assertQuantity(quantity);

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const nextQuantity = (save.inventory.itemQuantities[itemId] ?? 0) + quantity;
    this.saveService.save({
      ...save,
      inventory: {
        ...save.inventory,
        itemQuantities: {
          ...save.inventory.itemQuantities,
          [itemId]: nextQuantity,
        },
      },
    });
    this.events.emit('ITEM_COLLECTED', {
      itemId,
      quantity,
      suppressRewardFeedback: options.suppressRewardFeedback,
    });

    return nextQuantity;
  }

  public removeItem(itemId: ItemId, quantity = 1, options: RemoveItemOptions = {}): boolean {
    const definition = itemRegistry.get(itemId);
    assertQuantity(quantity);

    if (definition.questCritical && !options.allowQuestCritical) {
      throw new Error(`Quest-critical item cannot be removed directly: ${itemId}`);
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const currentQuantity = save.inventory.itemQuantities[itemId] ?? 0;
    if (currentQuantity < quantity) {
      return false;
    }

    const itemQuantities = { ...save.inventory.itemQuantities };
    const nextQuantity = currentQuantity - quantity;
    if (nextQuantity === 0) {
      delete itemQuantities[itemId];
    } else {
      itemQuantities[itemId] = nextQuantity;
    }

    this.saveService.save({
      ...save,
      inventory: {
        ...save.inventory,
        itemQuantities,
      },
    });

    return true;
  }

  public listOwnedItems(): readonly OwnedInventoryItem[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return Object.entries(save.inventory.itemQuantities)
      .filter(
        ([itemId, quantity]) =>
          Number.isInteger(quantity) && quantity > 0 && itemRegistry.has(itemId as ItemId),
      )
      .map(([itemId, quantity]) => ({
        definition: itemRegistry.get(itemId as ItemId),
        quantity,
      }))
      .sort((left, right) => left.definition.name.localeCompare(right.definition.name));
  }
}

// relationship service
export const MAX_FRIENDSHIP_POINTS = 100;

const FRIENDSHIP_TIER_THRESHOLDS: readonly [FriendshipTier, number][] = [
  ['best-friend', 30],
  ['good-friend', 15],
  ['friend', 5],
  ['just-met', 0],
];

export const FRIENDSHIP_TIER_LABELS: Readonly<Record<FriendshipTier, string>> = {
  'just-met': 'Just Met',
  friend: 'Friend',
  'good-friend': 'Good Friend',
  'best-friend': 'Best Friend',
};

const DEFAULT_RELATIONSHIP: RelationshipProgress = {
  friendshipPoints: 0,
  flags: [],
};

export function getFriendshipTier(friendshipPoints: number): FriendshipTier {
  const safePoints = Math.max(0, Math.min(MAX_FRIENDSHIP_POINTS, friendshipPoints));
  return (
    FRIENDSHIP_TIER_THRESHOLDS.find(([, threshold]) => safePoints >= threshold)?.[0] ?? 'just-met'
  );
}

export function meetsFriendshipTier(
  currentTier: FriendshipTier,
  minimumTier: FriendshipTier,
): boolean {
  const rank: Readonly<Record<FriendshipTier, number>> = {
    'just-met': 0,
    friend: 1,
    'good-friend': 2,
    'best-friend': 3,
  };
  return rank[currentTier] >= rank[minimumTier];
}

export class RelationshipService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public hasMet(characterId: CharacterId): boolean {
    characterRegistry.get(characterId);
    return Boolean(this.saveService.load()?.relationships.byCharacterId[characterId]);
  }

  public markMet(characterId: CharacterId): RelationshipProgress {
    characterRegistry.get(characterId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const current = save.relationships.byCharacterId[characterId];
    if (current) {
      return this.copyProgress(current);
    }

    const next = this.copyProgress(DEFAULT_RELATIONSHIP);
    this.saveRelationship(save, characterId, next);
    return next;
  }

  public getRelationship(characterId: CharacterId): RelationshipProgress {
    characterRegistry.get(characterId);
    const stored = this.saveService.load()?.relationships.byCharacterId[characterId];
    return this.copyProgress(stored ?? DEFAULT_RELATIONSHIP);
  }

  public getTier(characterId: CharacterId): FriendshipTier {
    return getFriendshipTier(this.getRelationship(characterId).friendshipPoints);
  }

  public meetsTier(characterId: CharacterId, minimumTier: FriendshipTier): boolean {
    return meetsFriendshipTier(this.getTier(characterId), minimumTier);
  }

  public hasFlag(characterId: CharacterId, flag: string): boolean {
    characterRegistry.get(characterId);
    const trimmed = flag.trim();
    if (!trimmed) {
      return false;
    }
    return this.getRelationship(characterId).flags.includes(trimmed);
  }

  public addFriendship(characterId: CharacterId, amount: number): RelationshipProgress {
    characterRegistry.get(characterId);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(`Friendship increase must be a positive integer. Received: ${amount}`);
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const current = save.relationships.byCharacterId[characterId] ?? DEFAULT_RELATIONSHIP;
    const friendshipPoints = Math.min(MAX_FRIENDSHIP_POINTS, current.friendshipPoints + amount);
    const next: RelationshipProgress = {
      friendshipPoints,
      flags: [...current.flags],
    };

    if (friendshipPoints === current.friendshipPoints) {
      return next;
    }

    this.saveRelationship(save, characterId, next);
    this.events.emit('RELATIONSHIP_CHANGED', {
      characterId,
      friendshipPoints,
      friendshipTier: getFriendshipTier(friendshipPoints),
    });

    return next;
  }

  public addFlag(characterId: CharacterId, flag: string): RelationshipProgress {
    characterRegistry.get(characterId);
    const trimmed = flag.trim();
    if (!trimmed) {
      throw new Error('Relationship flag cannot be empty.');
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const current = save.relationships.byCharacterId[characterId] ?? DEFAULT_RELATIONSHIP;
    if (current.flags.includes(trimmed)) {
      return this.copyProgress(current);
    }

    const next: RelationshipProgress = {
      friendshipPoints: current.friendshipPoints,
      flags: [...current.flags, trimmed],
    };
    this.saveRelationship(save, characterId, next);
    return next;
  }

  private saveRelationship(
    save: SaveGame,
    characterId: CharacterId,
    progress: RelationshipProgress,
  ): void {
    this.saveService.save({
      ...save,
      relationships: {
        ...save.relationships,
        byCharacterId: {
          ...save.relationships.byCharacterId,
          [characterId]: progress,
        },
      },
    });
  }

  private copyProgress(progress: RelationshipProgress): RelationshipProgress {
    return {
      friendshipPoints: progress.friendshipPoints,
      flags: [...progress.flags],
    };
  }
}
