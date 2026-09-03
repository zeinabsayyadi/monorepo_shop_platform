export interface StorageProvider {
  save(file: Buffer, filename: string, folder: string): Promise<string>;
  delete(url: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
