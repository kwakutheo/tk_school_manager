import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentProvider } from '@school-saas/config';
import { FinanceService } from '../../finance/finance.service';
import { PaymentProviderRegistry } from '../providers/payment-provider.registry';
import { IProviderWebhookResult } from '../providers/payment-provider.interface';

/**
 * Handles inbound provider webhook events for school fee payments.
 *
 * Responsibilities:
 *  - Delegate raw webhook parsing + authentication to the provider adapter
 *  - Check idempotency (duplicate webhook detection)
 *  - Route confirmed/failed events to FinanceService domain methods
 *  - Return cleanly on already-processed events (idempotent by design)
 *
 * SECURITY: Webhook signature verification must be added inside each
 * provider adapter (HubtelProvider, PaystackProvider) once official
 * API documentation is available.  Do NOT trust raw webhook payloads.
 */
@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly financeService: FinanceService,
  ) {}

  /**
   * Process a raw inbound webhook from a payment provider.
   *
   * @param provider  Which provider sent the webhook.
   * @param rawBody   Unparsed request body string (needed for HMAC verification).
   * @param headers   All request headers (lower-cased).
   */
  async handleFeePaymentWebhook(
    provider: PaymentProvider,
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<void> {
    const providerAdapter = this.providerRegistry.getProvider(provider);

    // Provider adapter parses + authenticates the webhook
    const event = await providerAdapter.handleWebhook({ rawBody, headers });

    await this.processFeePaymentEvent(event);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async processFeePaymentEvent(event: IProviderWebhookResult): Promise<void> {
    this.logger.log(
      `Processing webhook event: provider=${event.providerTransactionId} type=${event.eventType} status=${event.status}`,
    );

    try {
      if (event.status === 'COMPLETED') {
        // confirmExternalPayment is idempotent — calling it twice is safe
        await this.financeService.confirmExternalPayment(event.providerTransactionId);
      } else if (event.status === 'FAILED') {
        await this.financeService.failExternalPaymentByTransactionId(event.providerTransactionId);
      } else {
        this.logger.warn(
          `Unhandled webhook status "${event.status}" for transaction ${event.providerTransactionId}`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Payment record not found — could be a webhook for a different system
        this.logger.warn(
          `Received webhook for unknown transaction: ${event.providerTransactionId}`,
        );
        return;
      }

      throw error;
    }
  }
}
