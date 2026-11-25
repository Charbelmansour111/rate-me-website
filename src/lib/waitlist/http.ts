import { WaitlistProviderError } from './types';

export type ApiResult = { status: number; body: Record<string, unknown> };

/** JSON over fetch with a timeout. Network problems become a WaitlistProviderError. */
export async function callApi(
  provider: string,
  url: string,
  init: { method: string; headers: Record<string, string>; body?: unknown },
): Promise<ApiResult> {
  try {
    const response = await fetch(url, {
      method: init.method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...init.headers,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const text = await response.text();
    let body: Record<string, unknown> = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      // Not JSON: the status is all we need.
    }
    return { status: response.status, body };
  } catch {
    throw new WaitlistProviderError(`${provider}: network error or timeout`);
  }
}
