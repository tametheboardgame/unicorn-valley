import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { SaveGame } from '../save/saveSchema';
import { getRainbowCupEventStates, isRainbowCupComplete } from './RainbowCup';

function formatBestTime(bestTimeMs: number | null): string {
  return bestTimeMs === null ? 'Not finished yet' : `Best ${(bestTimeMs / 1000).toFixed(1)}s`;
}

export function createRainbowCupOverlay(
  scene: Phaser.Scene,
  save: SaveGame,
  onRaceSelected: (courseId: string) => void,
  onClosed: () => void,
): Phaser.GameObjects.Container {
  const events = getRainbowCupEventStates(save);
  const complete = isRainbowCupComplete(save);
  const children: Phaser.GameObjects.GameObject[] = [];

  children.push(
    scene.add.rectangle(
      GAME_WIDTH / 2 + 10,
      GAME_HEIGHT / 2 + 10,
      900,
      650,
      0x3e3650,
      0.38,
    ),
    scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 880, 630, 0xfff9e8, 0.99)
      .setStrokeStyle(6, 0xb78ab9, 1),
    scene.add
      .text(GAME_WIDTH / 2, 82, complete ? '🏆 Rainbow Cup Complete!' : '🏆 Rainbow Cup', {
        color: '#634d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
    scene.add
      .text(
        GAME_WIDTH / 2,
        122,
        complete
          ? 'You finished every regular course. Every finish counted.'
          : 'Finish all five courses. You never have to win for your finish to count.',
        {
          color: '#755e7d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5),
  );

  events.forEach((event, index) => {
    const y = 185 + index * 78;
    const row = scene.add
      .rectangle(GAME_WIDTH / 2, y, 750, 64, event.completed ? 0xe9f6d7 : 0xf4e9f8, 1)
      .setStrokeStyle(3, event.unlocked ? 0xb58bc0 : 0xc2b9c6, 0.9);
    const status = event.completed
      ? `✓ ${formatBestTime(event.bestTimeMs)}`
      : event.unlocked
        ? `Ready • ${formatBestTime(event.bestTimeMs)}`
        : `🔒 ${event.clue}`;
    const text = scene.add
      .text(GAME_WIDTH / 2 - 338, y, `${event.icon}  ${event.name}\n${status}`, {
        color: event.unlocked ? '#5d4c68' : '#8a808e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        lineSpacing: 4,
      })
      .setOrigin(0, 0.5);
    children.push(row, text);

    if (!event.unlocked) {
      return;
    }
    const button = scene.add
      .text(GAME_WIDTH / 2 + 315, y, event.completed ? 'Race again' : 'Race', {
        color: '#5c4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#ffefb7',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => onRaceSelected(event.courseId));
    children.push(button);
  });

  if (complete) {
    children.push(
      scene.add
        .text(
          GAME_WIDTH / 2,
          586,
          '🎏 Rainbow Cup Pennant added to your Cottage decorations',
          {
            color: '#765368',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5),
    );
  }

  const close = scene.add
    .text(GAME_WIDTH / 2, 645, 'Close', {
      color: '#5c4668',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      backgroundColor: '#eee1f7',
      padding: { x: 22, y: 9 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  children.push(close);

  const container = scene.add
    .container(0, 0, children)
    .setName('r6.5-wp12-rainbow-cup-overlay')
    .setScrollFactor(0)
    .setDepth(20_500);
  close.on('pointerdown', () => {
    container.destroy(true);
    onClosed();
  });
  return container;
}
