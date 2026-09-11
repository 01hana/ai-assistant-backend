import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');

describe('Shared connector contract dependency isolation', () => {
  it('has no runtime or development dependency', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies?: object; devDependencies?: object; peerDependencies?: object; optionalDependencies?: object;
    };
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.devDependencies).toBeUndefined();
    expect(manifest.peerDependencies).toBeUndefined();
    expect(manifest.optionalDependencies).toBeUndefined();
  });

  it('contains no framework, persistence, Assistant-runtime, predecessor, or integration import', () => {
    const source = readTree(join(root, 'src'));
    expect(source).not.toMatch(/from\s+['"](?:@nestjs|@prisma|prisma|@internal-ai-assistant\/internal-identity-contract)/i);
    expect(source).not.toMatch(/(?:apps\/|src\/(?:assistant|connectors|tools)|integrations\/)/i);
  });

  it('contains no reference-integration or identity-product assumption', () => {
    const source = readTree(join(root, 'src'));
    expect(source).not.toMatch(/shinmone|menudetail|acceptedentry|nativeaccesstoken|feature[ -]?007|identity[ -]?bridge|bearer|jwt[_ -]?exp|dashboard\/kpistats|neworders|x-inventory-key/i);
  });
});

function readTree(directory: string): string {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? [readTree(path)] : entry.name.endsWith('.ts') ? [readFileSync(path, 'utf8')] : [];
  }).join('\n');
}
