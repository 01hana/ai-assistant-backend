import { Module } from '@nestjs/common';
import { RuntimeHealthController } from './runtime-health.controller';
import { RuntimeHealthService } from './runtime-health.service';
import { RuntimeReadinessRegistry, RuntimeReadinessService } from './readiness.service';

@Module({
  controllers: [RuntimeHealthController],
  providers: [RuntimeHealthService, RuntimeReadinessRegistry, RuntimeReadinessService],
  exports: [RuntimeReadinessRegistry, RuntimeReadinessService]
})
export class RuntimeHealthModule {}
