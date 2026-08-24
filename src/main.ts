import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { getClickToMoveManager } from './game/input/ClickToMoveManager';
import { installBrowserDiagnostics } from './game/testing/BrowserDiagnostics';
import { getExplorationShellWorldManager } from './game/ui/ExplorationShellWorldManager';
import { getR5FinalTighteningManager } from './game/visual/R5FinalTighteningManager';
import { getExplorationGeometryPresentationManager } from './game/world/ExplorationGeometryPresentationManager';

const game = new Phaser.Game(gameConfig);
getClickToMoveManager(game);
getExplorationShellWorldManager(game);
getExplorationGeometryPresentationManager(game);
getR5FinalTighteningManager(game);
installBrowserDiagnostics(game);
