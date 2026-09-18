import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { NotImplementedException } from '@nestjs/common';
import { IAuthenticatedUser } from '@school-saas/types';

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingService],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('createSubscription throws NotImplementedException', async () => {
    await expect(service.createSubscription({} as IAuthenticatedUser, 'plan')).rejects.toThrow(
      NotImplementedException,
    );
  });

  it('getSchoolSubscription throws NotImplementedException', async () => {
    await expect(service.getSchoolSubscription('school')).rejects.toThrow(NotImplementedException);
  });
});
