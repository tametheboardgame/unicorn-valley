import { CRYSTALARIUM_OPENING_DISCOVERY_ID, ECHO_CRYSTAL_SONG_QUEST_ID } from '../../../content/r6CrystalBrookDepthContent';
import { DiscoveryService } from '../../discovery/DiscoveryService';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../../events/GameEventBus';
import { runMiniGameAdventureEffect } from '../MiniGameOutcomeGateway';
import type { MiniGameSession } from '../MiniGameSession';
import { getQuestStepId, type QuestEngine } from '../../quests/QuestEngine';
import type { SaveService } from '../../save/SaveService';
import { getGrottoGateAccess } from './CrystalariumGrottoGate';
import { CRYSTALARIUM_GAME_ID, CRYSTALARIUM_OPENING_VARIANT_ID } from './CrystalariumOpeningRules';

/**
 * The sole adapter permitted to turn an opening-melody victory into world progress.
 * Legacy mini-game callers may omit their session; this NEW story action may not.
 */
export function completeCrystalariumOpening(
  session: MiniGameSession | null,
  saveService: SaveService,
  quests: QuestEngine,
  events: TypedEventBus<GameEventMap> = gameEventBus,
): boolean {
  if (
    !session ||
    session.gameId !== CRYSTALARIUM_GAME_ID ||
    session.variantId !== CRYSTALARIUM_OPENING_VARIANT_ID ||
    session.source !== 'world' ||
    session.sideEffectPolicy !== 'world' ||
    session.returnTarget.sceneKey !== 'CrystalBrookScene' ||
    session.worldContext?.locationId !== 'crystal-brook' ||
    session.worldContext.interactionId !== 'crystal-grotto' ||
    session.worldContext.questContext !== ECHO_CRYSTAL_SONG_QUEST_ID ||
    getGrottoGateAccess(saveService.load()).unlocked
  ) {
    return false;
  }

  const step = quests.getProgress(ECHO_CRYSTAL_SONG_QUEST_ID);
  if (
    step.status !== 'active' ||
    step.currentStepId !== getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 1)
  ) {
    return false;
  }

  return runMiniGameAdventureEffect(session, 'quest', () => {
    // Discovery events advance step 1; step 2 sets the established open flag.
    // The subsequent three-note sequence (indices 3-10) remains unchanged.
    new DiscoveryService(saveService, events).unlockDiscovery(CRYSTALARIUM_OPENING_DISCOVERY_ID);
  });
}
