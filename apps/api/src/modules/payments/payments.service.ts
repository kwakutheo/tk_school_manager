import { Injectable } from '@nestjs/common';
import { PaymentProvider } from '@school-saas/config';
import { IAuthenticatedUser, IFeePayment } from '@school-saas/types';
import { randomUUID } from 'crypto';
import { FinanceService } from '../finance/finance.service';
import { InitiateFeePaymentDto } from './dto/initiate-fee-payment.dto';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

/**
 * Payment integration service.
 *
 * This service sits between the domain services (FinanceService, BillingService)
 * and the external provider adapters (HubtelProvider, PaystackProvider).
 *
 * It owns:
 *  - provider selection
 *  - provider API calls
 *  - mapping provider results back into domain operations
 *  - error handling and fallback state updates
 *
 * It does NOT own:
 *  - financial business rules (those stay in FinanceService)
 *  - database writes beyond what FinanceService exposes
 *  - provider API implementation details (those stay in provider adapters)
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly financeService: FinanceService,
  ) {}

  /**
   * Initiate an external school-fee payment via Hubtel.
   *
   * Flow:
   *  1. Create a PENDING FeePayment record (FinanceService validates invoice + balance).
   *  2. Call HubtelProvider.initializePayment().
   *  3. Update the payment record with provider data.
   *  4. On provider error: mark payment FAILED and rethrow.
   *
   * The invoice status is NOT changed here (PENDING payments do not affect
   * the invoice — only COMPLETED payments do, handled by confirmFeePayment).
   */
  async initiateFeePayment(
    currentUser: IAuthenticatedUser,
    invoiceId: string,
    dto: InitiateFeePaymentDto,
  ): Promise<IFeePayment> {
    const provider = this.providerRegistry.getProvider(PaymentProvider.HUBTEL);
    const reference = dto.reference?.trim() || randomUUID();

    // Step 1: Create PENDING payment record via FinanceService (validates invoice + balance)
    const payment = await this.financeService.createPendingExternalPayment(currentUser, invoiceId, {
      amount: dto.amount,
      method: dto.paymentMethod,
      provider: PaymentProvider.HUBTEL,
      reference,
      notes: dto.notes ?? null,
    });

    // Step 2: Call the provider
    try {
      const result = await provider.initializePayment({
        amount: payment.amount,
        currency: 'GHS',
        reference: payment.reference ?? reference,
        description: `School fee payment`,
        customerPhone: dto.customerPhone ?? null,
        customerEmail: dto.customerEmail ?? null,
      });

      // Step 3: Persist provider reference data
      return await this.financeService.updateExternalPaymentProviderData(payment.id, {
        providerTransactionId: result.providerTransactionId,
        providerReference: result.providerReference,
        providerStatus: result.providerStatus,
        providerMetadata: result.metadata ?? null,
      });
    } catch (error) {
      // Step 4: Mark the pending record as FAILED so it is not left dangling
      await this.financeService.failExternalPayment(payment.id).catch(() => undefined);
      throw error;
    }
  }
}
