import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConnectorBindingService } from './connector-binding.service';

@Injectable()
export class BindingLifecycleManager implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private sweeping = false;

  constructor(private readonly bindings: ConnectorBindingService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.sweep(), 15_000);
    this.timer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.bindings.shutdown();
  }

  private async sweep(): Promise<void> {
    if (this.sweeping) return;
    this.sweeping = true;
    try { await this.bindings.sweepExpired(); } catch { /* fail closed; retry on next bounded pass */ }
    finally { this.sweeping = false; }
  }
}
