import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { getClickToMoveManager } from './game/input/ClickToMoveManager';
import { installBrowserDiagnostics } from './game/testing/BrowserDiagnostics';

const game = new Phaser.Game(gameConfig);
getClickToMoveManager(game);
installBrowserDiagnostics(game);
