import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageProvider } from '../storage-provider.interface';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  async save(file: Buffer, filename: string, folder: string): Promise<string> {
    const dir = path.join(UPLOAD_ROOT, folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), file);
    return `/uploads/${folder}/${filename}`;
  }

  async delete(url: string): Promise<void> {
    const relativePath = url.replace('/uploads/', '');
    await fs.rm(path.join(UPLOAD_ROOT, relativePath), { force: true });
  }
}
