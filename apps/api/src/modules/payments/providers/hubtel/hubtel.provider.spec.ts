import { NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { PaymentProvider } from '@school-saas/config';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { HubtelProvider } from './hubtel.provider';

function makeConfigService(enabled: boolean) {
  return {
    get: (key: string, defaultValue = '') => {
      if (key === 'HUBTEL_ENABLED') return enabled ? 'true' : 'false';
      return defaultValue;
    },
  } as any;
}

describe('HubtelProvider', () => {
  describe('when HUBTEL_ENABLED=false', () => {
    let provider: HubtelProvider;

    beforeEach(() => {
      provider = new HubtelProvider(makeConfigService(false));
    });

    it('has providerType HUBTEL', () => {
      expect(provider.providerType).toBe(PaymentProvider.HUBTEL);
    });

    it('isEnabled returns false', () => {
      expect(provider.isEnabled()).toBe(false);
    });

    it('initializePayment throws ServiceUnavailableException', async () => {
      await expect(
        provider.initializePayment({
          reference: 'ref-1',
          amount: 100,
          currency: 'GHS',
          description: 'test',
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

  describe('when HUBTEL_ENABLED=true', () => {
    let provider: HubtelProvider;

    beforeEach(() => {
      provider = new HubtelProvider(makeConfigService(true));
    });

    it('isEnabled returns true', () => {
      expect(provider.isEnabled()).toBe(true);
    });

    it('initializePayment throws NotImplementedException (real API pending)', async () => {
      await expect(
        provider.initializePayment({
          reference: 'ref-1',
          amount: 100,
          currency: 'GHS',
          description: 'test',
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
