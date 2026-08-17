import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './game/config/gameConfig';

const game = new Phaser.Game(gameConfig);

if (new URLSearchParams(globalThis.location.search).has('scene')) {
  const diagnosticGlobal = globalThis as typeof globalThis & {
    __unicornValleyGame?: Phaser.Game;
  };
  diagnosticGlobal.__unicornValleyGame = game;
}
