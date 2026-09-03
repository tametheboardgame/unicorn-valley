import Phaser from 'phaser';
import './style.css';
import './titlePortraitControls.css';
import { gameConfig } from './game/config/gameConfig';
import { getClickToMoveManager } from './game/input/ClickToMoveManager';
import { getVillageInteriorContractManager } from './game/scenes/VillageInteriorContractManager';
import { getExplorationShellWorldManager } from './game/ui/ExplorationShellWorldManager';
import { browserHasRaceTouchCapability } from './game/ui/RaceTouchCapability';
import { getTitlePortraitControlsManager } from './game/ui/TitlePortraitControlsManager';
import { getR5FinalTighteningManager } from './game/visual/R5FinalTighteningManager';
import { getExplorationGeometryPresentationManager } from './game/world/ExplorationGeometryPresentationManager';

const game = new Phaser.Game(gameConfig);
getClickToMoveManager(game);
getExplorationShellWorldManager(game);
getTitlePortraitControlsManager(game);
getExplorationGeometryPresentationManager(game);
getR5FinalTighteningManager(game);
getVillageInteriorContractManager(game);

void import('./game/economy/EconomyRewardWorldManager').then(({ getEconomyRewardWorldManager }) => {
  getEconomyRewardWorldManager();
});

const registerExtendedScenes = Promise.all([
  import('./game/scenes/R6VillageInteriorScene'),
  import('./game/scenes/HollowTreeNookScene'),
  import('./game/scenes/WindmillLookoutScene'),
]).then(([{ VillageInteriorScene }, { HollowTreeNookScene }, { WindmillLookoutScene }]) => {
  if (!game.scene.keys.VillageInteriorScene) {
    game.scene.add('VillageInteriorScene', VillageInteriorScene);
  }
  if (!game.scene.keys.HollowTreeNookScene) {
    game.scene.add('HollowTreeNookScene', HollowTreeNookScene);
  }
  if (!game.scene.keys.WindmillLookoutScene) {
    game.scene.add('WindmillLookoutScene', WindmillLookoutScene);
  }
});

void import('./game/world/VillageLifeWorldManager').then(({ getVillageLifeWorldManager }) => {
  getVillageLifeWorldManager(game);
});

void import('./game/world/GladeDepthWorldManager').then(({ getGladeDepthWorldManager }) => {
  getGladeDepthWorldManager(game);
});

void import('./game/world/CottageDepthWorldManager').then(({ getCottageDepthWorldManager }) => {
  getCottageDepthWorldManager(game);
});

void import('./game/world/MeadowDepthWorldManager').then(({ getMeadowDepthWorldManager }) => {
  getMeadowDepthWorldManager(game);
});

void Promise.all([
  import('./game/world/R6RegionGatewayArtManager'),
  import('./game/world/R6RegionGatewayArtPerformanceManager'),
  import('./game/world/R6FinalPlaythroughCleanupManager'),
]).then(
  ([
    { getR6RegionGatewayArtManager },
    { getR6RegionGatewayArtPerformanceManager },
    { getR6FinalPlaythroughCleanupManager },
  ]) => {
    getR6RegionGatewayArtManager(game);
    getR6RegionGatewayArtPerformanceManager(game);
    getR6FinalPlaythroughCleanupManager(game);
  },
);

const creatorPortraitQuery = globalThis.matchMedia?.(
  '(pointer: coarse) and (max-width: 700px) and (orientation: portrait)',
);
let creatorPortraitControlsLoaded = false;

function ensureCreatorPortraitControls(): void {
  if (!creatorPortraitQuery?.matches || creatorPortraitControlsLoaded) {
    return;
  }

  creatorPortraitControlsLoaded = true;
  void import('./game/ui/CreatorPortraitControlsManager').then(
    ({ getCreatorPortraitControlsManager }) => {
      getCreatorPortraitControlsManager(game);
    },
  );
}

ensureCreatorPortraitControls();
creatorPortraitQuery?.addEventListener('change', () => ensureCreatorPortraitControls());

const raceTouchPointerQuery = globalThis.matchMedia?.('(pointer: coarse), (any-pointer: coarse)');
let raceMobileControlsLoaded = false;

function ensureRaceMobileControls(): void {
  if (!browserHasRaceTouchCapability() || raceMobileControlsLoaded) {
    return;
  }

  raceMobileControlsLoaded = true;
  void import('./game/ui/RaceMobileControlsManager').then(({ getRaceMobileControlsManager }) => {
    getRaceMobileControlsManager(game);
  });
}

ensureRaceMobileControls();
raceTouchPointerQuery?.addEventListener('change', () => ensureRaceMobileControls());

if (new URLSearchParams(globalThis.location.search).get('diagnostics') === '1') {
  void registerExtendedScenes
    .then(() => import('./game/testing/BrowserDiagnostics'))
    .then(({ installBrowserDiagnostics }) => {
      installBrowserDiagnostics(game);
    });
}
