import Phaser from 'phaser';
import type { DialogueChoice, DialogueId } from '../../content/contentTypes';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { resolveRaceEntryPrompt } from '../racing/RacePlaytestRecoveryManager';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  NOVA_CHARACTER_ID,
  didWinNovaFirstRace,
  getNovaFirstRacePhase,
} from '../story/NovaFirstRaceStory';
import { createNovaIdentitySprite } from '../visual/NovaIdentity';
import { getRememberedRainbowMeadowPlayerPosition } from '../world/RainbowMeadowReturnPoint';
import { RAINBOW_MEADOW_MAP, setRainbowMeadowPlayerSpawn } from '../world/RainbowMeadowMap';

interface NovaStorySceneData {
  returnScene?: string;
}

interface RaceDecisionTarget {
  sceneKey: string;
  payload?: object;
}

export class NovaStoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private raceDecision: Phaser.GameObjects.Container | null = null;
  private raceDecisionYes: Phaser.GameObjects.Zone | null = null;
  private raceDecisionNo: Phaser.GameObjects.Zone | null = null;
  private raceDecisionTarget: RaceDecisionTarget | null = null;
  private returnScene = 'RainbowMeadowScene';
  private shouldNotifyTalk = false;
  private closing = false;

  public constructor() {
    super('NovaStoryScene');
  }

  public create(data: NovaStorySceneData): void {
    this.returnScene = data.returnScene ?? 'RainbowMeadowScene';
    this.shouldNotifyTalk = false;
    this.closing = false;
    this.raceDecision = null;
    this.raceDecisionYes = null;
    this.raceDecisionNo = null;
    this.raceDecisionTarget = null;
    this.cameras.main.setBackgroundColor('#9edfb3');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xa6dfa0, 1);
    this.add.circle(180, 610, 310, 0x79c58d, 0.42);
    this.add.circle(1090, 590, 330, 0x84ce92, 0.4);
    this.add.rectangle(GAME_WIDTH / 2, 592, GAME_WIDTH, 250, 0xead290, 0.64);

    const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    for (let index = 0; index < colours.length; index += 1) {
      this.add
        .triangle(430 + index * 105, 115, 0, 0, 72, 18, 0, 36, colours[index], 0.95)
        .setAngle(index % 2 === 0 ? 3 : -3);
    }

    this.add.circle(GAME_WIDTH / 2, 252, 104, 0xfff0c7, 0.92).setStrokeStyle(6, 0xb97fb6, 1);
    createNovaIdentitySprite(this, GAME_WIDTH / 2, 270).setDisplaySize(190, 134).setDepth(3);
    this.add
      .text(GAME_WIDTH / 2, 374, 'Nova', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e9dd',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.dialogueCard = new DialogueCard(this, this.pointerInput);

    const saveService = getBrowserSaveService();
    const relationships = new RelationshipService(saveService);
    relationships.markMet(NOVA_CHARACTER_ID);

    const questEngine = getBrowserQuestEngine();
    let progress = questEngine.getProgress(NOVA_FIRST_RACE_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = questEngine.startQuest(NOVA_FIRST_RACE_QUEST_ID);
    }

    const phase = getNovaFirstRacePhase(progress);
    let dialogueId: DialogueId;
    if (phase === 'invitation') {
      dialogueId = 'dialogue:nova-first-race-intro';
      this.shouldNotifyTalk = true;
    } else if (phase === 'ready-to-race') {
      dialogueId = 'dialogue:nova-first-race-reminder';
    } else if (phase === 'result-ready') {
      const save = saveService.load() ?? saveService.createNewGame();
      dialogueId = didWinNovaFirstRace(save)
        ? 'dialogue:nova-first-race-result-win'
        : 'dialogue:nova-first-race-result-finish';
      this.shouldNotifyTalk = true;
    } else {
      dialogueId = 'dialogue:nova-first-race-followup';
    }

    this.dialogueSession = new DialogueSession(dialogueRegistry.get(dialogueId));
    this.refreshDialogue();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.dialogueCard?.destroy();
      this.dialogueCard = null;
      this.dialogueSession = null;
      this.destroyRaceDecision();
    });
  }

  public update(): void {
    this.inputController?.update();
    if (!this.inputController) {
      return;
    }

    if (this.raceDecision) {
      if (this.inputController.justPressed('INTERACT')) {
        this.startRaceFromDecision();
      } else if (this.inputController.justPressed('BACK')) {
        this.returnToExploration();
      }
      return;
    }

    if (!this.dialogueSession) {
      return;
    }

    if (this.inputController.justPressed('BACK')) {
      this.closeStory(false);
      return;
    }

    if (!this.inputController.justPressed('INTERACT')) {
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (node?.type === 'line') {
      this.dialogueSession.advanceLine();
      this.refreshDialogue();
      return;
    }

    const choice = this.dialogueSession.getDefaultChoice();
    if (choice) {
      this.selectChoice(choice);
    }
  }

  private selectChoice(choice: DialogueChoice): void {
    if (!this.dialogueSession) {
      return;
    }

    this.dialogueSession.choose(choice.id);
    this.refreshDialogue();
  }

  private refreshDialogue(): void {
    if (!this.dialogueSession || this.dialogueSession.isComplete()) {
      this.closeStory(true);
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (!node) {
      this.closeStory(false);
      return;
    }

    const speaker = characterRegistry.get(node.speakerId);
    this.dialogueCard?.show(node, speaker.name, (choice) => this.selectChoice(choice));
  }

  private closeStory(completedDialogue: boolean): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    if (completedDialogue && this.shouldNotifyTalk) {
      getBrowserQuestEngine().notifyCharacterTalked(NOVA_CHARACTER_ID);
      this.shouldNotifyTalk = false;
    }
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();

    if (completedDialogue && this.openRaceDecisionIfAvailable()) {
      this.closing = false;
      return;
    }

    this.returnToExploration();
  }

  private openRaceDecisionIfAvailable(): boolean {
    const progress = getBrowserQuestEngine().getProgress(NOVA_FIRST_RACE_QUEST_ID);
    const phase = getNovaFirstRacePhase(progress);
    if (phase !== 'ready-to-race' && phase !== 'complete') {
      return false;
    }

    const copy = resolveRaceEntryPrompt(phase);
    this.raceDecisionTarget = { sceneKey: copy.targetScene, payload: copy.payload };

    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x392f44, 0.28).setOrigin(0);
    const shadow = this.add.rectangle(GAME_WIDTH / 2 + 7, GAME_HEIGHT / 2 + 10, 650, 300, 0x493958, 0.24);
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 640, 290, 0xfff8e8, 0.995)
      .setStrokeStyle(6, 0xb689b8, 1);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 84, 'Do you want to race now?', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const detail = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, copy.detail, {
        color: '#735b80',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        align: 'center',
      })
      .setOrigin(0.5);
    const yesButton = this.add
      .rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 72, 240, 72, 0xffefb7, 1)
      .setStrokeStyle(4, 0xd49acb, 1);
    const yesText = this.add
      .text(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 72, copy.yesLabel, {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const noButton = this.add
      .rectangle(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 72, 220, 72, 0xf1e2fb, 1)
      .setStrokeStyle(4, 0xb895c8, 1);
    const noText = this.add
      .text(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 72, 'Not now', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 126, 'Enter / E / Space = yes   •   Esc = not now', {
        color: '#8a748f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5);

    this.raceDecision = this.add
      .container(0, 0, [shade, shadow, panel, title, detail, yesButton, yesText, noButton, noText, hint])
      .setName('nova-race-decision')
      .setScrollFactor(0)
      .setDepth(230);
    this.raceDecisionYes = this.add
      .zone(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 72, 250, 84)
      .setName('nova-race-decision-yes')
      .setScrollFactor(0)
      .setDepth(240)
      .setInteractive({ useHandCursor: true });
    this.raceDecisionNo = this.add
      .zone(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 72, 230, 84)
      .setName('nova-race-decision-no')
      .setScrollFactor(0)
      .setDepth(240)
      .setInteractive({ useHandCursor: true });
    this.raceDecisionYes.on('pointerdown', () => this.startRaceFromDecision());
    this.raceDecisionNo.on('pointerdown', () => this.returnToExploration());
    return true;
  }

  private startRaceFromDecision(): void {
    const target = this.raceDecisionTarget;
    if (!target) {
      this.returnToExploration();
      return;
    }

    this.destroyRaceDecision();
    this.scene.start(target.sceneKey, target.payload);
  }

  private returnToExploration(): void {
    this.destroyRaceDecision();

    if (this.returnScene === 'RainbowMeadowScene') {
      const remembered = getRememberedRainbowMeadowPlayerPosition();
      if (remembered) {
        setRainbowMeadowPlayerSpawn(remembered);
      } else {
        const nova = RAINBOW_MEADOW_MAP.npcMarkers.find((marker) => marker.id === 'nova');
        if (nova) {
          setRainbowMeadowPlayerSpawn({ x: nova.position.x - 185, y: nova.position.y + 35 });
        }
      }
    }

    this.scene.start(this.returnScene);
  }

  private destroyRaceDecision(): void {
    this.raceDecisionYes?.destroy();
    this.raceDecisionNo?.destroy();
    this.raceDecision?.destroy(true);
    this.raceDecisionYes = null;
    this.raceDecisionNo = null;
    this.raceDecision = null;
    this.raceDecisionTarget = null;
  }
}
