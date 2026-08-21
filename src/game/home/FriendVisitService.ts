import type { DialogueId } from '../../content/contentTypes';
import { dialogueRegistry } from '../../content/registries';
import { R4_FRIEND_VISITS, type FriendVisitDefinition } from '../../content/r4FriendVisits';
import { isDialogueConditionMet } from '../dialogue/DialogueConditions';
import { RelationshipService } from '../relationships/RelationshipService';
import type { SaveService } from '../save/SaveService';
import type { CottageHomeView } from './CottageHomeView';

const RACE_DISPLAY_ITEM_IDS = new Set([
  'item:rainbow-run-finisher-ribbon',
  'item:rainbow-run-podium-rosette',
]);

export interface ResolvedFriendVisit {
  definition: FriendVisitDefinition;
  dialogueId: DialogueId;
}

export class FriendVisitService {
  private readonly relationships: RelationshipService;

  public constructor(private readonly saveService: SaveService) {
    this.relationships = new RelationshipService(saveService);
  }

  public resolveNextVisit(homeView: CottageHomeView): ResolvedFriendVisit | null {
    const context = {
      relationships: this.relationships,
      saveService: this.saveService,
    };
    const visits: readonly FriendVisitDefinition[] = R4_FRIEND_VISITS;

    const definition = [...visits]
      .sort((left, right) => right.priority - left.priority)
      .find((visit) =>
        visit.conditions.every((condition) => isDialogueConditionMet(condition, context)),
      );

    if (!definition) {
      return null;
    }

    const dialogueId = this.shouldUsePersonalisedDialogue(definition, homeView)
      ? (definition.dialogueIds.personalised ?? definition.dialogueIds.default)
      : definition.dialogueIds.default;

    dialogueRegistry.get(dialogueId);
    return { definition, dialogueId };
  }

  public completeVisit(visit: ResolvedFriendVisit): void {
    this.relationships.addFlag(visit.definition.characterId, visit.definition.seenFlag);
  }

  private shouldUsePersonalisedDialogue(
    definition: FriendVisitDefinition,
    homeView: CottageHomeView,
  ): boolean {
    if (definition.characterId === 'character:willow') {
      return homeView.placements.length > 0;
    }

    if (definition.characterId === 'character:nova') {
      return homeView.placements.some((placement) => RACE_DISPLAY_ITEM_IDS.has(placement.itemId));
    }

    return false;
  }
}
