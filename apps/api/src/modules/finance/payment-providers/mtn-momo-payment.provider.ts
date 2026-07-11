import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@school-saas/config';
import {
  PaymentProviderClient,
  PaymentProviderInitiationRequest,
  PaymentProviderInitiationResult,
} from './payment-provider.types';

interface MtnMomoToken {
  accessToken: string;
  expiresAt: number;
}

interface MtnMomoTokenResponse {
  access_token?: string;
  expires_in?: number;
}

@Injectable()
export class MtnMomoPaymentProvider implements PaymentProviderClient {
  readonly provider = PaymentProvider.MTN_MOMO;

  private token: MtnMomoToken | null = null;

  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(
    request: PaymentProviderInitiationRequest,
  ): Promise<PaymentProviderInitiationResult> {
    const config = this.getConfig();
    const accessToken = await this.getAccessToken(config);
    const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'X-Reference-Id': request.providerTransactionId,
        'X-Target-Environment': config.targetEnvironment,
        ...(config.callbackUrl ? { 'X-Callback-Url': config.callbackUrl } : {}),
      },
      body: JSON.stringify({
        amount: request.amount.toFixed(2),
        currency: config.currency,
        externalId: request.reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.toMtnMsisdn(request.payerPhoneNumber),
        },
        payerMessage: this.truncate(request.description, 160),
        payeeNote: this.truncate(request.description, 160),
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('MTN MoMo payment request was not accepted');
    }

    return {
      provider: this.provider,
      providerReference: request.providerTransactionId,
      providerStatus: 'PENDING',
      providerTransactionId: request.providerTransactionId,
      metadata: {
        currency: config.currency,
        httpStatus: response.status,
        targetEnvironment: config.targetEnvironment,
      },
    };
  }

  private async getAccessToken(config: MtnMomoConfig): Promise<string> {
    const now = Date.now();

    if (this.token && this.token.expiresAt > now + 30_000) {
      return this.token.accessToken;
    }

    const credentials = Buffer.from(`${config.userId}:${config.apiKey}`).toString('base64');
    const response = await fetch(`${config.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      },
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('MTN MoMo access token request failed');
    }

    const body = (await response.json()) as MtnMomoTokenResponse;

    if (!body.access_token) {
      throw new ServiceUnavailableException('MTN MoMo access token response was invalid');
    }

    this.token = {
      accessToken: body.access_token,
      expiresAt: now + (body.expires_in ?? 3600) * 1000,
    };

    return this.token.accessToken;
  }

  private getConfig(): MtnMomoConfig {
    const config = {
      apiKey: this.optionalConfig('MTN_MOMO_COLLECTION_API_KEY'),
      baseUrl: this.requiredConfig('MTN_MOMO_BASE_URL').replace(/\/+$/, ''),
      callbackUrl: this.optionalConfig('MTN_MOMO_CALLBACK_URL'),
      currency: this.requiredConfig('MTN_MOMO_CURRENCY'),
      subscriptionKey: this.optionalConfig('MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY'),
      targetEnvironment: this.requiredConfig('MTN_MOMO_TARGET_ENVIRONMENT'),
      userId: this.optionalConfig('MTN_MOMO_COLLECTION_USER_ID'),
    };

    if (!config.apiKey || !config.subscriptionKey || !config.userId) {
      throw new ServiceUnavailableException('MTN MoMo payments are not configured');
    }

    return config as MtnMomoConfig;
  }

  private requiredConfig(key: string): string {
    return this.configService.get<string>(key, '').trim();
  }

  private optionalConfig(key: string): string | null {
    const value = this.configService.get<string>(key, '').trim();
    return value ? value : null;
  }

  private toMtnMsisdn(value: string): string {
    return value.replace(/^\+/, '');
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }
}

interface MtnMomoConfig {
  apiKey: string;
  baseUrl: string;
  callbackUrl: string | null;
  currency: string;
  subscriptionKey: string;
  targetEnvironment: string;
  userId: string;
}
