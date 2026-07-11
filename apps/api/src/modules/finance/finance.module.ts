import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { MtnMomoPaymentProvider } from './payment-providers/mtn-momo-payment.provider';
import { PAYMENT_PROVIDER_REGISTRY } from './payment-providers/payment-provider.types';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    MtnMomoPaymentProvider,
    {
      provide: PAYMENT_PROVIDER_REGISTRY,
      useFactory: (mtnMomoPaymentProvider: MtnMomoPaymentProvider) => ({
        [mtnMomoPaymentProvider.provider]: mtnMomoPaymentProvider,
      }),
      inject: [MtnMomoPaymentProvider],
    },
  ],
})
export class FinanceModule {}
