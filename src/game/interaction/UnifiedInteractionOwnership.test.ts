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
});
