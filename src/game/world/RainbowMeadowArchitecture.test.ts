import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativeUrl: string): string {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}

describe('H4.11 Rainbow Meadow architecture ownership', () => {
  it('keeps generic compatibility managers free of Meadow composition ownership', () => {
    const traversal = source('./WorldTraversalPolishManager.ts');
    const geometry = source('./ExplorationGeometryPresentationManager.ts');
    const environment = source('../visual/EnvironmentProductionPresentationManager.ts');
    const tightening = source('../visual/VisualTighteningManager.ts');

    expect(traversal).not.toContain("'RainbowMeadowScene'");
    expect(traversal).not.toContain('RAINBOW_MEADOW_LAYOUT');
    expect(traversal).not.toContain('RAINBOW_MEADOW_MAP');

    expect(geometry).not.toContain("'RainbowMeadowScene'");

    expect(environment).not.toContain("'rainbow-meadow'");
    expect(environment).not.toContain('RAINBOW_MEADOW_LAYOUT');

    expect(tightening).not.toContain("'RainbowMeadowScene'");
    expect(tightening).not.toContain('RAINBOW_MEADOW_LAYOUT');
  });

  it('keeps traversal presentation and routing explicitly Meadow-owned', () => {
    const scene = source('../scenes/RainbowMeadowScene.ts');

    expect(scene).toContain('createRainbowMeadowTraversalPresentation');
    expect(scene).toContain('resolveRainbowMeadowWalkThroughDestination');
    expect(scene).toContain("this.scene.start('SunbeamVillageScene')");
    expect(scene).toContain("this.scene.start('RainbowRunEntryScene')");
  });
});
