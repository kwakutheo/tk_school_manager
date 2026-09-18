import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethod, PaymentProvider } from '@school-saas/config';
import { FinanceService } from '../finance/finance.service';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PaymentsService } from './payments.service';
import { IPaymentProvider } from './providers/payment-provider.interface';
import { IAuthenticatedUser } from '@school-saas/types';
import { InitiateFeePaymentDto } from './dto/initiate-fee-payment.dto';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let providerRegistry: jest.Mocked<PaymentProviderRegistry>;
  let financeService: jest.Mocked<FinanceService>;
  let mockProvider: jest.Mocked<IPaymentProvider>;

  const mockUser: IAuthenticatedUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'PARENT',
    schoolId: 'school-1',
    profileId: 'prof-1',
  } as any;

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
      createPendingExternalPayment: jest.fn(),
      updateExternalPaymentProviderData: jest.fn(),
      failExternalPayment: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentProviderRegistry, useValue: providerRegistry },
        { provide: FinanceService, useValue: financeService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('initiateFeePayment', () => {
    const dto: InitiateFeePaymentDto = {
      amount: 150.0,
      paymentMethod: PaymentMethod.MOBILE_MONEY,
      customerPhone: '0241234567',
    };

    const mockPendingPayment = {
      id: 'pay-1',
      amount: 150.0,
      reference: 'internal-ref',
    } as any;

    it('should coordinate FinanceService and the provider successfully', async () => {
      financeService.createPendingExternalPayment.mockResolvedValue(mockPendingPayment);
      mockProvider.initializePayment.mockResolvedValue({
        providerTransactionId: 'hubtel-txn-1',
        providerReference: 'hubtel-ref-1',
        providerStatus: 'PENDING',
        checkoutUrl: null,
      });
      financeService.updateExternalPaymentProviderData.mockResolvedValue(mockPendingPayment);

      const result = await service.initiateFeePayment(mockUser, 'inv-1', dto);

      expect(result).toBeDefined();
      expect(providerRegistry.getProvider).toHaveBeenCalledWith(PaymentProvider.HUBTEL);
      expect(financeService.createPendingExternalPayment).toHaveBeenCalledWith(
        mockUser,
        'inv-1',
        expect.objectContaining({ amount: 150.0, method: PaymentMethod.MOBILE_MONEY }),
      );
      expect(mockProvider.initializePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150.0,
          customerPhone: '0241234567',
        }),
      );
      expect(financeService.updateExternalPaymentProviderData).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({ providerTransactionId: 'hubtel-txn-1' }),
      );
    });

    it('should mark the payment as FAILED if the provider throws an error', async () => {
      financeService.createPendingExternalPayment.mockResolvedValue(mockPendingPayment);
      mockProvider.initializePayment.mockRejectedValue(new Error('Provider API down'));
      financeService.failExternalPayment.mockResolvedValue(mockPendingPayment);

      await expect(service.initiateFeePayment(mockUser, 'inv-1', dto)).rejects.toThrow(
        'Provider API down',
      );

      expect(financeService.createPendingExternalPayment).toHaveBeenCalled();
      expect(mockProvider.initializePayment).toHaveBeenCalled();
      expect(financeService.failExternalPayment).toHaveBeenCalledWith('pay-1');
      expect(financeService.updateExternalPaymentProviderData).not.toHaveBeenCalled();
    });
  });
});
