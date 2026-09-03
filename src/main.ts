import Phaser from 'phaser';
import './style.css';
import './titlePortraitControls.css';
import { gameConfig } from './game/config/gameConfig';
import { getClickToMoveManager } from './game/input/ClickToMoveManager';
import { getContinueRestoreManager } from './game/save/ContinueRestoreManager';
import { getVillageInteriorContractManager } from './game/scenes/VillageInteriorContractManager';
import { getExplorationShellWorldManager } from './game/ui/ExplorationShellWorldManager';
import { browserHasRaceTouchCapability } from './game/ui/RaceTouchCapability';
import { getTitlePortraitControlsManager } from './game/ui/TitlePortraitControlsManager';
import { getR5FinalTighteningManager } from './game/visual/R5FinalTighteningManager';
import { getExplorationGeometryPresentationManager } from './game/world/ExplorationGeometryPresentationManager';
import { getExplorationPathPolishManager } from './game/world/ExplorationPathPolishManager';
import { getWorldLayerAlignmentManager } from './game/world/WorldLayerAlignmentManager';

const game = new Phaser.Game(gameConfig);
getClickToMoveManager(game);
getContinueRestoreManager(game);
getExplorationShellWorldManager(game);
getTitlePortraitControlsManager(game);
getExplorationGeometryPresentationManager(game);
getExplorationPathPolishManager(game);
getWorldLayerAlignmentManager(game);
getR5FinalTighteningManager(game);
getVillageInteriorContractManager(game);

void import('./game/economy/EconomyRewardWorldManager').then(({ getEconomyRewardWorldManager }) => {
  getEconomyRewardWorldManager();
});

const registerExtendedScenes = Promise.all([
  import('./game/scenes/R6VillageInteriorScene'),
  import('./game/scenes/HollowTreeNookScene'),
  import('./game/scenes/WindmillLookoutScene'),
  import('./game/scenes/CrystalGrottoScene'),
]).then(
  ([
    { VillageInteriorScene },
    { HollowTreeNookScene },
    { WindmillLookoutScene },
    { CrystalGrottoScene },
  ]) => {
    if (!game.scene.keys.VillageInteriorScene) {
      game.scene.add('VillageInteriorScene', VillageInteriorScene);
    }
    if (!game.scene.keys.HollowTreeNookScene) {
      game.scene.add('HollowTreeNookScene', HollowTreeNookScene);
    }
    if (!game.scene.keys.WindmillLookoutScene) {
      game.scene.add('WindmillLookoutScene', WindmillLookoutScene);
    }
    if (!game.scene.keys.CrystalGrottoScene) {
      game.scene.add('CrystalGrottoScene', CrystalGrottoScene);
    }
  },
);

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

void import('./game/world/CrystalBrookDepthWorldManager').then(
  ({ getCrystalBrookDepthWorldManager }) => {
    getCrystalBrookDepthWorldManager(game);
  },
);

void import('./game/population/CrystalBrookEchoBridgeManager').then(
  ({ getCrystalBrookEchoBridgeManager }) => {
    getCrystalBrookEchoBridgeManager(game);
  },
);

void import('./game/story/StarlightBeachContentWorldManager').then(
  ({ getStarlightBeachContentWorldManager }) => {
    getStarlightBeachContentWorldManager(game);
  },
);

void Promise.all([
  import('./game/world/R6RegionGatewayArtManager'),
  import('./game/world/R6RegionGatewayArtPerformanceManager'),
  import('./game/world/R6FinalPlaythroughCleanupManager'),
  import('./game/world/FinalGraphicsTighteningManager'),
]).then(
  ([
    { getR6RegionGatewayArtManager },
    { getR6RegionGatewayArtPerformanceManager },
    { getR6FinalPlaythroughCleanupManager },
    { getFinalGraphicsTighteningManager },
  ]) => {
    getR6RegionGatewayArtManager(game);
    getR6RegionGatewayArtPerformanceManager(game);
    getR6FinalPlaythroughCleanupManager(game);
    getFinalGraphicsTighteningManager(game);
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
