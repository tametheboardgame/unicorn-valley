from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    if old not in text:
        raise SystemExit(f"Expected patch text missing in {path}: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1))


replace(
    "src/game/world/R5RegionGatewayManager.ts",
    """          priority: 25,
          visible: () => state.container.active,
""",
    """          priority: 25,
          directArea: {
            width: 360,
            height: 360,
            offsetY: 55,
            name: 'r6-wp6.18ij:crystal-cascade-tap-target',
          },
          visible: () => state.container.active,
""",
)

replace(
    "src/game/world/R6FinalPlaythroughCleanupManager.ts",
    """    const isR5FunctionalGateway = object.list.some(
      (child) => child instanceof Phaser.GameObjects.Zone,
    );
    if (!isR5FunctionalGateway) {
      continue;
    }

""",
    "",
)

replace(
    "tests/play/r6-wp6.6-touch-accessibility.spec.ts",
    """        object.text?.includes('Tap the path'),
    ),
  ).toBe(true);
""",
    """        object.text?.includes('Tap the path'),
    ),
  ).toBe(false);
""",
)

replace(
    "tests/play/r6.5-wp18i-concept-ui.spec.ts",
    "expect(hint.visible).toBe(true);",
    "expect(hint.visible).toBe(false);",
)
replace(
    "tests/play/r6.5-wp18i-concept-ui.spec.ts",
    "expect(objectByName(scene, 'exploration-tablet-hint').text).toContain('Tap Talk');",
    "expect(objectByName(scene, 'exploration-tablet-hint').text).toBe('Pip');",
)
replace(
    "tests/play/r6.5-wp18i-concept-ui.spec.ts",
    "expect(objectByName(scene, 'exploration-tablet-hint').text).toContain('Tap Enter');",
    "expect(objectByName(scene, 'exploration-tablet-hint').text).toBe('Moonflower Cottage');",
)

replace(
    "tests/play/r6.5-wp11-existing-valley-quest-pack.spec.ts",
    """interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
}
""",
    """interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}
""",
)
replace(
    "tests/play/r6.5-wp11-existing-valley-quest-pack.spec.ts",
    """  expect(oddStone?.visible).toBe(true);
  expect(oddStone?.interactive).toBe(true);
});
""",
    """  expect(oddStone?.visible).toBe(true);
  expect(oddStone?.interactive).toBe(false);

  await page.evaluate(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    diagnostics?.setArcadeSpritePosition(
      'CrystalBrookScene',
      'world-player-unicorn',
      1370,
      1470,
    );
  });
  await page.waitForFunction(() => {
    const diagnostics = (
      window as typeof window & { __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi }
    ).__UNICORN_VALLEY_DIAGNOSTICS__;
    const brook = diagnostics?.snapshot().scenes.find(({ key }) => key === 'CrystalBrookScene');
    return (
      brook?.objects.some(
        ({ name, visible, interactive }) =>
          name === 'interaction-direct-zone:interaction:quest-pack:odd-stone-bank' &&
          visible &&
          interactive,
      ) ?? false
    );
  });
});
""",
)
