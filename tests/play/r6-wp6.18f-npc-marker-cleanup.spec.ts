import { expect, test, type Page } from '@playwright/test';

interface DiagnosticObject {
  type: string;
  name: string;
  text: string | null;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  visible: boolean;
}

interface DiagnosticScene {
  key: string;
  objects: DiagnosticObject[];
}

interface DiagnosticSnapshot {
  activeScenes: string[];
  scenes: DiagnosticScene[];
}

interface BrowserDiagnosticsApi {
  snapshot(): DiagnosticSnapshot;
}

async function snapshot(page: Page): Promise<DiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const value = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__?.snapshot();
    if (!value) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return value;
  });
}

function villageFrom(value: DiagnosticSnapshot): DiagnosticScene {
  const scene = value.scenes.find((candidate) => candidate.key === 'SunbeamVillageScene');
  if (!scene) {
    throw new Error('Missing Sunbeam Village diagnostics.');
  }
  return scene;
}

const productionNpcs = [
  { id: 'willow', label: 'Willow', x: 680, y: 1290, prototypeIcon: '🌿' },
  { id: 'marigold', label: 'Marigold', x: 1080, y: 920, prototypeIcon: '🥐' },
  { id: 'pebble', label: 'Pebble', x: 2140, y: 1300, prototypeIcon: '✦' },
] as const;

test('production NPC art no longer carries legacy village marker fixtures or name labels', async ({ page }) => {
  await page.goto('/?scene=village&diagnostics=1');

  await page.waitForFunction(() => {
    const diagnosticWindow = window as typeof window & {
      __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
    };
    const village = diagnosticWindow.__UNICORN_VALLEY_DIAGNOSTICS__
      ?.snapshot()
      .scenes.find((scene) => scene.key === 'SunbeamVillageScene');
    if (!village) {
      return false;
    }
    return ['willow', 'marigold', 'pebble'].every((id) =>
      village.objects.some((object) => object.name === `core-npc:${id}:world` && object.visible),
    );
  });

  const village = villageFrom(await snapshot(page));

  for (const npc of productionNpcs) {
    expect(
      village.objects.some(
        (object) => object.name === `core-npc:${npc.id}:world` && object.visible,
      ),
    ).toBe(true);

    const prototypeCircle = village.objects.find(
      (object) =>
        object.type === 'Arc' &&
        Math.abs(object.x - npc.x) <= 1 &&
        Math.abs(object.y - npc.y) <= 1 &&
        object.displayWidth <= 90 &&
        object.displayHeight <= 90,
    );
    expect(prototypeCircle, `${npc.label} prototype circle should be retired`).toBeUndefined();

    const prototypeIcon = village.objects.find(
      (object) =>
        object.text === npc.prototypeIcon &&
        Math.abs(object.x - npc.x) <= 1 &&
        Math.abs(object.y - npc.y) <= 1,
    );
    expect(prototypeIcon, `${npc.label} prototype icon should be retired`).toBeUndefined();

    expect(
      village.objects.some(
        (object) => object.name === `village-npc-label:${npc.id}` && object.visible,
      ),
      `${npc.label} should not have a persistent world-space name label`,
    ).toBe(false);
  }
});
