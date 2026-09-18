import { Test, TestingModule } from '@nestjs/testing';
import { PaymentProvider } from '@school-saas/config';
import { FinanceService } from '../finance/finance.service';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PaymentWebhookService } from './payment-webhook.service';
import { NotFoundException } from '@nestjs/common';
import { IPaymentProvider } from './providers/payment-provider.interface';

describe('PaymentWebhookService', () => {
  let service: PaymentWebhookService;
  let providerRegistry: jest.Mocked<PaymentProviderRegistry>;
  let financeService: jest.Mocked<FinanceService>;
  let mockProvider: jest.Mocked<IPaymentProvider>;

  beforeEach(async () => {
    mockProvider = {
      providerType: PaymentProvider.HUBTEL,
      initializePayment: jest.fn(),
      verifyPayment: jest.fn(),
      handleWebhook: jest.fn(),
    } as any;

    providerRegistry = {
      getProvider: jest.fn().mockReturnValue(mockProvider),
      register: jest.fn(),
      hasProvider: jest.fn(),
    } as any;

    financeService = {
      confirmExternalPayment: jest.fn(),
      failExternalPaymentByTransactionId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentWebhookService,
        { provide: PaymentProviderRegistry, useValue: providerRegistry },
        { provide: FinanceService, useValue: financeService },
      ],
    }).compile();

    service = module.get<PaymentWebhookService>(PaymentWebhookService);
  });

  it('should process a COMPLETED webhook event', async () => {
    mockProvider.handleWebhook.mockResolvedValue({
      providerEventId: 'evt-1',
      providerTransactionId: 'txn-1',
      providerReference: 'ref-1',
      eventType: 'payment.success',
      status: 'COMPLETED',
      amount: 100,
      currency: 'GHS',
    });

    await service.handleFeePaymentWebhook(PaymentProvider.HUBTEL, 'raw', {});

    expect(providerRegistry.getProvider).toHaveBeenCalledWith(PaymentProvider.HUBTEL);
    expect(mockProvider.handleWebhook).toHaveBeenCalledWith({ rawBody: 'raw', headers: {} });
    expect(financeService.confirmExternalPayment).toHaveBeenCalledWith('txn-1');
    expect(financeService.failExternalPaymentByTransactionId).not.toHaveBeenCalled();
  });

  it('should process a FAILED webhook event', async () => {
    mockProvider.handleWebhook.mockResolvedValue({
      providerEventId: 'evt-2',
      providerTransactionId: 'txn-2',
      providerReference: 'ref-2',
      eventType: 'payment.failed',
      status: 'FAILED',
      amount: 100,
      currency: 'GHS',
    });

    await service.handleFeePaymentWebhook(PaymentProvider.HUBTEL, 'raw', {});

    expect(financeService.failExternalPaymentByTransactionId).toHaveBeenCalledWith('txn-2');
    expect(financeService.confirmExternalPayment).not.toHaveBeenCalled();
  });

  it('should ignore PENDING or REVERSED status for now', async () => {
    mockProvider.handleWebhook.mockResolvedValue({
      providerEventId: 'evt-3',
      providerTransactionId: 'txn-3',
      providerReference: 'ref-3',
      eventType: 'payment.pending',
      status: 'PENDING',
      amount: 100,
      currency: 'GHS',
    });

    await service.handleFeePaymentWebhook(PaymentProvider.HUBTEL, 'raw', {});

    expect(financeService.confirmExternalPayment).not.toHaveBeenCalled();
    expect(financeService.failExternalPaymentByTransactionId).not.toHaveBeenCalled();
  });

  it('should gracefully handle NotFoundException if payment is unknown', async () => {
    mockProvider.handleWebhook.mockResolvedValue({
      providerEventId: 'evt-4',
      providerTransactionId: 'unknown-txn',
      providerReference: 'ref-4',
      eventType: 'payment.success',
      status: 'COMPLETED',
      amount: 100,
      currency: 'GHS',
    });

    financeService.confirmExternalPayment.mockRejectedValue(new NotFoundException());

    // Should not throw
    await expect(
      service.handleFeePaymentWebhook(PaymentProvider.HUBTEL, 'raw', {}),
    ).resolves.not.toThrow();
  });

  it('should propagate other errors', async () => {
    mockProvider.handleWebhook.mockRejectedValue(new Error('Signature invalid'));

    await expect(
      service.handleFeePaymentWebhook(PaymentProvider.HUBTEL, 'raw', {}),
    ).rejects.toThrow('Signature invalid');
  });
});
