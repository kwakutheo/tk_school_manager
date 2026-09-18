import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentProvider } from '@school-saas/config';
import { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { PaymentWebhookService } from './payment-webhook.service';

/**
 * Receives inbound webhook events from external payment providers.
 *
 * These endpoints are PUBLIC — they must NOT require JWT authentication
 * because the provider cannot supply a Scholentra JWT.
 *
 * Security is instead enforced inside each provider adapter:
 *  - Hubtel: signature verification (TODO once API docs available)
 *  - Paystack: HMAC-SHA512 signature verification (TODO once API docs available)
 *
 * Endpoints return HTTP 200 on success.  Providers interpret any non-2xx
 * response as a delivery failure and will retry the webhook.
 *
 * Routes:
 *   POST /payments/webhooks/hubtel   — school-fee payments (Hubtel)
 *   POST /payments/webhooks/paystack — SaaS billing payments (Paystack)
 */
@Public()
@Controller('payments/webhooks')
export class PaymentWebhookController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  /**
   * Hubtel school-fee payment webhook.
   *
   * Called by Hubtel when a school-fee payment status changes
   * (e.g. mobile-money prompt accepted, payment failed, etc.).
   */
  @Post('hubtel')
  @HttpCode(HttpStatus.OK)
  async hubtelWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody?.toString('utf8') ?? '';

    if (!rawBody) {
      throw new ServiceUnavailableException('Empty webhook body received from Hubtel');
    }

    await this.webhookService.handleFeePaymentWebhook(
      PaymentProvider.HUBTEL,
      rawBody,
      this.normalizeHeaders(headers),
    );

    return { received: true };
  }

  /**
   * Paystack SaaS billing webhook.
   *
   * Called by Paystack when a subscription payment status changes.
   * This is for Scholentra's own revenue — NOT school fee collection.
   */
  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody?.toString('utf8') ?? '';

    if (!rawBody) {
      throw new ServiceUnavailableException('Empty webhook body received from Paystack');
    }

    await this.webhookService.handleFeePaymentWebhook(
      PaymentProvider.PAYSTACK,
      rawBody,
      this.normalizeHeaders(headers),
    );

    return { received: true };
  }

  /** Normalises header keys to lower-case for consistent adapter access. */
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  }
}
