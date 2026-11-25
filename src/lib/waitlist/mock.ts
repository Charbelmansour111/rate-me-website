import type { WaitlistEntry, WaitlistProvider } from './types';

/** Local development and tests: keeps signups in memory and sends nothing anywhere. */
export class MockProvider implements WaitlistProvider {
  readonly entries: WaitlistEntry[] = [];

  async subscribe(entry: WaitlistEntry): Promise<void> {
    if (!this.entries.some((known) => known.email === entry.email)) this.entries.push(entry);
  }
}
