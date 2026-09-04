import type Phaser from 'phaser';
import {
  MOONCAP_TRAIL_RACE_ID,
  PETAL_PARADE_RACE_ID,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import { GAME_WIDTH } from '../config/gameConstants';
import { getActiveRaceCourse } from './RaceCourse';
import { getRaceShortcut } from './RaceShortcut';

interface RaceTheme {
  background: string;
  terrain: number;
  accent: number;
  secondary: number;
  icon: string;
  subtitle: string;
}

const THEMES: Readonly<Record<string, RaceTheme>> = {
  [PETAL_PARADE_RACE_ID]: {
    background: '#a8e4f2',
    terrain: 0x8ccd78,
    accent: 0xf3a7ce,
    secondary: 0xffda72,
    icon: '🌸',
    subtitle: 'Meadow petals, breezes and bright flower gates',
  },
  [MOONCAP_TRAIL_RACE_ID]: {
    background: '#294b48',
    terrain: 0x466b4d,
    accent: 0xb8e58a,
    secondary: 0xcab4e7,
    icon: '🍄',
    subtitle: 'Mooncaps, roots and a hidden Root Hop route',
  },
  [SHORELINE_SURGE_RACE_ID]: {
    background: '#8fdcf0',
    terrain: 0xe6d196,
    accent: 0x7bd4e4,
    secondary: 0xf5d7b2,
    icon: '🐚',
    subtitle: 'Skipper’s dunes-to-Moonlit-Point shoreline run',
  },
};

const COURSE_START_X = 260;

export function isR65ExpandedRace(courseId: string): boolean {
  return courseId in THEMES;
}

export function getR65RaceThemeIcon(courseId: string): string {
  return THEMES[courseId]?.icon ?? '🏁';
}

export function createR65RacePresentation(
  scene: Phaser.Scene,
  courseId: string,
): Phaser.GameObjects.Container | null {
  const theme = THEMES[courseId];
  if (!theme) {
    return null;
  }

  const course = getActiveRaceCourse();
  const worldWidth = course.length + 760;
  scene.cameras.main.setBackgroundColor(theme.background);
  const objects: Phaser.GameObjects.GameObject[] = [
    scene.add.rectangle(worldWidth / 2, 250, worldWidth, 500, theme.terrain, 0.18),
    scene.add.rectangle(worldWidth / 2, 690, worldWidth, 110, theme.terrain, 0.62),
  ];

  for (let x = 480, index = 0; x < COURSE_START_X + course.length - 120; x += 410, index += 1) {
    objects.push(
      scene.add
        .text(x, index % 2 === 0 ? 470 : 670, index % 3 === 0 ? theme.icon : '✦', {
          color: index % 2 === 0 ? '#fff7cf' : '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 3 === 0 ? '34px' : '24px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.72),
    );
  }

  objects.push(
    scene.add
      .text(GAME_WIDTH / 2, 105, `${theme.icon} ${course.name}\n${theme.subtitle}`, {
        color: '#594b66',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9e8e8',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0),
  );

  const shortcut = getRaceShortcut(courseId);
  if (shortcut) {
    const entryX = COURSE_START_X + shortcut.entryStartProgress;
    const exitX = COURSE_START_X + shortcut.entryEndProgress + shortcut.progressSkip;
    objects.push(
      scene.add
        .rectangle((entryX + exitX) / 2, 500, Math.max(180, exitX - entryX), 48, theme.accent, 0.54)
        .setStrokeStyle(4, theme.secondary, 0.9),
      scene.add
        .text(
          entryX + 120,
          446,
          `${shortcut.label.toUpperCase()} ↗\nJump into the glowing route!`,
          {
            color: '#4f4d62',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            align: 'center',
            backgroundColor: '#fff9e8e8',
            padding: { x: 9, y: 5 },
          },
        )
        .setOrigin(0.5),
    );
  }

  return scene.add.container(0, 0, objects).setName(`r6.5-wp12-race-theme:${courseId}`).setDepth(8);
}
