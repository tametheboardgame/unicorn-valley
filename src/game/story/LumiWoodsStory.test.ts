import { describe, expect, it } from 'vitest';
import {
  FIREFLY_SPIRAL_DISCOVERY_ID,
  HUMMING_BARK_DISCOVERY_ID,
  R5_LUMI_SECRETS,
  STARWELL_DISCOVERY_ID,
  STARWELL_REVEALED_FLAG,
} from '../../content/r5LumiWoodsStory';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';

describe('Lumi Woods discovery story', () => {
  const secrets: readonly SecretDiscoveryDefinition[] = R5_LUMI_SECRETS;

  it('requires both observed clues before the Starwell reveal', () => {
    const starwell = secrets.find(({ discoveryId }) => discoveryId === STARWELL_DISCOVERY_ID);
    expect(starwell?.conditions).toEqual([
      { type: 'discovery', discoveryId: FIREFLY_SPIRAL_DISCOVERY_ID },
      { type: 'discovery', discoveryId: HUMMING_BARK_DISCOVERY_ID },
    ]);
    expect(starwell?.worldFlagId).toBe(STARWELL_REVEALED_FLAG);
  });

  it('keeps the two clues independently discoverable before the reveal', () => {
    const clueIds = new Set([FIREFLY_SPIRAL_DISCOVERY_ID, HUMMING_BARK_DISCOVERY_ID]);
    const clues = secrets.filter(({ discoveryId }) => clueIds.has(discoveryId));
    expect(clues).toHaveLength(2);
    expect(clues.every(({ conditions }) => conditions === undefined)).toBe(true);
  });
});
