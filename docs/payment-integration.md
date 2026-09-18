# Scholentra Payment Integration

This document outlines how Scholentra handles payments. 

## Architectural Separation

Scholentra separates payments into two distinct domains:

1. **Finance Domain (School fee collection)**
   - **Flow**: Parent → Scholentra → Hubtel → School
   - **Provider**: Hubtel
   - **Purpose**: Collecting school fees from parents on behalf of schools.
   - **Code**: `apps/api/src/modules/finance/`

2. **Billing Domain (SaaS subscriptions)**
   - **Flow**: School → Scholentra → Paystack → Scholentra
   - **Provider**: Paystack
   - **Purpose**: Schools paying Scholentra for the SaaS platform.
   - **Code**: `apps/api/src/modules/billing/`

## Payment Provider Adapters

Both Hubtel and Paystack are abstracted behind the `IPaymentProvider` interface.
This interface ensures the domain code remains completely unaware of provider-specific APIs, payloads, or authentication mechanisms.

Providers are resolved dynamically via the `PaymentProviderRegistry` in the `PaymentsModule`.

### Current Implementation Status

**Hubtel (School fees)**
- Adapter: `HubtelProvider`
- Status: 🚧 Skeleton implementation (NotImplementedException thrown) pending official API documentation.
- Config: `HUBTEL_ENABLED=true` to enable.

**Paystack (SaaS billing)**
- Adapter: `PaystackProvider`
- Status: 🚧 Skeleton implementation (NotImplementedException thrown) pending official API documentation.
- Config: `PAYSTACK_ENABLED=true` to enable.

## Webhooks

Webhooks are processed at `POST /payments/webhooks/:provider`.
The `PaymentWebhookController` delegates raw parsing and authentication to the specific provider adapter. Once verified, the webhook payload is normalised into an `IProviderWebhookResult` and passed to the respective domain module (e.g. `FinanceService.confirmExternalPayment`).
