import { PaymentProvider } from '@school-saas/config';
import { Prisma } from '@prisma/client';

export const PAYMENT_PROVIDER_REGISTRY = Symbol('PAYMENT_PROVIDER_REGISTRY');

export interface PaymentProviderInitiationRequest {
  amount: number;
  description: string;
  invoiceId: string;
  payerPhoneNumber: string;
  providerTransactionId: string;
  reference: string;
  schoolId: string;
  studentId: string;
}

export interface PaymentProviderInitiationResult {
  provider: PaymentProvider;
  providerReference: string | null;
  providerStatus: string;
  providerTransactionId: string;
  metadata?: Prisma.InputJsonObject;
}

export interface PaymentProviderClient {
  readonly provider: PaymentProvider;
  initiatePayment(
    request: PaymentProviderInitiationRequest,
  ): Promise<PaymentProviderInitiationResult>;
}

export type PaymentProviderRegistry = Partial<Record<PaymentProvider, PaymentProviderClient>>;
