import Phaser from 'phaser';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { setInteractionModalActive } from '../interaction/InteractionModalState';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { resolveRaceEntryPrompt } from '../racing/RacePlaytestRecoveryManager';
import { getNovaFirstRacePhase } from './NovaFirstRaceStory';

export const NOVA_RACE_DECISION_NAME = 'nova-race-decision';
export const NOVA_RACE_DECISION_YES_NAME = 'nova-race-decision-yes';
export const NOVA_RACE_DECISION_NO_NAME = 'nova-race-decision-no';

/**
 * Keeps Nova's post-conversation race choice in the active meadow after the
 * conversation-only NovaStoryScene was retired by WP19E.
 */
export function openNovaRaceDecision(scene: Phaser.Scene): boolean {
  const progress = getBrowserQuestEngine().getProgress(NOVA_FIRST_RACE_QUEST_ID);
  const phase = getNovaFirstRacePhase(progress);
  if (phase !== 'ready-to-race' && phase !== 'complete') {
    return false;
  }
  if (scene.children.getByName(NOVA_RACE_DECISION_NAME)) {
    return true;
  }

  const copy = resolveRaceEntryPrompt(phase);
  let closed = false;

  const shade = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x392f44, 0.28).setOrigin(0);
  const shadow = scene.add.rectangle(
    GAME_WIDTH / 2 + 7,
    GAME_HEIGHT / 2 + 10,
    650,
    300,
    0x493958,
    0.24,
  );
  const panel = scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 640, 290, 0xfff8e8, 0.995)
    .setStrokeStyle(6, 0xb689b8, 1);
  const title = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 84, 'Do you want to race now?', {
      color: '#60486d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '31px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  const detail = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, copy.detail, {
      color: '#735b80',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      align: 'center',
      wordWrap: { width: 560 },
    })
    .setOrigin(0.5);
  const yesButton = scene.add
    .rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 72, 240, 72, 0xffefb7, 1)
    .setStrokeStyle(4, 0xd49acb, 1);
  const yesText = scene.add
    .text(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 72, copy.yesLabel, {
      color: '#60486d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  const noButton = scene.add
    .rectangle(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 72, 220, 72, 0xf1e2fb, 1)
    .setStrokeStyle(4, 0xb895c8, 1);
  const noText = scene.add
    .text(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 72, 'Not now', {
      color: '#60486d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  const hint = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 126, 'Enter / E / Space = yes   •   Esc = not now', {
      color: '#8a748f',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
    })
    .setOrigin(0.5);

  const container = scene.add
    .container(0, 0, [
      shade,
      shadow,
      panel,
      title,
      detail,
      yesButton,
      yesText,
      noButton,
      noText,
      hint,
    ])
    .setName(NOVA_RACE_DECISION_NAME)
    .setScrollFactor(0)
    .setDepth(20_300);
  const yesZone = scene.add
    .zone(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 72, 250, 84)
    .setName(NOVA_RACE_DECISION_YES_NAME)
    .setScrollFactor(0)
    .setDepth(20_310)
    .setInteractive({ useHandCursor: true });
  const noZone = scene.add
    .zone(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 72, 230, 84)
    .setName(NOVA_RACE_DECISION_NO_NAME)
    .setScrollFactor(0)
    .setDepth(20_310)
    .setInteractive({ useHandCursor: true });

  setInteractionModalActive(scene, true);

  const cleanup = (): void => {
    if (closed) return;
    closed = true;
    globalThis.removeEventListener?.('keydown', onKeyDown, true);
    yesZone.destroy();
    noZone.destroy();
    container.destroy(true);
    setInteractionModalActive(scene, false);
  };

  const accept = (): void => {
    if (closed) return;
    cleanup();
    scene.scene.start(copy.targetScene, copy.payload);
  };

  const decline = (): void => {
    if (closed) return;
    cleanup();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (['Enter', 'KeyE', 'Space'].includes(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      accept();
      return;
    }
    if (event.code === 'Escape' || event.code === 'KeyN') {
      event.preventDefault();
      event.stopImmediatePropagation();
      decline();
    }
  };

  yesZone.on('pointerdown', accept);
  noZone.on('pointerdown', decline);
  globalThis.addEventListener?.('keydown', onKeyDown, true);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  return true;
}
