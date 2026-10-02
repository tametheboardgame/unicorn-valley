import { describe, expect, it } from 'vitest';
import {
  getNovaPresentationTextureKey,
  NOVA_APPEARANCE,
  NOVA_PALETTE,
  NOVA_PRESENTATION_TEXTURE_PREFIX,
  NOVA_WORLD_DISPLAY,
} from './NovaPresentation';

describe('NovaPresentation', () => {
  it('defines Nova in the shared modern unicorn appearance language', () => {
    expect(NOVA_APPEARANCE).toEqual({
      bodyColour: 'pink',
      eyeColour: 'blue',
      maneStyle: 'swept',
      maneColour: 'ice',
      tailStyle: 'plume',
      tailColour: 'lilac',
      hornStyle: 'star',
      marking: 'star',
      accessory: 'ribbon',
    });
    expect(NOVA_PALETTE.body).toBe(0xf08bc8);
    expect(NOVA_PALETTE.mane).toBe(0x69bde3);
    expect(NOVA_PALETTE.tail).toBe(0x8b75d2);
  });

  it('uses one Nova texture family across idle and racing poses', () => {
    expect(NOVA_PRESENTATION_TEXTURE_PREFIX).toBe('nova-modern');
    expect(getNovaPresentationTextureKey('idle')).toBe('nova-modern:idle');
    expect(getNovaPresentationTextureKey('gallop-a')).toBe('nova-modern:gallop-a');
    expect(NOVA_WORLD_DISPLAY.width).toBeGreaterThan(NOVA_WORLD_DISPLAY.height);
    expect(NOVA_WORLD_DISPLAY.height).toBeGreaterThan(100);
  });
});
