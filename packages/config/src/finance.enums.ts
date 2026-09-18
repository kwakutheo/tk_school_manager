export enum FeeInvoiceStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

/**
 * External payment providers used by Scholentra.
 *
 * HUBTEL  — school fee collection (parent pays school)
 * PAYSTACK — SaaS billing (school pays Scholentra)
 */
export enum PaymentProvider {
  HUBTEL = 'HUBTEL',
  PAYSTACK = 'PAYSTACK',
}

