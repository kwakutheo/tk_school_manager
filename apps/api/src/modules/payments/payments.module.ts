import { forwardRef, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FinanceModule } from '../finance/finance.module';
import { PaymentsService } from './payments.service';
import { HubtelProvider } from './providers/hubtel/hubtel.provider';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PaystackProvider } from './providers/paystack/paystack.provider';
import { PaymentWebhookController } from './webhooks/payment-webhook.controller';
import { PaymentWebhookService } from './webhooks/payment-webhook.service';

/**
 * Payments module orchestrating integration with external payment providers.
 *
 * This module sits strictly between domain modules (Finance, Billing) and
 * external providers (Hubtel, Paystack). It handles the actual API communication,
 * provider-specific configuration, and webhook receiving/parsing.
 *
 * It relies on domain modules to handle financial logic, invoice state,
 * and subscription lifecycles.
 */
@Module({
  imports: [ConfigModule, forwardRef(() => FinanceModule)],
  controllers: [PaymentWebhookController],
  providers: [
    PaymentsService,
    PaymentWebhookService,
    PaymentProviderRegistry,
    HubtelProvider,
    PaystackProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule implements OnModuleInit {

  constructor(
    private readonly registry: PaymentProviderRegistry,
    private readonly hubtel: HubtelProvider,
    private readonly paystack: PaystackProvider,
  ) {}

  /**
   * Auto-registers providers that are enabled via configuration.
   * If a provider is not enabled (e.g., HUBTEL_ENABLED=false), it won't be
   * registered, and any attempt to use it will throw ServiceUnavailableException.
   */
  onModuleInit() {
    if (this.hubtel.isEnabled()) {
      this.registry.register(this.hubtel);
    }
    if (this.paystack.isEnabled()) {
      this.registry.register(this.paystack);
    }
  }
}
