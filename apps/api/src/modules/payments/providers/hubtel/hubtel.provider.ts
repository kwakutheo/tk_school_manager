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
 * Hubtel payment provider adapter.
 *
 * FLOW: Parent → Scholentra → Hubtel → School
 *
 * Hubtel handles school fee collection. It supports multiple payment methods
 * (mobile money, card, bank, etc.) — Scholentra does NOT manage these
 * individually; Hubtel abstracts them.
 *
 * ⚠️  INTEGRATION STATUS: NOT IMPLEMENTED
 * The real Hubtel API integration must be added inside this class once
 * official Hubtel API documentation and credentials are available.
 * DO NOT add Hubtel API logic anywhere else in the codebase.
 *
 * Configuration (environment variables):
 *   HUBTEL_ENABLED          — set to "true" to enable the provider
 *   HUBTEL_CLIENT_ID        — Hubtel merchant client ID
 *   HUBTEL_CLIENT_SECRET    — Hubtel merchant client secret
 *   HUBTEL_CALLBACK_URL     — optional webhook callback URL
 *
 * When HUBTEL_ENABLED is false (or missing), all methods throw
 * ServiceUnavailableException so the rest of Scholentra continues to work.
 */
@Injectable()
export class HubtelProvider implements IPaymentProvider {
  readonly providerType = PaymentProvider.HUBTEL;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialise a school-fee payment with Hubtel.
   *
   * TODO: Implement once official Hubtel API documentation is available.
   *       Do NOT fabricate Hubtel endpoints or payloads.
   */
  async initializePayment(_request: IPaymentInitRequest): Promise<IPaymentInitResult> {
    this.ensureEnabled();
    throw new NotImplementedException(
      'Hubtel payment initialization is not implemented yet. ' +
        'Implement inside HubtelProvider once official API documentation is available.',
    );
  }

  /**
   * Verify the status of a Hubtel school-fee payment.
   *
   * TODO: Implement once official Hubtel API documentation is available.
   */
  async verifyPayment(_request: IPaymentVerifyRequest): Promise<IPaymentVerifyResult> {
    this.ensureEnabled();
    throw new NotImplementedException(
      'Hubtel payment verification is not implemented yet. ' +
        'Implement inside HubtelProvider once official API documentation is available.',
    );
  }

  /**
   * Parse and authenticate an inbound Hubtel webhook event.
   *
   * TODO: Implement signature verification using the official Hubtel
   *       webhook documentation. Do NOT guess the signature format.
   */
  async handleWebhook(_request: IProviderWebhookRequest): Promise<IProviderWebhookResult> {
    this.ensureEnabled();
    throw new NotImplementedException(
      'Hubtel webhook handling is not implemented yet. ' +
        'Implement inside HubtelProvider once official API documentation is available.',
    );
  }

  /**
   * Returns true when Hubtel is enabled via configuration.
   * The module uses this to decide whether to register the provider.
   */
  isEnabled(): boolean {
    return this.configService.get<string>('HUBTEL_ENABLED', '').toLowerCase() === 'true';
  }

  /** Throws ServiceUnavailableException when the provider is not enabled. */
  private ensureEnabled(): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Hubtel payment provider is not enabled. Set HUBTEL_ENABLED=true to activate.',
      );
    }
  }
}
