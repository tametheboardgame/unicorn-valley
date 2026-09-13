const PRELOAD_ERROR_EVENT = 'vite:preloadError';
const RECOVERY_STORAGE_KEY = 'unicorn-valley:last-preload-recovery';
const RECOVERY_COOLDOWN_MS = 10_000;

export function shouldReloadForPreloadError(
  lastRecoveryTimestamp: number | null,
  currentTimestamp: number,
): boolean {
  if (lastRecoveryTimestamp === null || !Number.isFinite(lastRecoveryTimestamp)) {
    return true;
  }
  return currentTimestamp - lastRecoveryTimestamp >= RECOVERY_COOLDOWN_MS;
}

function readLastRecovery(storage: Storage): number | null {
  try {
    const value = storage.getItem(RECOVERY_STORAGE_KEY);
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
}

function writeLastRecovery(storage: Storage, timestamp: number): void {
  try {
    storage.setItem(RECOVERY_STORAGE_KEY, String(timestamp));
  } catch {
    // A blocked sessionStorage must not prevent recovery from a stale deployment.
  }
}

export function installDynamicImportRecovery(target: Window = window): () => void {
  const handlePreloadError = (event: Event): void => {
    event.preventDefault();
    const currentTimestamp = Date.now();
    const lastRecoveryTimestamp = readLastRecovery(target.sessionStorage);
    if (!shouldReloadForPreloadError(lastRecoveryTimestamp, currentTimestamp)) {
      return;
    }

    writeLastRecovery(target.sessionStorage, currentTimestamp);
    target.location.reload();
  };

  target.addEventListener(PRELOAD_ERROR_EVENT, handlePreloadError);
  return () => target.removeEventListener(PRELOAD_ERROR_EVENT, handlePreloadError);
}
