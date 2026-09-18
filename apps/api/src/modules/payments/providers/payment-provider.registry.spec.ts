import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentProvider } from '@school-saas/config';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { IPaymentProvider } from './payment-provider.interface';
import { PaymentProviderRegistry } from './payment-provider.registry';

function makeFakeProvider(type: PaymentProvider): IPaymentProvider {
  return {
    providerType: type,
    initializePayment: async () => ({
      providerTransactionId: 'txn-1',
      providerReference: null,
      providerStatus: 'PENDING',
      checkoutUrl: null,
    }),
    verifyPayment: async () => ({
      providerTransactionId: 'txn-1',
      providerReference: 'ref-1',
      providerStatus: 'SUCCESS',
      internalStatus: 'COMPLETED',
      amount: 100,
      currency: 'GHS',
    }),
    handleWebhook: async () => ({
      providerEventId: 'evt-1',
      providerTransactionId: 'txn-1',
      providerReference: 'ref-1',
      eventType: 'payment.success',
      status: 'COMPLETED',
      amount: 100,
      currency: 'GHS',
    }),
  };
}

describe('PaymentProviderRegistry', () => {
  let registry: PaymentProviderRegistry;

  beforeEach(() => {
    registry = new PaymentProviderRegistry();
  });

  it('resolves HUBTEL after registration', () => {
    const hubtel = makeFakeProvider(PaymentProvider.HUBTEL);
    registry.register(hubtel);

    const resolved = registry.getProvider(PaymentProvider.HUBTEL);

    expect(resolved).toBe(hubtel);
    expect(resolved.providerType).toBe(PaymentProvider.HUBTEL);
  });

  it('resolves PAYSTACK after registration', () => {
    const paystack = makeFakeProvider(PaymentProvider.PAYSTACK);
    registry.register(paystack);

    const resolved = registry.getProvider(PaymentProvider.PAYSTACK);

    expect(resolved).toBe(paystack);
    expect(resolved.providerType).toBe(PaymentProvider.PAYSTACK);
  });

  it('throws ServiceUnavailableException for an unregistered provider', () => {
    expect(() => registry.getProvider(PaymentProvider.HUBTEL)).toThrow(
      ServiceUnavailableException,
    );
  });

  it('throws ServiceUnavailableException for PAYSTACK when only HUBTEL is registered', () => {
    registry.register(makeFakeProvider(PaymentProvider.HUBTEL));

    expect(() => registry.getProvider(PaymentProvider.PAYSTACK)).toThrow(
      ServiceUnavailableException,
    );
  });

  it('hasProvider returns false before registration', () => {
    expect(registry.hasProvider(PaymentProvider.HUBTEL)).toBe(false);
  });

  it('hasProvider returns true after registration', () => {
    registry.register(makeFakeProvider(PaymentProvider.HUBTEL));

    expect(registry.hasProvider(PaymentProvider.HUBTEL)).toBe(true);
  });

  it('overwriting a provider registration replaces the previous instance', () => {
    const first = makeFakeProvider(PaymentProvider.HUBTEL);
    const second = makeFakeProvider(PaymentProvider.HUBTEL);
    registry.register(first);
    registry.register(second);

    expect(registry.getProvider(PaymentProvider.HUBTEL)).toBe(second);
  });
});
