import { decodeJwt, decodeProtectedHeader, importJWK, type JWK, type KeyLike } from 'jose';
import type {
  RuntimeProfileKind,
  RuntimeServiceProfileConfiguration,
  RuntimeVerificationKeyConfiguration
} from '../config/runtime-configuration';

export type ResolvedVerificationProfile = Readonly<{
  profile: RuntimeServiceProfileConfiguration;
  key: RuntimeVerificationKeyConfiguration & Readonly<{ publicJwk: Readonly<Record<string, unknown>> }>;
  verificationKey: KeyLike | Uint8Array;
}>;

export class RuntimeServiceProfileRegistry {
  private readonly profiles: readonly RuntimeServiceProfileConfiguration[];

  constructor(profiles: readonly RuntimeServiceProfileConfiguration[]) {
    this.profiles = Object.freeze([...profiles]);
  }

  async validate(): Promise<boolean> {
    try {
      if (!this.profiles.some((profile) => profile.kind === 'central-invocation') ||
          !this.profiles.some((profile) => profile.kind === 'binding-bootstrap')) return false;
      for (const profile of this.profiles) {
        for (const key of profile.keys) {
          if (key.status === 'retired') continue;
          if (!key.publicJwk) return false;
          await importJWK(key.publicJwk as unknown as JWK, 'RS256');
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async resolve(kind: RuntimeProfileKind, compactJwt: string, expectedProfileKey?: string): Promise<ResolvedVerificationProfile | undefined> {
    try {
      const header = decodeProtectedHeader(compactJwt);
      const claims = decodeJwt(compactJwt);
      if (header.alg !== 'RS256' || typeof header.kid !== 'string' || typeof header.typ !== 'string') return undefined;
      const candidates = this.profiles.filter((profile) =>
        profile.kind === kind && profile.typ === header.typ &&
        (expectedProfileKey === undefined || profile.profileKey === expectedProfileKey) &&
        profile.issuer === claims.iss && profile.subject === claims.sub && profile.audience === claims.aud
      );
      if (candidates.length !== 1) return undefined;
      const profile = candidates[0]!;
      const key = profile.keys.find((candidate) => candidate.kid === header.kid);
      if (!key || key.status === 'retired' || !key.publicJwk) return undefined;
      const verificationKey = await importJWK(key.publicJwk as unknown as JWK, 'RS256');
      return Object.freeze({ profile, key: key as ResolvedVerificationProfile['key'], verificationKey });
    } catch {
      return undefined;
    }
  }
}
