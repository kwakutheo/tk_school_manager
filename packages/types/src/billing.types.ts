import { BillingPeriod, PaymentProvider, PaymentStatus, SubscriptionStatus } from '@school-saas/config';

/**
 * A Scholentra subscription plan (e.g. Starter, Pro, Enterprise).
 * Belongs to the Billing domain — completely separate from school Finance.
 */
export interface ISubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceAnnual: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A school's active subscription to Scholentra.
 * One school has at most one subscription at a time.
 */
export interface ISubscription {
  id: string;
  schoolId: string;
  planId: string;
  status: SubscriptionStatus;
  period: BillingPeriod;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A payment record for a Scholentra subscription billing cycle.
 * Uses PAYSTACK as the external provider.
 * Must NOT be confused with FeePayment (school fee collection via HUBTEL).
 */
export interface IBillingRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerTransactionId: string | null;
  providerReference: string | null;
  providerStatus: string | null;
  reference: string | null;
  paidAt: Date | null;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}
