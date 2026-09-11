import { Injectable } from '@nestjs/common';
import type { RuntimeProfileKind } from '../config/runtime-configuration';

export type SafeConnectorTelemetryEvent = Readonly<{
  event: 'service_auth';
  outcome: 'accepted' | 'rejected';
  routeClass: RuntimeProfileKind;
  durationMs?: number;
}>;

export type SafeConnectorTelemetrySink = (event: SafeConnectorTelemetryEvent) => void;

@Injectable()
export class SafeConnectorTelemetry {
  readonly isOperational = true;

  constructor(private readonly sink: SafeConnectorTelemetrySink = () => undefined) {}

  recordServiceAuthentication(outcome: 'accepted' | 'rejected', routeClass: RuntimeProfileKind, durationMs?: number): void {
    const boundedDuration = Number.isFinite(durationMs) && Number.isInteger(durationMs) && (durationMs as number) >= 0 && (durationMs as number) <= 60_000
      ? durationMs
      : undefined;
    this.sink(Object.freeze({
      event: 'service_auth', outcome, routeClass,
      ...(boundedDuration === undefined ? {} : { durationMs: boundedDuration })
    }));
  }
}
