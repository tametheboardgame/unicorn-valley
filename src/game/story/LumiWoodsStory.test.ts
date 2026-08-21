import { describe, expect, it } from 'vitest';
import {
  FIREFLY_SPIRAL_DISCOVERY_ID,
  HUMMING_BARK_DISCOVERY_ID,
  R5_LUMI_SECRETS,
  STARWELL_DISCOVERY_ID,
  STARWELL_REVEALED_FLAG,
} from '../../content/r5LumiWoodsStory';

describe('Lumi Woods discovery story', () => {
  it('requires both observed clues before the Starwell reveal', () => {
    const starwell = R5_LUMI_SECRETS.find(
      ({ discoveryId }) => discoveryId === STARWELL_DISCOVERY_ID,
    );
    expect(starwell?.conditions).toEqual([
      { type: 'discovery', discoveryId: FIREFLY_SPIRAL_DISCOVERY_ID },
      { type: 'discovery', discoveryId: HUMMING_BARK_DISCOVERY_ID },
    ]);
    expect(starwell?.worldFlagId).toBe(STARWELL_REVEALED_FLAG);
  });

  it('keeps the two clues independently discoverable before the reveal', () => {
    const clues = R5_LUMI_SECRETS.filter(({ discoveryId }) =>
      [FIREFLY_SPIRAL_DISCOVERY_ID, HUMMING_BARK_DISCOVERY_ID].includes(discoveryId),
    );
    expect(clues).toHaveLength(2);
    expect(clues.every(({ conditions }) => conditions === undefined)).toBe(true);
  });
});
