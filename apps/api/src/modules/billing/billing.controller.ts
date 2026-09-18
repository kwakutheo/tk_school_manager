import { Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthenticatedUser } from '@school-saas/types';
import { BillingService } from './billing.service';

/**
 * Skeleton controller for SaaS billing operations.
 */
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscriptions')
  async createSubscription(@CurrentUser() user: IAuthenticatedUser) {
    return this.billingService.createSubscription(user, 'starter-plan-id');
  }

  @Get('subscriptions/current')
  async getCurrentSubscription(@CurrentUser() user: IAuthenticatedUser) {
    if (!user.schoolId) {
      throw new Error('User does not belong to a school');
    }
    return this.billingService.getSchoolSubscription(user.schoolId);
  }
}
