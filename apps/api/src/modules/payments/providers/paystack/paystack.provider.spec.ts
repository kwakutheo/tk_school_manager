import { NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { PaymentProvider } from '@school-saas/config';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { PaystackProvider } from './paystack.provider';

function makeConfigService(enabled: boolean) {
  return {
    get: (key: string, defaultValue = '') => {
      if (key === 'PAYSTACK_ENABLED') return enabled ? 'true' : 'false';
      return defaultValue;
    },
  } as any;
}

describe('PaystackProvider', () => {
  describe('when PAYSTACK_ENABLED=false', () => {
    let provider: PaystackProvider;

    beforeEach(() => {
      provider = new PaystackProvider(makeConfigService(false));
    });

    it('has providerType PAYSTACK', () => {
      expect(provider.providerType).toBe(PaymentProvider.PAYSTACK);
    });

    it('isEnabled returns false', () => {
      expect(provider.isEnabled()).toBe(false);
    });

    it('initializePayment throws ServiceUnavailableException', async () => {
      await expect(
        provider.initializePayment({
          reference: 'ref-1',
          amount: 500,
          currency: 'GHS',
          description: 'Scholentra Starter plan — monthly',
        }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('verifyPayment throws ServiceUnavailableException', async () => {
      await expect(
        provider.verifyPayment({ providerReference: 'ref-1' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('handleWebhook throws ServiceUnavailableException', async () => {
      await expect(
        provider.handleWebhook({ rawBody: '{}', headers: {} }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('when PAYSTACK_ENABLED=true', () => {
    let provider: PaystackProvider;

    beforeEach(() => {
      provider = new PaystackProvider(makeConfigService(true));
    });

    it('isEnabled returns true', () => {
      expect(provider.isEnabled()).toBe(true);
    });

    it('initializePayment throws NotImplementedException (real API pending)', async () => {
      await expect(
        provider.initializePayment({
          reference: 'ref-1',
          amount: 500,
          currency: 'GHS',
          description: 'Scholentra Starter plan — monthly',
        }),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('verifyPayment throws NotImplementedException (real API pending)', async () => {
      await expect(
        provider.verifyPayment({ providerReference: 'ref-1' }),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });

    it('handleWebhook throws NotImplementedException (real API pending)', async () => {
      await expect(
        provider.handleWebhook({ rawBody: '{}', headers: {} }),
      ).rejects.toBeInstanceOf(NotImplementedException);
    });
  });
});
