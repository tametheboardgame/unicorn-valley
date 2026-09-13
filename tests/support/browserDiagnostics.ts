import type { Page } from '@playwright/test';

export interface DiagnosticObjectSnapshot {
  name: string;
  text?: string | null;
  visible: boolean;
  interactive: boolean;
  x: number;
  y: number;
  displayWidth?: number;
  displayHeight?: number;
  boundsX?: number;
  boundsY?: number;
  boundsWidth?: number;
  boundsHeight?: number;
}

export interface DiagnosticSceneSnapshot {
  key: string;
  objects: DiagnosticObjectSnapshot[];
}

export interface BrowserDiagnosticSnapshot {
  width: number;
  height: number;
  activeScenes: string[];
  scenes: DiagnosticSceneSnapshot[];
}

interface BrowserDiagnosticsApi {
  snapshot(): BrowserDiagnosticSnapshot;
  startScene(sceneKey: string, data?: object): void;
  setArcadeSpritePosition(sceneKey: string, objectName: string, x: number, y: number): void;
}

type DiagnosticWindow = typeof window & {
  __UNICORN_VALLEY_DIAGNOSTICS__?: BrowserDiagnosticsApi;
};

export async function waitForDiagnostics(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__),
  );
}

export async function openDiagnostics(page: Page, url = '/?diagnostics=1'): Promise<void> {
  await page.goto(url);
  await waitForDiagnostics(page);
}

export async function getDiagnosticSnapshot(page: Page): Promise<BrowserDiagnosticSnapshot> {
  return page.evaluate(() => {
    const diagnostics = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__;
    if (!diagnostics) {
      throw new Error('Browser diagnostics are unavailable.');
    }
    return diagnostics.snapshot();
  });
}

export async function waitForScene(page: Page, sceneKey: string): Promise<void> {
  await page.waitForFunction((key) => {
    const diagnostics = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__;
    return diagnostics?.snapshot().activeScenes.includes(key) ?? false;
  }, sceneKey);
}

export async function startScene(page: Page, sceneKey: string, data?: object): Promise<void> {
  await page.evaluate(
    ({ key, sceneData }) => {
      const diagnostics = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.startScene(key, sceneData);
    },
    { key: sceneKey, sceneData: data },
  );
  await waitForScene(page, sceneKey);
}

export async function waitForNamedObject(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<void> {
  await page.waitForFunction(
    ({ key, name }) => {
      const diagnostics = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__;
      const scene = diagnostics?.snapshot().scenes.find((candidate) => candidate.key === key);
      return scene?.objects.some((object) => object.name === name && object.visible) ?? false;
    },
    { key: sceneKey, name: objectName },
  );
}

export async function isNamedObjectVisible(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<boolean> {
  const snapshot = await getDiagnosticSnapshot(page);
  return (
    snapshot.scenes
      .find((scene) => scene.key === sceneKey)
      ?.objects.some((object) => object.name === objectName && object.visible) ?? false
  );
}

export async function clickNamedObject(
  page: Page,
  sceneKey: string,
  objectName: string,
): Promise<void> {
  const snapshot = await getDiagnosticSnapshot(page);
  const object = snapshot.scenes
    .find((scene) => scene.key === sceneKey)
    ?.objects.find(
      (candidate) => candidate.name === objectName && candidate.visible && candidate.interactive,
    );
  if (!object) {
    throw new Error(`Interactive ${sceneKey}/${objectName} is not visible.`);
  }

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) {
    throw new Error('Game canvas has no browser bounds.');
  }
  if (snapshot.width <= 0 || snapshot.height <= 0) {
    throw new Error('Browser diagnostics returned invalid logical canvas dimensions.');
  }

  await page.mouse.click(
    bounds.x + (object.x / snapshot.width) * bounds.width,
    bounds.y + (object.y / snapshot.height) * bounds.height,
  );
}

export async function setArcadeSpritePosition(
  page: Page,
  sceneKey: string,
  objectName: string,
  x: number,
  y: number,
): Promise<void> {
  await page.evaluate(
    ({ key, name, nextX, nextY }) => {
      const diagnostics = (window as DiagnosticWindow).__UNICORN_VALLEY_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error('Browser diagnostics are unavailable.');
      }
      diagnostics.setArcadeSpritePosition(key, name, nextX, nextY);
    },
    { key: sceneKey, name: objectName, nextX: x, nextY: y },
  );
}
