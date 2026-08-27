import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { getClickToMoveManager } from './game/input/ClickToMoveManager';
import { getExplorationShellWorldManager } from './game/ui/ExplorationShellWorldManager';
import { getTitlePortraitControlsManager } from './game/ui/TitlePortraitControlsManager';
import { getR5FinalTighteningManager } from './game/visual/R5FinalTighteningManager';
import { getExplorationGeometryPresentationManager } from './game/world/ExplorationGeometryPresentationManager';

const game = new Phaser.Game(gameConfig);
getClickToMoveManager(game);
getExplorationShellWorldManager(game);
getTitlePortraitControlsManager(game);
getExplorationGeometryPresentationManager(game);
getR5FinalTighteningManager(game);

if (new URLSearchParams(globalThis.location.search).get('diagnostics') === '1') {
  void import('./game/testing/BrowserDiagnostics').then(({ installBrowserDiagnostics }) => {
    installBrowserDiagnostics(game);
  });
}
