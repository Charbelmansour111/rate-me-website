import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const EXTENSIONS = ['webp', 'jpg', 'png', 'avif'];

/** "/<folder>/<name>.webp" (or .jpg, .png, .avif) when that file is in public/, else null. */
export function publicFile(folder: string, name: string): string | null {
  for (const extension of EXTENSIONS) {
    const file = `${name}.${extension}`;
    if (existsSync(join(process.cwd(), 'public', folder, file))) return `/${folder}/${file}`;
  }
  return null;
}
