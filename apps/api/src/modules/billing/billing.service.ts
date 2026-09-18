import { Injectable, NotImplementedException } from '@nestjs/common';
import { IAuthenticatedUser } from '@school-saas/types';

/**
 * Skeleton BillingService for Scholentra SaaS subscriptions.
 *
 * This service handles Scholentra's own revenue (schools paying for the platform).
 * It uses the Paystack provider from the Payments module.
 *
 * It is completely separate from the Finance module (which handles parents
 * paying schools via Hubtel).
 */
@Injectable()
export class BillingService {
  /**
   * Create a new subscription for a school.
   */
  async createSubscription(_currentUser: IAuthenticatedUser, _planId: string) {
    throw new NotImplementedException('SaaS Billing is not yet implemented');
  }

  /**
   * Get the current active subscription for a school.
   */
  async getSchoolSubscription(_schoolId: string) {
    throw new NotImplementedException('SaaS Billing is not yet implemented');
  }
}
