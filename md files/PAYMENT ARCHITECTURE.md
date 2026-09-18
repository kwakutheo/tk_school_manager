# SCHOLENTRA — COMPLETE PAYMENT ARCHITECTURE & INTEGRATION IMPLEMENTATION

You are working on **Scholentra**, a multi-tenant school management SaaS.

Your task is to prepare and implement the payment architecture for Scholentra while preserving the existing Finance domain and its business rules.

There are TWO completely separate payment flows in Scholentra:

1. **Scholentra SaaS billing** — schools pay Scholentra.
2. **School fee collection** — parents/students pay individual schools.

These two flows MUST remain architecturally and financially separate.

---

# 1. FINAL PAYMENT ARCHITECTURE

This is the authoritative payment architecture for the project.

```text
                         SCHOLENTRA
                              │
                ┌─────────────┴─────────────┐
                │                           │
             BILLING                     FINANCE
                │                           │
             PAYSTACK                     HUBTEL
                │                           │
                ▼                           ▼
        School pays                 Parent pays
         Scholentra                   School
```

## Flow A — Scholentra SaaS Billing

```text
School
   ↓
Scholentra Subscription
   ↓
Paystack
   ↓
Scholentra business account
```

**Paystack is the external payment provider for Scholentra's own SaaS billing.**

Use Paystack for:

* Scholentra subscription payments
* subscription plans
* monthly/annual billing
* subscription renewals
* SaaS billing records
* SaaS payment history
* platform invoices where applicable

This money belongs to the Scholentra platform/business.

---

## Flow B — School Fee Collection

```text
Parent
   ↓
Scholentra
   ↓
Hubtel
   ↓
School
```

**Hubtel is the external payment provider for school-fee collection.**

Use Hubtel for:

* school fees
* admission fees
* feeding fees
* transportation fees
* other school charges
* parent payment collection
* payment references
* payment reconciliation
* school payment status updates

The money collected through this flow belongs to the individual school.

---

# 2. PROVIDER VS PAYMENT METHOD

This distinction is extremely important.

## Payment Provider

The external platform/company that Scholentra integrates with:

```text
HUBTEL
PAYSTACK
```

## Payment Method

The actual method a parent/customer uses:

```text
MOBILE_MONEY
CARD
BANK
OTHER
```

Do NOT treat MTN MoMo, Telecel, AirtelTigo, Visa, Mastercard, bank payments, etc. as separate providers in the Finance domain.

They are payment methods/channels that may be supported by an external payment provider.

Conceptually:

```text
Hubtel
  ├── Mobile Money
  ├── Card
  ├── Bank
  └── Other supported methods
```

The exact payment methods supported by Hubtel must be determined from official Hubtel documentation when the real integration is implemented.

Do NOT invent provider capabilities.

---

# 3. CRITICAL REQUIREMENT — PRESERVE THE EXISTING FINANCE MODULE

There is already a substantial Finance implementation in the project.

Important files include:

```text
finance.service.ts
finance.service.spec.ts
```

The existing Finance test suite contains approximately 23 tests covering core financial behavior.

The Finance module already handles things such as:

* invoice creation
* active enrollment validation
* bulk invoice generation
* duplicate invoice prevention
* invoice listing
* tenant/school authorization
* finance summaries
* overdue balances
* payment recording
* completed/pending payment handling
* payment reversal
* invoice cancellation
* amount validation
* date validation
* overpayment prevention
* transactional payment processing
* serializable transaction isolation

### DO NOT rewrite FinanceService.

### DO NOT replace the Finance module.

### DO NOT remove existing Finance tests.

### DO NOT weaken existing validation.

### DO NOT bypass existing transaction logic.

### DO NOT move provider-specific HTTP/API logic into FinanceService.

The existing FinanceService must remain the authoritative domain service for internal school-finance rules.

External payment providers must integrate WITH the Finance domain rather than replacing it.

---

# 4. CURRENT FINANCE TEST COVERAGE

The existing `finance.service.spec.ts` currently covers approximately 23 cases across these areas.

## Invoice Creation

Existing tests verify:

* invoice creation for active enrollment
* correct initial `amountPaid`
* correct balance
* school ID requirement for platform users
* rejection of amounts with more than two decimal places
* invalid due dates
* rejection when no active enrollment exists

## Bulk Invoice Generation

Existing tests verify:

* active-class invoice generation
* duplicate invoice skipping
* correct requested/created/skipped counts
* empty classes
* school authorization
* academic-year validation

## Invoice Listing

Existing tests verify:

* correct amount paid
* correct balance
* only `COMPLETED` payments affect invoice payment totals
* school tenant isolation

## Finance Summary

Existing tests verify:

* invoice totals
* paid totals
* outstanding balance
* overdue balance
* cancelled invoices excluded appropriately
* invalid `asOfDate`

## Payment Recording

Existing tests verify:

* completed payment recording
* invoice status recalculation
* payment reference trimming
* invalid reversal status
* invalid dates
* overpayment prevention
* serializable transaction handling
* stale-read/concurrent payment scenarios

## Payment Reversal

Existing tests verify:

* completed payment reversal
* invoice recalculation
* already-reversed payments
* invalid payment status
* tenant authorization

## Invoice Cancellation

Existing tests verify:

* cancellation when only pending payments exist
* rejection when completed payments exist

These tests represent existing business rules.

**Preserve them.**

---

# 5. EXISTING MTN MOMO IMPLEMENTATION

The project already contains an earlier school-payment implementation based directly on **MTN MoMo**.

It includes functionality such as:

* MTN MoMo token acquisition
* `requesttopay`
* MTN-specific payment initiation
* MTN-specific configuration
* MTN-specific response/status handling
* potentially related tests/controllers/services

This implementation was based on the previous architecture:

```text
FinanceService
      ↓
MTN MoMo
      ↓
MTN
```

That is NO LONGER the desired architecture.

The new architecture must be:

```text
FinanceService
      ↓
Payment Integration Layer
      ↓
PaymentProvider Interface
      ↓
HubtelProvider
      ↓
Hubtel
      ↓
Supported payment methods
```

---

# 6. DO NOT BLINDLY DELETE THE MTN MOMO CODE

Before modifying or removing anything related to MTN MoMo:

1. Search the entire project.
2. Identify every MTN MoMo file.
3. Identify all references to MTN MoMo.
4. Identify FinanceService dependencies.
5. Identify controller dependencies.
6. Identify DTOs.
7. Identify configuration/environment variables.
8. Identify database fields.
9. Identify tests.
10. Identify frontend/API calls.
11. Identify any documentation or other modules depending on it.

The old implementation is useful reference material.

It may contain reusable concepts such as:

* payment reference generation
* external transaction tracking
* payment initialization flow
* provider error handling
* status mapping
* configuration loading
* FinanceService interaction

However:

**DO NOT simply rename `MtnMomoProvider` to `HubtelProvider`.**

Hubtel and MTN MoMo have different APIs and capabilities.

Do not assume that Hubtel uses:

* MTN token acquisition
* `requesttopay`
* MTN headers
* MTN request payloads
* MTN response formats
* MTN status codes
* MTN authentication

The real Hubtel integration must be based on official Hubtel documentation when available.

---

# 7. THE REAL HUBTEL AND PAYSTACK APIS ARE NOT AVAILABLE YET

This is a critical constraint.

At the current stage:

* We do NOT have the real Hubtel API credentials.
* We do NOT have the final Hubtel API implementation.
* We do NOT have the real Paystack API credentials.
* We do NOT want live payment requests.

Therefore:

## DO NOT

* make real Hubtel API calls
* make real Paystack API calls
* invent Hubtel endpoints
* invent Paystack endpoints
* invent authentication flows
* invent request payloads
* invent response payloads
* invent webhook formats
* fabricate provider status codes
* pretend payments succeeded
* hard-code API credentials
* create fake HTTP integrations that look like real APIs

Instead, build the architecture and provider boundaries now.

The real APIs should be added later inside the provider adapters.

---

# 8. PROVIDER ABSTRACTION

Create a provider-agnostic payment integration layer.

The architecture should conceptually be:

```text
PaymentProvider
      │
      ├── HubtelProvider
      │
      └── PaystackProvider
```

The exact interface should be designed after inspecting the existing codebase.

Do not blindly copy an interface from this prompt.

The interface should represent Scholentra's domain requirements rather than undocumented provider APIs.

It may contain capabilities conceptually similar to:

```typescript
interface PaymentProvider {
  initializePayment(
    request: InitializePaymentRequest,
  ): Promise<PaymentInitializationResult>;

  verifyPayment(
    request: VerifyPaymentRequest,
  ): Promise<PaymentVerificationResult>;

  handleWebhook(
    request: ProviderWebhookRequest,
  ): Promise<ProviderWebhookResult>;
}
```

Adapt this to the existing project's architecture.

---

# 9. PROVIDER ADAPTER STRUCTURE

Create a structure similar to:

```text
payments/
  payments.module.ts
  payments.service.ts

  providers/
    payment-provider.interface.ts

    hubtel/
      hubtel.provider.ts
      hubtel.provider.spec.ts

    paystack/
      paystack.provider.ts
      paystack.provider.spec.ts

  webhooks/
    payment-webhook.controller.ts
    payment-webhook.service.ts
```

Use the project's existing module conventions if they differ.

The important thing is the separation of responsibilities.

---

# 10. HUBTEL PROVIDER

Create a `HubtelProvider`.

At this stage it is an adapter boundary.

It should conceptually support operations such as:

```text
initializePayment
verifyPayment
handleWebhook
mapProviderStatus
```

But because the real API is not available:

**Do not implement fabricated HTTP calls.**

The methods should return a clearly defined "not configured/not implemented" result or use an appropriate project-level mechanism.

For example:

```typescript
throw new NotImplementedException(
  'Hubtel integration is not configured yet',
);
```

Use the approach that best fits the existing architecture.

Do not pretend the payment succeeded.

---

# 11. PAYSTACK PROVIDER

Create a `PaystackProvider`.

This provider belongs to the **Billing/SaaS subscription flow**, not the school Finance domain.

At this stage:

* no real Paystack calls
* no fabricated endpoints
* no fake subscription success
* no hard-coded keys

Prepare the adapter for future:

* payment initialization
* payment verification
* subscription-related operations where applicable
* webhook processing
* provider status mapping

The exact implementation must be based on official Paystack documentation once the real integration begins.

---

# 12. PROVIDER REGISTRY / FACTORY

Create a centralized provider-selection mechanism.

Conceptually:

```text
PaymentProviderRegistry
        │
        ├── HUBTEL
        │     └── HubtelProvider
        │
        └── PAYSTACK
              └── PaystackProvider
```

The calling service should be able to request a provider without knowing its implementation details.

Conceptually:

```typescript
const provider =
  providerRegistry.getProvider(providerType);
```

Do not scatter provider selection throughout the application.

Avoid large conditionals such as:

```typescript
if (provider === 'hubtel') {
   ...
} else if (provider === 'paystack') {
   ...
}
```

inside FinanceService or BillingService.

---

# 13. KEEP FINANCESERVICE PROVIDER-AGNOSTIC

Do NOT add provider-specific methods such as:

```text
initiateHubtelPayment()
initiatePaystackPayment()
verifyHubtelPayment()
verifyPaystackPayment()
```

to FinanceService.

Instead, use domain-level concepts such as:

```text
initiateFeePayment()
recordExternalPayment()
processPaymentConfirmation()
processPaymentWebhook()
```

where appropriate.

FinanceService should not care whether money came through:

* Hubtel
* Paystack
* MTN MoMo
* another provider
* cash
* bank transfer
* manual payment

FinanceService cares about the resulting financial event.

---

# 14. SCHOOL FEE PAYMENT FLOW

The intended future flow is:

```text
Parent
   ↓
Selects school invoice
   ↓
Scholentra
   ↓
Payment Integration Service
   ↓
Provider = HUBTEL
   ↓
HubtelProvider
   ↓
Hubtel
   ↓
Parent payment method
```

Eventually:

```text
Hubtel
   ↓
Webhook / verification
   ↓
Scholentra API
   ↓
Payment Integration Service
   ↓
FinanceService
   ↓
FeePayment = COMPLETED
   ↓
Invoice recalculated
```

The FinanceService remains responsible for the internal financial state.

---

# 15. FRONTEND PAYMENT SUCCESS MUST NOT BE AUTHORITATIVE

Never implement this:

```text
Parent
   ↓
Payment page
   ↓
Frontend receives success
   ↓
Frontend tells API payment succeeded
   ↓
Database = COMPLETED
```

Instead:

```text
Parent
   ↓
External Provider
   ↓
Provider confirmation/webhook
   ↓
Backend
   ↓
Verify/authenticate provider event
   ↓
Check transaction/reference
   ↓
Process idempotently
   ↓
FinanceService
   ↓
FeePayment = COMPLETED
```

Frontend redirects/results may be used for user experience only.

They must not be the authoritative financial confirmation.

---

# 16. WEBHOOK ARCHITECTURE

Prepare the application for provider webhooks.

Create an appropriate structure such as:

```text
payments/
  webhooks/
    payment-webhook.controller.ts
    payment-webhook.service.ts
```

The architecture should support:

```text
Provider
   ↓
Webhook
   ↓
Webhook authentication/signature verification
   ↓
Identify event
   ↓
Identify provider transaction
   ↓
Check idempotency
   ↓
Verify transaction where required
   ↓
Map provider status
   ↓
Call appropriate domain service
   ↓
Update internal financial/billing records
```

Do not invent the actual webhook signature mechanism before official provider documentation is available.

Build the boundary now.

---

# 17. WEBHOOK IDEMPOTENCY

Payment providers can retry webhook events.

The same event must not create duplicate financial records.

Design for idempotency from the beginning.

Possible identifiers include:

```text
provider
providerEventId
providerTransactionId
providerReference
```

Use the appropriate identifier(s) based on the real provider documentation.

Consider database uniqueness constraints such as:

```text
(provider, providerTransactionId)
```

or an appropriate event-level uniqueness constraint.

Do not rely solely on in-memory checks.

The database must protect against duplicate processing.

---

# 18. EXTERNAL PAYMENT DATA

Inspect the existing Prisma schema before modifying it.

If necessary, extend the existing payment model to support external provider metadata such as:

```text
provider
providerTransactionId
providerReference
internalReference
paymentMethod
status
amount
currency
initiatedAt
completedAt
```

Do not duplicate existing fields.

Do not create unnecessary tables.

Follow the existing Prisma naming and schema conventions.

The existing internal records remain authoritative.

Conceptually:

```text
FeeInvoice
    │
    └── FeePayment
            │
            ├── internal reference
            ├── provider
            ├── provider reference
            ├── provider transaction ID
            ├── payment method
            ├── amount
            └── status
```

---

# 19. PAYMENT STATUS

Use provider-independent internal statuses.

For example:

```text
PENDING
COMPLETED
FAILED
REVERSED
```

Use the project's existing enum/status conventions if they already exist.

Provider-specific status strings must not leak into the Finance domain.

Do not write logic such as:

```typescript
payment.status === 'HUBTEL_SUCCESS'
```

inside FinanceService.

Instead:

```typescript
payment.status === PaymentStatus.COMPLETED
```

Provider adapters translate external statuses into internal statuses.

---

# 20. TENANT ISOLATION

Scholentra is a multi-tenant SaaS.

Every school-fee transaction must remain associated with the correct:

```text
schoolId
invoiceId
student/enrollment
```

A webhook must NOT be allowed to update an invoice simply because an external reference exists.

The backend must establish the relationship:

```text
Provider Transaction
        ↓
Internal Payment
        ↓
Invoice
        ↓
School
```

and enforce tenant boundaries.

Never trust a client-supplied `schoolId` for authorization.

Use the existing authorization/tenant patterns in the project.

---

# 21. PRESERVE EXISTING FINANCIAL TRANSACTION SAFETY

The existing FinanceService already protects against overpayment and concurrent transactions.

Keep this behavior.

For example:

```text
Invoice = GH₵1,000

Payment A = GH₵600
Payment B = GH₵600
```

The system must not accidentally allow:

```text
Total paid = GH₵1,200
```

because of concurrent requests.

The existing serializable transaction/isolation approach must remain authoritative.

External payment processing should eventually flow into the existing protected FinanceService logic:

```text
External Provider
       ↓
Payment Integration Layer
       ↓
FinanceService
       ↓
Existing transaction logic
       ↓
FeePayment
       ↓
Invoice status/balance
```

Do not directly manipulate invoice financial fields from the webhook handler if FinanceService already owns that behavior.

---

# 22. SCHOLENTRA BILLING MUST BE SEPARATE

Create or prepare a separate Billing domain for Scholentra subscriptions.

Do NOT put Scholentra subscription payments into school fee invoices.

Conceptually:

```text
FINANCE
└── School financial activity
    └── Parent → School

BILLING
└── Scholentra commercial activity
    └── School → Scholentra
```

Paystack belongs primarily to Billing.

Hubtel belongs primarily to school-fee Finance.

---

# 23. SaaS BILLING DOMAIN

Inspect the existing project first to determine whether Billing/Subscription models already exist.

If they do not exist, prepare the architecture for:

```text
School
   ↓
Subscription
   ↓
Plan
   ↓
Billing Period
   ↓
Payment
   ↓
Subscription Status
```

Potential subscription states may include:

```text
TRIAL
ACTIVE
PAST_DUE
CANCELLED
EXPIRED
```

Use the project's existing conventions if similar concepts already exist.

Do not create unnecessary functionality that is not required yet.

---

# 24. DO NOT ASSUME PAYMENT METHOD RECURRING CAPABILITIES

Do not assume every payment method can automatically renew a subscription.

The provider abstraction should support the concept of:

```text
one-time payment
recurring payment
manual renewal
```

without embedding provider-specific assumptions into Billing.

When the real Paystack integration is implemented, use the official Paystack documentation to determine exactly which payment methods and recurring mechanisms are supported.

Do not invent recurring-payment functionality.

---

# 25. PROVIDER CONFIGURATION

Inspect the existing configuration system first.

Use the project's existing configuration conventions.

The architecture should eventually support environment-based provider configuration.

Conceptually:

```env
HUBTEL_ENABLED=false
HUBTEL_CLIENT_ID=
HUBTEL_CLIENT_SECRET=

PAYSTACK_ENABLED=false
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
```

These are examples only.

Do not assume these are the exact variable names required by the providers.

Use names consistent with the existing configuration architecture.

Most importantly:

* no secrets in source code
* no secrets in Git
* no API keys committed
* no credentials required for local development unless explicitly enabled

The application must be able to run with providers disabled.

---

# 26. PROVIDER DISABLED STATE

If Hubtel or Paystack is not configured, the application should fail gracefully.

For example:

```text
HUBTEL_ENABLED=false
```

should not prevent the rest of Scholentra from starting.

Similarly:

```text
PAYSTACK_ENABLED=false
```

should not prevent the application from starting.

Attempting to initiate an unavailable provider should return a clear application-level error such as:

```text
PAYMENT_PROVIDER_NOT_CONFIGURED
```

or the equivalent project-standard error.

Do not pretend that a payment was successful.

---

# 27. EXISTING `initiateMobileMoneyPayment`

The existing project contains an `initiateMobileMoneyPayment` capability.

Inspect this method carefully.

Determine:

* what it currently does
* which provider it calls
* which DTO it uses
* what it stores
* how it generates references
* how it handles pending status
* how it handles failures
* whether it is exposed through a controller
* whether frontend code depends on it
* whether tests depend on it

Do not simply delete it.

Refactor it into a provider-agnostic school-fee payment initiation flow if appropriate.

For example, conceptually:

```text
initiateMobileMoneyPayment()
        ↓
initiateFeePayment()
        ↓
Payment Integration Service
        ↓
HubtelProvider
```

However, do not force this exact method structure if the existing project has a better architecture.

The important requirement is that **FinanceService must no longer be directly coupled to MTN MoMo**.

---

# 28. PAYMENT METHOD MODEL

Do not make the internal payment model permanently MTN-specific.

If the existing schema contains something like:

```text
MTN_MOMO
```

inspect where it is used.

If appropriate, evolve the model toward a generic representation such as:

```text
MOBILE_MONEY
CARD
BANK
OTHER
```

while retaining provider information separately:

```text
provider = HUBTEL
paymentMethod = MOBILE_MONEY
```

Do not make this change blindly.

Check existing migrations, API contracts, frontend usage, tests, and database compatibility first.

---

# 29. TESTING — DO NOT BREAK EXISTING TESTS

Before changes:

```text
Run existing tests.
```

After every major architectural change:

```text
Run relevant tests.
Run type checking.
Run lint if configured.
```

The existing Finance tests must continue to pass.

---

# 30. NEW PAYMENT PROVIDER TESTS

Create tests for the new provider architecture.

## Provider Registry

Test:

* Hubtel resolves correctly
* Paystack resolves correctly
* unknown provider fails cleanly
* disabled provider fails cleanly
* provider selection is centralized

---

# 31. HUBTEL PROVIDER TESTS

Since the real API is not available yet, use mocks/stubs.

Test:

* initialization contract
* verification contract
* webhook contract
* disabled/missing configuration
* provider error handling
* malformed provider response handling
* internal status mapping
* duplicate event handling

Do NOT make live Hubtel HTTP requests.

---

# 32. PAYSTACK PROVIDER TESTS

Similarly test:

* SaaS payment initialization contract
* verification contract
* subscription-related contract where applicable
* webhook contract
* disabled/missing configuration
* provider error handling
* malformed response handling
* internal status mapping
* duplicate event handling

Do NOT make live Paystack HTTP requests.

---

# 33. FINANCE INTEGRATION TESTS

Test that a confirmed external school payment eventually integrates correctly with the existing Finance domain.

For example:

```text
External payment confirmed
        ↓
FeePayment = COMPLETED
        ↓
Invoice amountPaid recalculated
        ↓
Invoice balance recalculated
        ↓
Invoice status recalculated
```

Also test:

```text
Duplicate webhook
        ↓
No duplicate FeePayment
```

And:

```text
External payment exceeds invoice balance
        ↓
Existing overpayment protection remains effective
```

---

# 34. MISSING EXISTING FINANCE TESTS

The current Finance test coverage has identified these gaps:

* `findInvoice`
* `findPayments`
* `initiateMobileMoneyPayment`
* MoMo failure → automatic FAILED state
* complete `SUPER_ADMIN` cross-school scenarios

Do not necessarily implement all of these immediately unless required by the new architecture.

However, inspect them and add appropriate tests where the new payment integration depends on them.

In particular, school-fee payment initiation and failure handling should have tests after the migration to the provider abstraction.

---

# 35. DATABASE CHANGES

Before modifying Prisma:

1. Inspect the current schema.
2. Identify existing Finance models.
3. Identify existing payment fields.
4. Identify existing enums.
5. Identify existing indexes/unique constraints.
6. Identify existing migration conventions.

Only add fields/tables that are genuinely required.

Potentially useful external-payment information includes:

```text
provider
providerTransactionId
providerReference
paymentMethod
```

Potentially useful webhook information includes:

```text
providerEventId
eventType
processedAt
```

But do not add all of these automatically.

Design based on the existing schema and actual requirements.

Use proper unique constraints for idempotency.

---

# 36. RECONCILIATION

The architecture should leave room for payment reconciliation.

For school fees, eventually we need to be able to answer:

```text
Which school?
Which invoice?
Which student?
Which payment?
Which provider?
Which provider transaction?
How much?
When?
What was the final status?
Was it reversed/refunded?
```

Do not build a huge reconciliation subsystem now unless the existing project already requires it.

However, preserve enough transaction metadata to make future reconciliation possible.

---

# 37. REFUNDS AND REVERSALS

Keep internal financial reversal logic separate from provider API operations.

For example:

```text
Provider refund
      ↓
Provider webhook/confirmation
      ↓
Payment Integration Layer
      ↓
FinanceService
      ↓
Internal payment reversal/refund state
```

Do not assume that an internal reversal automatically causes a provider refund.

Those are separate operations.

Likewise, do not assume a provider refund automatically means the internal Finance record should be changed without validation.

Design the boundary now.

---

# 38. SECURITY

Payment integrations are security-sensitive.

Ensure:

* no secrets are hard-coded
* no credentials are committed
* provider configuration is environment-based
* webhook authentication is supported as an architecture boundary
* provider signatures/events will be verified once official documentation is available
* tenant ownership is validated
* invoice ownership is validated
* provider references cannot be freely supplied to alter arbitrary invoices
* frontend success is not trusted
* duplicate events cannot create duplicate payments
* logs do not expose secrets
* sensitive payment payloads are not unnecessarily logged

Do not invent webhook signature verification before official provider documentation is available.

---

# 39. DO NOT OVERENGINEER

Do not introduce:

* Kafka
* microservices
* event buses
* unnecessary Redis infrastructure
* unnecessary queues
* complicated plugin systems
* unnecessary payment abstractions
* multiple payment providers for the same flow
* speculative provider implementations

The desired architecture is a clean NestJS modular design:

```text
Domain
   ↓
Payment Integration Service
   ↓
Provider Interface
   ↓
Provider Adapter
```

Keep it maintainable.

---

# 40. DOCUMENTATION

Create or update a developer document explaining the payment architecture.

Suggested location:

```text
docs/payment-integration.md
```

Use the project's existing documentation conventions if different.

The documentation should explain:

1. Paystack's role.
2. Hubtel's role.
3. Difference between provider and payment method.
4. Difference between SaaS Billing and school Finance.
5. Existing MTN MoMo implementation and migration.
6. Provider abstraction.
7. Provider adapter structure.
8. Webhook architecture.
9. Idempotency.
10. Tenant isolation.
11. Environment configuration.
12. How to add the real Hubtel API later.
13. How to add the real Paystack API later.
14. What must NOT be modified when integrating the real APIs.

---

# 41. IMPLEMENTATION PROCESS

Before modifying code, inspect the existing project thoroughly.

Search for:

```text
finance
payment
feePayment
feeInvoice
MobileMoney
MTN
MoMo
requesttopay
subscription
billing
webhook
transaction
provider
```

Inspect:

```text
finance.service.ts
finance.service.spec.ts
finance.controller.ts
finance DTOs
Prisma schema
Prisma migrations
existing payment services
existing MTN MoMo provider
existing configuration
authentication/authorization
frontend payment calls
existing tests
```

Do not assume the project's structure from this prompt.

---

# 42. FIRST PROVIDE A SHORT ARCHITECTURAL ASSESSMENT

Before making substantial modifications, identify:

* current Finance architecture
* current MTN MoMo architecture
* existing payment models
* existing payment enums/statuses
* existing configuration approach
* existing API endpoints
* existing frontend dependencies
* existing tests
* any existing Billing/Subscription module

Then explain the minimum changes required to migrate from:

```text
Finance → MTN MoMo
```

to:

```text
Finance → Payment Integration Layer → Hubtel
```

and separately establish:

```text
Billing → Payment Integration Layer → Paystack
```

Do not make unnecessary changes.

---

# 43. IMPLEMENT INCREMENTALLY

Implement the work in logical stages.

Recommended sequence:

## Stage 1

Inspect and document existing architecture.

## Stage 2

Create provider abstractions.

## Stage 3

Create Hubtel adapter boundary.

## Stage 4

Create Paystack adapter boundary.

## Stage 5

Create provider registry/factory.

## Stage 6

Refactor existing MTN MoMo dependency behind/replaced by the new abstraction.

## Stage 7

Prepare database/provider transaction metadata where required.

## Stage 8

Prepare webhook architecture.

## Stage 9

Add tests.

## Stage 10

Run full test/typecheck/lint suite.

Do not attempt the real Hubtel or Paystack HTTP integration.

---

# 44. ACCEPTANCE CRITERIA

The implementation is complete only if the following are true.

## Existing Finance

* Existing FinanceService behavior is preserved.
* Existing Finance tests pass.
* Existing tenant authorization remains intact.
* Existing overpayment protection remains intact.
* Existing serializable transaction handling remains intact.
* Existing payment reversal behavior remains intact.
* Existing invoice cancellation behavior remains intact.
* Existing invoice calculation behavior remains intact.

## MTN MoMo Migration

* Existing MTN MoMo implementation has been inspected.
* Its dependencies have been identified.
* FinanceService is no longer directly coupled to MTN MoMo.
* MTN-specific logic is not extended as the new architecture.
* Useful existing code is preserved where appropriate.
* Dead MTN-specific code is removed only after dependency analysis.
* Existing API/frontend functionality is not broken without understanding its dependencies.

## Hubtel

* HubtelProvider exists.
* Hubtel-specific code is isolated.
* No fabricated Hubtel API is implemented.
* Hubtel credentials are not hard-coded.
* School-fee payment architecture points to Hubtel.
* Payment methods remain separate from provider identity.

## Paystack

* PaystackProvider exists.
* Paystack-specific code is isolated.
* No fabricated Paystack API is implemented.
* Paystack credentials are not hard-coded.
* SaaS billing architecture points to Paystack.

## Finance/Payments

* FinanceService remains provider-agnostic.
* External payment data can be associated with internal payments.
* Payment status mapping exists.
* Provider transaction references can be stored.
* Webhook architecture exists.
* Idempotency is supported.
* Tenant isolation remains enforced.
* Existing transaction safety remains authoritative.

## Billing

* SaaS billing is separate from school Finance.
* School subscription payments are not stored as school fee payments.
* Paystack belongs to Billing.
* Hubtel belongs to school fee collection.

## Security

* No secrets in source code.
* No fake successful payment responses.
* Frontend payment results are not authoritative.
* Provider webhook verification has an appropriate architecture boundary.
* Duplicate webhook events cannot create duplicate financial transactions.

## Testing

* Existing Finance tests pass.
* New provider tests pass.
* Provider registry tests pass.
* Webhook/idempotency tests exist.
* Disabled-provider tests exist.
* No test depends on a real external provider.

---

# 45. FINAL NON-NEGOTIABLE ARCHITECTURE

The final architecture MUST be understood as follows:

```text
                         SCHOLENTRA
                              │
                ┌─────────────┴─────────────┐
                │                           │
             BILLING                     FINANCE
                │                           │
             PAYSTACK                     HUBTEL
                │                           │
                ▼                           ▼
        School pays                 Parent pays
         Scholentra                   School
```

Internally:

```text
SaaS Billing:

Billing Domain
      ↓
Payment Integration Layer
      ↓
PaymentProvider Interface
      ↓
PaystackProvider
      ↓
Paystack
```

School Fees:

```text
Finance Domain
      ↓
Payment Integration Layer
      ↓
PaymentProvider Interface
      ↓
HubtelProvider
      ↓
Hubtel
      ↓
Supported payment methods
```

The old architecture:

```text
FinanceService
      ↓
MTN MoMo
```

must no longer be the architectural direction.

The new architecture:

```text
FinanceService
      ↓
Payment Integration Layer
      ↓
PaymentProvider Interface
      ↓
HubtelProvider
      ↓
Hubtel
```

is the required direction.

---

# 46. MOST IMPORTANT PRINCIPLE

**Do not rebuild the Finance module.**

The existing Finance module already contains important financial business rules and transaction safety.

Preserve it.

Build the payment-provider integration around it.

The provider layer should translate external payment events into internal domain operations.

Therefore:

```text
External Provider
       ↓
Provider Adapter
       ↓
Payment Integration Service
       ↓
Existing Finance/Billing Domain
       ↓
Database
```

NOT:

```text
External Provider
       ↓
Direct database updates
```

and NOT:

```text
FinanceService
       ↓
Hard-coded Hubtel/MTN/Paystack API logic
```

---

# 47. FINAL BUSINESS SEPARATION

Never confuse these two flows.

### Scholentra's money

```text
School
   ↓
Paystack
   ↓
Scholentra
```

This is platform/SaaS revenue.

### School's money

```text
Parent
   ↓
Hubtel
   ↓
School
```

This is school revenue.

They must remain separate in:

* domain logic
* database records
* accounting meaning
* reconciliation
* refunds
* payment references
* provider integration
* reporting

---

# 48. WHEN REAL APIs BECOME AVAILABLE

When the official Hubtel API documentation and credentials become available:

Implement the actual Hubtel integration primarily inside:

```text
HubtelProvider
```

When the official Paystack API documentation and credentials become available:

Implement the actual Paystack integration primarily inside:

```text
PaystackProvider
```

Do not redesign the Finance domain merely because the provider API is now available.

Do not introduce provider-specific logic into FinanceService.

Do not change established financial rules simply to accommodate provider implementation details.

If the provider APIs reveal a genuine domain requirement that requires architectural changes, explain the reason before making the change.

---

# 49. FINAL REPORT REQUIRED FROM THE AGENT

After implementation, provide a concise but complete report containing:

## Files created

List every new file.

## Files modified

List every modified file.

## Files removed

List any deleted files and explain why.

## Database changes

Explain:

* Prisma schema changes
* migrations
* indexes
* unique constraints
* enums

## MTN MoMo migration

Explain:

* what existing MTN code was found
* what was preserved
* what was refactored
* what was removed
* why

## Hubtel architecture

Explain:

* provider interface
* Hubtel adapter
* configuration
* webhook architecture
* current intentionally unimplemented portions

## Paystack architecture

Explain:

* Billing integration
* provider adapter
* configuration
* webhook architecture
* current intentionally unimplemented portions

## Tests

Report:

* existing Finance tests
* new tests
* total tests
* passed/failed
* typecheck result
* lint result if applicable

## Intentionally unimplemented

Clearly list anything that cannot be implemented yet because the real Hubtel/Paystack API documentation or credentials are not available.

Do not claim that an external payment integration is complete if no real API has been connected.

---

# FINAL INSTRUCTION

Work with the existing codebase rather than assuming a blank project.

**Inspect first. Preserve existing Finance logic. Refactor carefully. Add provider abstraction. Move school-fee payments from direct MTN MoMo coupling toward Hubtel. Use Paystack for Scholentra SaaS billing. Keep the two money flows completely separate. Do not fabricate external APIs. Make the system provider-ready so the real APIs can be plugged in later with minimal architectural change.**
