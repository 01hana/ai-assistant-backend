import { Injectable } from '@nestjs/common';

export type ReplayClaimResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; code: 'CONNECTOR_REPLAY_REJECTED' }>;

@Injectable()
export class ReplayProtectionService {
  private readonly claims = new Map<string, number>();

  constructor(
    private readonly maximumEntries: number,
    private readonly nowSeconds: () => number = () => Math.floor(Date.now() / 1000)
  ) {
    if (!Number.isInteger(maximumEntries) || maximumEntries < 1 || maximumEntries > 100_000) {
      throw new Error('Invalid replay configuration.');
    }
  }

  claim(jti: string, retainUntil: number): ReplayClaimResult {
    const now = this.nowSeconds();
    this.cleanup(now);
    if (!uuid(jti) || !Number.isInteger(retainUntil) || retainUntil <= now || this.claims.has(jti) || this.claims.size >= this.maximumEntries) {
      return failure();
    }
    this.claims.set(jti, retainUntil);
    return Object.freeze({ ok: true });
  }

  private cleanup(now: number): void {
    for (const [jti, expiresAt] of this.claims) if (expiresAt <= now) this.claims.delete(jti);
  }
}

function uuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function failure(): ReplayClaimResult { return Object.freeze({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' }); }
