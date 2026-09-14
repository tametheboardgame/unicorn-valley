import { createBrowserSaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import type { SaveGame } from './saveSchema';

class BrowserSaveService extends SaveService {
  public override load(): SaveGame | null {
    const result = this.loadWithResult();
    return result.status === 'loaded' ? result.save : null;
  }
}

let browserSaveService: SaveService | null = null;

export function getBrowserSaveService(): SaveService {
  browserSaveService ??= new BrowserSaveService(createBrowserSaveRepository());
  return browserSaveService;
}
