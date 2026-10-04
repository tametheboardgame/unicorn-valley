import { isSceneKey } from '../scenes/SceneKeys';
import type { MiniGameDefinition } from './MiniGameCatalogue';

export type MiniGameCatalogueIssueCode =
  | 'duplicate-id'
  | 'invalid-scene-key'
  | 'missing-just-games-exposure'
  | 'duplicate-variant-id'
  | 'invalid-variant'
  | 'missing-visible-variant';

export interface MiniGameCatalogueIssue {
  code: MiniGameCatalogueIssueCode;
  message: string;
  gameId?: string;
}

export function getMiniGameCatalogueIssues(
  definitions: readonly MiniGameDefinition[],
): MiniGameCatalogueIssue[] {
  const issues: MiniGameCatalogueIssue[] = [];
  const gameIds = new Set<string>();

  for (const definition of definitions) {
    if (gameIds.has(definition.id)) {
      issues.push({
        code: 'duplicate-id',
        gameId: definition.id,
        message: 'Duplicate mini-game id: ' + definition.id,
      });
    }
    gameIds.add(definition.id);

    if (!isSceneKey(definition.sceneKey)) {
      issues.push({
        code: 'invalid-scene-key',
        gameId: definition.id,
        message: 'Unknown SceneKey for mini-game ' + definition.id + ': ' + definition.sceneKey,
      });
    }

    if (!definition.justGames.visible) {
      issues.push({
        code: 'missing-just-games-exposure',
        gameId: definition.id,
        message: 'Mini-game is missing required Just Games exposure: ' + definition.id,
      });
    }

    const variantIds = new Set<string>();
    let visibleVariantCount = 0;
    for (const variant of definition.variants) {
      if (variant.id.trim().length === 0 || variant.title.trim().length === 0) {
        issues.push({
          code: 'invalid-variant',
          gameId: definition.id,
          message: 'Mini-game has a variant with an empty id or title: ' + definition.id,
        });
      }

      if (variantIds.has(variant.id)) {
        issues.push({
          code: 'duplicate-variant-id',
          gameId: definition.id,
          message: 'Duplicate variant id for ' + definition.id + ': ' + variant.id,
        });
      }
      variantIds.add(variant.id);

      if (variant.justGamesVisible) {
        visibleVariantCount += 1;
      }
    }

    if (definition.variants.length > 0 && visibleVariantCount === 0) {
      issues.push({
        code: 'missing-visible-variant',
        gameId: definition.id,
        message: 'Mini-game has variants but none are available to Just Games: ' + definition.id,
      });
    }
  }

  return issues;
}

export function assertMiniGameCatalogueIntegrity(definitions: readonly MiniGameDefinition[]): void {
  const issues = getMiniGameCatalogueIssues(definitions);
  if (issues.length === 0) {
    return;
  }

  throw new Error(
    ['Invalid mini-game catalogue:', ...issues.map((issue) => '- ' + issue.message)].join('\n'),
  );
}
