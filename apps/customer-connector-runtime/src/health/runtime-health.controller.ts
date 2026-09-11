import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { RuntimeHealthService } from './runtime-health.service';

@Controller()
export class RuntimeHealthController {
  constructor(private readonly health: RuntimeHealthService) {}

  @Get('health')
  getHealth() { return this.health.getHealth(); }

  @Get('ready')
  getReadiness() {
    const readiness = this.health.getReadiness();
    if (!readiness.productionReady) throw new ServiceUnavailableException(readiness);
    return readiness;
  }
}
