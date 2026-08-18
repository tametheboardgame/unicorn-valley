import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';
import { installBrowserDiagnostics } from './game/testing/BrowserDiagnostics';

const game = new Phaser.Game(gameConfig);
installBrowserDiagnostics(game);
