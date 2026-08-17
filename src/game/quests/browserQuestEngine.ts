import { getBrowserSaveService } from '../save/browserSaveService';
import { QuestEngine } from './QuestEngine';

let browserQuestEngine: QuestEngine | null = null;

export function getBrowserQuestEngine(): QuestEngine {
  browserQuestEngine ??= new QuestEngine(getBrowserSaveService());
  return browserQuestEngine;
}
