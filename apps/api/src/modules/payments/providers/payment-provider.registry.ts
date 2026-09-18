import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PaymentProvider } from '@school-saas/config';
import { IPaymentProvider } from './payment-provider.interface';

/**
 * Centralized registry for payment provider adapters.
 *
 * Providers register themselves during module initialization.
 * Callers request a provider by type — if the provider is not registered
 * (or is disabled via config), a ServiceUnavailableException is thrown.
 *
 * This prevents scattered provider-selection logic (if/else chains) across
 * the codebase and keeps provider coupling in one place.
 */
@Injectable()
export class PaymentProviderRegistry {
  private readonly providers = new Map<PaymentProvider, IPaymentProvider>();

  /**
   * Register a provider adapter.
   * Called during module initialization for each enabled provider.
   */
  register(provider: IPaymentProvider): void {
    this.providers.set(provider.providerType, provider);
  }

  /**
   * Retrieve a provider by type.
   * @throws ServiceUnavailableException if the provider is not registered.
   */
  getProvider(type: PaymentProvider): IPaymentProvider {
    const provider = this.providers.get(type);

    if (!provider) {
      throw new ServiceUnavailableException(
        `Payment provider ${type} is not configured or enabled`,
      );
    }

    return provider;
  }

  /**
   * Check whether a provider is registered without throwing.
   */
  hasProvider(type: PaymentProvider): boolean {
    return this.providers.has(type);
  }
}
