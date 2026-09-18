import { Injectable, NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@school-saas/config';
import {
  IPaymentInitRequest,
  IPaymentInitResult,
  IPaymentProvider,
  IPaymentVerifyRequest,
  IPaymentVerifyResult,
  IProviderWebhookRequest,
  IProviderWebhookResult,
} from '../payment-provider.interface';

/**
 * Paystack payment provider adapter.
 *
 * FLOW: School → Scholentra → Paystack → Scholentra business account
 *
 * Paystack handles Scholentra's OWN SaaS billing (subscription payments).
 * It must NOT be used for school fee collection (that is Hubtel's domain).
 *
 * ⚠️  INTEGRATION STATUS: NOT IMPLEMENTED
 * The real Paystack API integration must be added inside this class once
 * official Paystack API documentation and credentials are available.
 * DO NOT add Paystack API logic anywhere else in the codebase.
 *
 * Configuration (environment variables):
 *   PAYSTACK_ENABLED      — set to "true" to enable the provider
 *   PAYSTACK_SECRET_KEY   — Paystack secret key (sk_live_* or sk_test_*)
 *   PAYSTACK_CALLBACK_URL — optional redirect URL after checkout
 *
 * When PAYSTACK_ENABLED is false (or missing), all methods throw
 * ServiceUnavailableException so the rest of Scholentra continues to work.
 */
@Injectable()
export class PaystackProvider implements IPaymentProvider {
  readonly providerType = PaymentProvider.PAYSTACK;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialise a SaaS subscription payment with Paystack.
   *
   * TODO: Implement once official Paystack API documentation is available.
   *       Do NOT fabricate Paystack endpoints or payloads.
   */
  async initializePayment(_request: IPaymentInitRequest): Promise<IPaymentInitResult> {
    this.ensureEnabled();
    throw new NotImplementedException(
      'Paystack payment initialization is not implemented yet. ' +
        'Implement inside PaystackProvider once official API documentation is available.',
    );
  }

  /**
   * Verify the status of a Paystack SaaS payment.
   *
   * TODO: Implement once official Paystack API documentation is available.
   */
  async verifyPayment(_request: IPaymentVerifyRequest): Promise<IPaymentVerifyResult> {
    this.ensureEnabled();
    throw new NotImplementedException(
      'Paystack payment verification is not implemented yet. ' +
        'Implement inside PaystackProvider once official API documentation is available.',
    );
  }

  /**
   * Parse and authenticate an inbound Paystack webhook event.
   *
   * TODO: Implement HMAC-SHA512 signature verification using the
   *       official Paystack webhook documentation.
   */
  async handleWebhook(_request: IProviderWebhookRequest): Promise<IProviderWebhookResult> {
    this.ensureEnabled();
    throw new NotImplementedException(
      'Paystack webhook handling is not implemented yet. ' +
        'Implement inside PaystackProvider once official API documentation is available.',
    );
  }

  /**
   * Returns true when Paystack is enabled via configuration.
   * The module uses this to decide whether to register the provider.
   */
  isEnabled(): boolean {
    return this.configService.get<string>('PAYSTACK_ENABLED', '').toLowerCase() === 'true';
  }

  /** Throws ServiceUnavailableException when the provider is not enabled. */
  private ensureEnabled(): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Paystack payment provider is not enabled. Set PAYSTACK_ENABLED=true to activate.',
      );
    }
  }
}
