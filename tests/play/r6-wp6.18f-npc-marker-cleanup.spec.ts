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
  { id: 'willow', label: 'Willow', x: 1040, y: 1160, prototypeIcon: '🌿' },
  { id: 'marigold', label: 'Marigold', x: 700, y: 860, prototypeIcon: '🥐' },
  { id: 'pebble', label: 'Pebble', x: 1900, y: 1210, prototypeIcon: '✦' },
] as const;

test('production NPC art does not retain prototype circle markers', async ({ page }) => {
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
    expect(prototypeCircle, `missing original marker fixture for ${npc.label}`).toBeDefined();
    expect(prototypeCircle?.visible, `${npc.label} prototype circle should be hidden`).toBe(false);

    const prototypeIcon = village.objects.find(
      (object) =>
        object.text === npc.prototypeIcon &&
        Math.abs(object.x - npc.x) <= 1 &&
        Math.abs(object.y - npc.y) <= 1,
    );
    expect(prototypeIcon, `missing original icon fixture for ${npc.label}`).toBeDefined();
    expect(prototypeIcon?.visible, `${npc.label} prototype icon should be hidden`).toBe(false);

    expect(
      village.objects.some(
        (object) => object.text === npc.label && Math.abs(object.x - npc.x) <= 1 && object.visible,
      ),
      `${npc.label} name label should remain visible`,
    ).toBe(true);
  }
});
