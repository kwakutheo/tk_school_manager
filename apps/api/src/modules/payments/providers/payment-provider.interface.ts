import { PaymentProvider } from '@school-saas/config';

// ---------------------------------------------------------------------------
// Request / Result contracts
// ---------------------------------------------------------------------------

export interface IPaymentInitRequest {
  /** Internal unique reference for this payment attempt. */
  reference: string;
  /** Amount to charge, in the local currency (e.g. GHS). */
  amount: number;
  /** ISO-4217 currency code (e.g. 'GHS'). */
  currency: string;
  /** Human-readable description shown to the payer. */
  description: string;
  /** Payer mobile number (required for mobile-money flows). */
  customerPhone?: string | null;
  /** Payer email (required for card/redirect flows). */
  customerEmail?: string | null;
  /** Optional arbitrary metadata to forward to the provider. */
  metadata?: Record<string, unknown>;
}

export interface IPaymentInitResult {
  /** Provider-assigned transaction identifier (used for status queries). */
  providerTransactionId: string;
  /** Provider-assigned reference (may differ from providerTransactionId). */
  providerReference: string | null;
  /** Raw status string returned by the provider (e.g. 'PENDING', 'CREATED'). */
  providerStatus: string;
  /** Redirect URL for hosted-checkout flows (null for direct-debit flows). */
  checkoutUrl: string | null;
  /** Any extra provider metadata to persist. */
  metadata?: Record<string, unknown>;
}

export interface IPaymentVerifyRequest {
  providerReference: string;
  providerTransactionId?: string;
}

export interface IPaymentVerifyResult {
  providerTransactionId: string;
  providerReference: string;
  /** Raw status string from provider. */
  providerStatus: string;
  /** Internal-normalised status. Provider adapters MUST translate to this. */
  internalStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  paidAt?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface IProviderWebhookRequest {
  /** Raw unparsed body bytes (needed for HMAC signature verification). */
  rawBody: string;
  /** All request headers (lower-cased). */
  headers: Record<string, string>;
}

export interface IProviderWebhookResult {
  /** Provider-level event identifier (for idempotency). */
  providerEventId: string;
  providerTransactionId: string;
  providerReference: string;
  /** Provider event type string (e.g. 'payment.success'). */
  eventType: string;
  /** Internal-normalised payment status. */
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/**
 * Contract every payment provider adapter must implement.
 *
 * Adapters are responsible for:
 *  - translating Scholentra domain requests into provider API calls
 *  - translating provider responses into Scholentra domain results
 *  - translating raw provider status strings into internal statuses
 *
 * Adapters must NOT contain Finance or Billing domain logic.
 */
export interface IPaymentProvider {
  readonly providerType: PaymentProvider;

  /** Initialise a new payment with the external provider. */
  initializePayment(request: IPaymentInitRequest): Promise<IPaymentInitResult>;

  /** Verify an existing payment's status with the provider. */
  verifyPayment(request: IPaymentVerifyRequest): Promise<IPaymentVerifyResult>;

  /**
   * Parse and authenticate an inbound provider webhook event.
   * Signature verification must be implemented here when API docs are available.
   */
  handleWebhook(request: IProviderWebhookRequest): Promise<IProviderWebhookResult>;
}
