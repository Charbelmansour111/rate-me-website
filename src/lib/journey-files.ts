import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { frameUrl, type Sequence } from '@/config/journey.config';

/** Whether every frame of a sequence is in public/. Looked up when the pages are built. */
export const hasFrames = (sequence: Sequence) =>
  Array.from({ length: sequence.count }, (_, i) => frameUrl(sequence, i)).every((url) =>
    existsSync(join(process.cwd(), 'public', url)),
  );
