import { generateKeyPairSync, type KeyObject } from 'node:crypto';
import { SignJWT } from 'jose';
import type { RuntimeServiceProfileConfiguration, RuntimeVerificationKeyConfiguration } from '../../src/config/runtime-configuration';
import { RuntimeServiceProfileRegistry } from '../../src/service-auth/service-profile.registry';
import { ConnectorServiceProofVerifier } from '../../src/service-auth/service-proof.verifier';
import { centralClaims, serviceProofFixtureSet, signServiceProof } from '../fixtures/service-proof-fixtures';

describe('service-proof freshness and verification-key lifecycle', () => {
  it('accepts the exact five-second tolerance interval and rejects early or expired proofs', async () => {
    const profiles = serviceProofFixtureSet();
    const token = await signServiceProof(profiles.central);
    for (const acceptedNow of [1_799_999_995, 1_800_000_000, 1_800_000_034]) {
      await expect(verifier(profiles.central.config, acceptedNow).verify('central-invocation', token)).resolves.toMatchObject({ ok: true });
    }
    for (const rejectedNow of [1_799_999_994, 1_800_000_035]) {
      await expect(verifier(profiles.central.config, rejectedNow).verify('central-invocation', token)).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
    }
  });

  it('accepts published, active, and retiring keys while rejecting retired and unknown kids', async () => {
    const base = serviceProofFixtureSet().central;
    const published = key('published-key', 'published');
    const retiring = key('retiring-key', 'retiring');
    const retired = key('retired-key', 'retired');
    const profile: RuntimeServiceProfileConfiguration = Object.freeze({
      ...base.config,
      keys: Object.freeze([published.config, base.config.keys[0]!, retiring.config, Object.freeze({ kid: retired.config.kid, status: 'retired' as const })])
    });
    const target = verifier(profile, 1_800_000_010);

    await expect(target.verify('central-invocation', await signed(profile, published.privateKey, published.config.kid))).resolves.toMatchObject({ ok: true });
    await expect(target.verify('central-invocation', await signed(profile, base.privateKey, base.config.keys[0]!.kid))).resolves.toMatchObject({ ok: true });
    await expect(target.verify('central-invocation', await signed(profile, retiring.privateKey, retiring.config.kid))).resolves.toMatchObject({ ok: true });
    await expect(target.verify('central-invocation', await signed(profile, retired.privateKey, retired.config.kid))).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
    await expect(target.verify('central-invocation', await signed(profile, retired.privateKey, 'unknown-key'))).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
  });
});

function verifier(profile: RuntimeServiceProfileConfiguration, now: number) {
  return new ConnectorServiceProofVerifier(new RuntimeServiceProfileRegistry([profile]), () => now);
}

function key(kid: string, status: Exclude<RuntimeVerificationKeyConfiguration['status'], 'active'>) {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = pair.publicKey.export({ format: 'jwk' });
  return {
    privateKey: pair.privateKey,
    config: Object.freeze({ kid, status, publicJwk: Object.freeze({ ...jwk, kid, alg: 'RS256', use: 'sig' }) }) as RuntimeVerificationKeyConfiguration
  };
}

async function signed(profile: RuntimeServiceProfileConfiguration, privateKey: KeyObject, kid: string) {
  return new SignJWT(centralClaims(profile))
    .setProtectedHeader({ alg: 'RS256', kid, typ: profile.typ })
    .sign(privateKey);
}
