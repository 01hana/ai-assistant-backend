import { Module } from '@nestjs/common';
import { HostIntegrationRequestFactory } from './host-integration-request.factory';
import { PageContextNormalizerService } from './page-context-normalizer.service';

@Module({
  providers: [PageContextNormalizerService, HostIntegrationRequestFactory],
  exports: [HostIntegrationRequestFactory, PageContextNormalizerService]
})
export class HostIntegrationModule {}
