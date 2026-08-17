import { createBrowserSaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';

let browserSaveService: SaveService | null = null;

export function getBrowserSaveService(): SaveService {
  browserSaveService ??= new SaveService(createBrowserSaveRepository());
  return browserSaveService;
}
