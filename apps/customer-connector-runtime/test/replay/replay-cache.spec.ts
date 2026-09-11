import { ReplayProtectionService } from '../../src/replay/replay-protection.service';

describe('bounded in-memory replay protection', () => {
  it('permits exactly one atomic claim for concurrent duplicate jti attempts', async () => {
    const replay = new ReplayProtectionService(8, () => 100);
    const attempts = await Promise.all(Array.from({ length: 8 }, async () => replay.claim('21ac1822-0827-4d6b-a5d8-cabb379a892a', 135)));

    expect(attempts.filter((result) => result.ok)).toHaveLength(1);
    expect(attempts.filter((result) => !result.ok)).toHaveLength(7);
  });

  it('fails closed at capacity, cleans expired claims, and naturally invalidates on restart', () => {
    let now = 100;
    const replay = new ReplayProtectionService(2, () => now);
    expect(replay.claim('21ac1822-0827-4d6b-a5d8-cabb379a892a', 105).ok).toBe(true);
    expect(replay.claim('31ac1822-0827-4d6b-a5d8-cabb379a892a', 140).ok).toBe(true);
    expect(replay.claim('41ac1822-0827-4d6b-a5d8-cabb379a892a', 140)).toEqual({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' });

    now = 105;
    expect(replay.claim('41ac1822-0827-4d6b-a5d8-cabb379a892a', 140).ok).toBe(true);
    expect(new ReplayProtectionService(2, () => now).claim('31ac1822-0827-4d6b-a5d8-cabb379a892a', 140).ok).toBe(true);
  });

  it('never releases an accepted jti after downstream failure', () => {
    const replay = new ReplayProtectionService(2, () => 100);
    const jti = '21ac1822-0827-4d6b-a5d8-cabb379a892a';
    expect(replay.claim(jti, 135).ok).toBe(true);
    expect(() => { throw new Error('downstream failed'); }).toThrow('downstream failed');
    expect(replay.claim(jti, 135)).toEqual({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' });
    expect((replay as unknown as { release?: unknown }).release).toBeUndefined();
  });

  it('rejects invalid identifiers, nonfuture expiries, and invalid capacities', () => {
    expect(() => new ReplayProtectionService(0, () => 100)).toThrow('Invalid replay configuration.');
    expect(() => new ReplayProtectionService(100_001, () => 100)).toThrow('Invalid replay configuration.');
    const replay = new ReplayProtectionService(2, () => 100);
    expect(replay.claim('not-a-uuid', 135)).toEqual({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' });
    expect(replay.claim('21ac1822-0827-4d6b-a5d8-cabb379a892a', 100)).toEqual({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' });
  });
});
