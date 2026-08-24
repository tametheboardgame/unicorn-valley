import type { PlayerFacing } from '../player/PlayerMovement';

const arrivalFacingByScene = new Map<string, PlayerFacing>();

export function isPlayerFacing(value: unknown): value is PlayerFacing {
  return value === 'up' || value === 'down' || value === 'left' || value === 'right';
}

export function setWorldArrivalFacing(sceneKey: string, facing: PlayerFacing): void {
  arrivalFacingByScene.set(sceneKey, facing);
}

export function consumeWorldArrivalFacing(sceneKey: string): PlayerFacing | null {
  const facing = arrivalFacingByScene.get(sceneKey) ?? null;
  arrivalFacingByScene.delete(sceneKey);
  return facing;
}

export function rememberWorldReturnState(
  sceneKey: string,
  player: { x: number; y: number; getData: (key: string) => unknown },
  setSpawn: (point: { x: number; y: number }) => void,
): void {
  setSpawn({ x: player.x, y: player.y });
  const facing = player.getData('player-facing');
  if (isPlayerFacing(facing)) {
    setWorldArrivalFacing(sceneKey, facing);
  }
}
