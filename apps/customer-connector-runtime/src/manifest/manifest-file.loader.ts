import { lstatSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import {
  parseConnectorOperationManifestV1,
  type ConnectorOperationManifestV1
} from '@internal-ai-assistant/connector-runtime-contract';

export type ManifestLoadResult =
  | Readonly<{ ok: true; value: readonly ConnectorOperationManifestV1[] }>
  | Readonly<{ ok: false; code: 'CONNECTOR_UNAVAILABLE' }>;

export interface ManifestFileAccess {
  inspect(path: string): Readonly<{ regular: boolean; symbolicLink: boolean; mode: number }>;
  read(path: string): string;
}

const NODE_FILE_ACCESS: ManifestFileAccess = Object.freeze({
  inspect(path: string) {
    const stat = lstatSync(path);
    return Object.freeze({ regular: stat.isFile(), symbolicLink: stat.isSymbolicLink(), mode: stat.mode });
  },
  read(path: string) { return readFileSync(path, 'utf8'); }
});

export class ManifestFileLoader {
  constructor(private readonly files: ManifestFileAccess = NODE_FILE_ACCESS) {}

  load(paths: readonly string[]): ManifestLoadResult {
    try {
      if (!Array.isArray(paths) || paths.length < 1 || paths.some((path) => typeof path !== 'string' || !isAbsolute(path))) return failure();
      const manifests: ConnectorOperationManifestV1[] = [];
      const sourcePaths = new Set<string>();
      const identities = new Set<string>();
      for (const path of paths) {
        if (sourcePaths.has(path)) return failure();
        sourcePaths.add(path);
        const stat = this.files.inspect(path);
        if (!stat.regular || stat.symbolicLink || (stat.mode & 0o222) !== 0) return failure();
        const parsedJson: unknown = JSON.parse(this.files.read(path));
        const parsed = parseConnectorOperationManifestV1(parsedJson);
        if (!parsed.ok) return failure();
        for (const operation of parsed.value.operations) {
          const identity = `${parsed.value.connectorKey}\0${operation.operationKey}\0${operation.contractVersion}`;
          if (identities.has(identity)) return failure();
          identities.add(identity);
        }
        manifests.push(parsed.value);
      }
      return Object.freeze({ ok: true, value: deepFreeze(manifests) });
    } catch {
      return failure();
    }
  }
}

function failure(): ManifestLoadResult {
  return Object.freeze({ ok: false, code: 'CONNECTOR_UNAVAILABLE' });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
}
