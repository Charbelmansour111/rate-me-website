import { RateLimiter } from '@/lib/rate-limit';
import { handlePreRegister } from '@/lib/waitlist/handler';
import { getWaitlistProvider } from '@/lib/waitlist/provider';

/** Room for a whole club on one mobile IP (Lebanese carriers share them), not for a script. */
const limiter = new RateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 });

export function POST(request: Request) {
  return handlePreRegister(request, { getProvider: getWaitlistProvider, limiter });
}
