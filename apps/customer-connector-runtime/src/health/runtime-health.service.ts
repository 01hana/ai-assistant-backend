import { Injectable } from '@nestjs/common';
import { RuntimeReadinessService } from './readiness.service';

@Injectable()
export class RuntimeHealthService {
  constructor(private readonly readiness: RuntimeReadinessService) {}

  getHealth(): Readonly<{ status: 'healthy'; service: 'customer-connector-runtime'; timestamp: string }> {
    return Object.freeze({ status: 'healthy', service: 'customer-connector-runtime', timestamp: new Date().toISOString() });
  }

  getReadiness() { return this.readiness.getPublicReadiness(); }
}
