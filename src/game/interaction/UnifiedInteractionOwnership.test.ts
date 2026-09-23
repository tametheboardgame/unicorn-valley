import { describe, expect, it } from 'vitest';

const productionSources = import.meta.glob<string>('../**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function productionEntries(): Array<[string, string]> {
  return Object.entries(productionSources).filter(
    ([path]) => !path.endsWith('.test.ts') && !path.endsWith('/WorldInteractionInput.ts'),
  );
}

describe('WP19D unified interaction ownership', () => {
  it('does not render the legacy world interaction prompt from production providers', () => {
    const offenders = productionEntries()
      .filter(([, source]) => source.includes('WORLD_INTERACTION_PROMPT'))
      .map(([path]) => path);

    expect(offenders, `Legacy prompt references: ${offenders.join(', ')}`).toEqual([]);
  });

  it('does not construct independent WorldInteractionInput handlers in production providers', () => {
    const offenders = productionEntries()
      .filter(([, source]) => source.includes('new WorldInteractionInput('))
      .map(([path]) => path);

    expect(offenders, `Legacy input owners: ${offenders.join(', ')}`).toEqual([]);
  });

  it('makes Sunbeam registry-owned with no legacy scene, bridge or traversal interaction owner', () => {
    const scene = Object.entries(productionSources).find(([path]) =>
      path.endsWith('/SunbeamVillageScene.ts'),
    )?.[1];
    const sunbeam = Object.entries(productionSources).find(([path]) =>
      path.endsWith('/SunbeamVillageInteractions.ts'),
    )?.[1];
    const bridge = Object.entries(productionSources).find(([path]) =>
      path.endsWith('/CoreSceneInteractionBridge.ts'),
    )?.[1];
    const traversal = Object.entries(productionSources).find(([path]) =>
      path.endsWith('/WorldTraversalPolishManager.ts'),
    )?.[1];

    expect(scene).toBeDefined();
    expect(sunbeam).toBeDefined();
    expect(bridge).toBeDefined();
    expect(traversal).toBeDefined();
    expect(scene).toContain('registerSunbeamVillageInteractions(this)');
    expect(scene).not.toContain('VILLAGE_INTERACTIONS');
    expect(scene).not.toContain('new InteractionPrompt(');
    expect(scene).not.toContain('activeInteraction');
    expect(scene).not.toContain('activateInteraction(');
    expect(bridge).not.toContain("this.syncScene('SunbeamVillageScene'");
    expect(bridge).not.toContain('villageTargets(');
    expect(traversal).not.toContain("key === 'SunbeamVillageScene'");
    expect(traversal).not.toContain('transitionFromVillage(');
  });

  it('routes Pebble Talk and hidden-object pickups through the shared interaction owners', () => {
    const sunbeam = Object.entries(productionSources).find(([path]) =>
      path.endsWith('/SunbeamVillageInteractions.ts'),
    )?.[1];
    const pebbleWorld = Object.entries(productionSources).find(([path]) =>
      path.endsWith('/PebbleCollectionWorldManager.ts'),
    )?.[1];

    expect(sunbeam).toBeDefined();
    expect(pebbleWorld).toBeDefined();
    expect(sunbeam).toContain("id: 'interaction:village-pebble'");
    expect(sunbeam).toContain('startPebbleConversation(scene)');
    expect(pebbleWorld).toContain('getSceneInteractionRegistry');
    expect(pebbleWorld).toContain("actionKind: 'pick-up'");
    expect(pebbleWorld).not.toContain('addKey(');
    expect(pebbleWorld).not.toContain('JustDown(');
    expect(pebbleWorld).not.toContain('.zone(');
    expect(pebbleWorld).not.toContain('Talk: Pebble');
    expect(pebbleWorld).not.toContain('pebble-discovery-feedback');
  });
});
