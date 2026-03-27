---
name: stripe
description: |
  Stripe integration flows for the One CLI. Ready-to-run workflows that handle
  response compression (stripping 30+ verbose fields per object), form encoding,
  query parameter construction, date range filtering, and pagination.
triggers:
  - "stripe"
  - "/stripe"
  - "list invoices"
  - "get invoice"
  - "payment intents"
  - "checkout sessions"
  - "connected accounts"
  - "create webhook"
  - "stripe webhook"
---

# Stripe Flows

Ready-to-run workflows for Stripe via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add stripe                     # Connect your Stripe account
one --agent list                   # Find your connection key
```

## Flows

### Create Webhook Endpoint

Creates a Stripe webhook endpoint. Handles form-encoding of enabled events
arrays and metadata key-value pairs that Stripe's API requires.

```bash
one flow execute stripe-create-webhook.flow.json \
  --input stripeConnectionKey="<your-key>" \
  --input url="https://your-app.com/webhooks/stripe" \
  --input enabledEvents='["charge.succeeded", "invoice.paid", "customer.subscription.updated"]' \
  --input description="Production webhook"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `stripeConnectionKey` | Yes | Your Stripe connection key |
| `url` | Yes | URL to receive webhook POSTs |
| `enabledEvents` | Yes | Event types to subscribe to. Use `["*"]` for all events |
| `description` | No | Human-readable description |
| `connect` | No | Receive events from connected accounts (Stripe Connect) |
| `metadata` | No | Key-value metadata object |

**What it does under the hood:**

1. Builds form-encoded body with array-indexed event types (`enabled_events[0]`, `enabled_events[1]`, etc.)
2. Encodes metadata as `metadata[key]=value` pairs
3. POSTs to `/v1/webhook_endpoints`
4. Returns the webhook ID, signing secret, and status

---

### List Checkout Sessions

Lists Stripe Checkout sessions with filtering. Compresses responses by stripping
40+ verbose fields (consent, shipping, branding, UI config, etc.) while
preserving payment status, amounts, customer, and line items.

```bash
one flow execute stripe-get-checkout-sessions.flow.json \
  --input stripeConnectionKey="<your-key>" \
  --input status="complete" \
  --input limit=20
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `stripeConnectionKey` | Yes | Your Stripe connection key |
| `customer` | No | Filter by customer ID |
| `status` | No | `complete`, `expired`, or `open` |
| `paymentIntent` | No | Filter by payment intent ID |
| `subscription` | No | Filter by subscription ID |
| `customerEmail` | No | Filter by customer email |
| `limit` | No | Number to return (1-100, default 10) |
| `startingAfter` | No | Pagination cursor |
| `expand` | No | Fields to expand (e.g., `["data.line_items"]`) |

---

### List Invoices

Lists Stripe invoices with filtering by status, customer, date range, and
collection method. Compresses responses by removing 30+ fields per invoice
(metadata, payment settings, tax details, shipping, etc.).

```bash
one flow execute stripe-get-invoices.flow.json \
  --input stripeConnectionKey="<your-key>" \
  --input status="open" \
  --input customer="cus_abc123"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `stripeConnectionKey` | Yes | Your Stripe connection key |
| `status` | No | `draft`, `open`, `paid`, `uncollectible`, or `void` |
| `customer` | No | Filter by customer ID |
| `subscription` | No | Filter by subscription ID |
| `collectionMethod` | No | `charge_automatically` or `send_invoice` |
| `createdAfter` | No | Unix timestamp -- only invoices created after |
| `createdBefore` | No | Unix timestamp -- only invoices created before |
| `limit` | No | Number to return (1-100, default 10) |
| `startingAfter` | No | Pagination cursor |

---

### Get Invoice Detail

Retrieves a single invoice with full line item data. Same compression as the
list flow, applied to one invoice.

```bash
one flow execute stripe-get-invoice-detail.flow.json \
  --input stripeConnectionKey="<your-key>" \
  --input invoiceId="in_1abc..."
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `stripeConnectionKey` | Yes | Your Stripe connection key |
| `invoiceId` | Yes | The invoice ID |
| `expand` | No | Fields to expand (e.g., `["customer", "subscription"]`) |

---

### List Payment Intents

Lists payment intents with customer and date filtering. Strips internal fields
(client_secret, payment_method_options, shipping, transfer data, etc.).

```bash
one flow execute stripe-get-payment-intents.flow.json \
  --input stripeConnectionKey="<your-key>" \
  --input customer="cus_abc123" \
  --input limit=25
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `stripeConnectionKey` | Yes | Your Stripe connection key |
| `customer` | No | Filter by customer ID |
| `createdAfter` | No | Unix timestamp |
| `createdBefore` | No | Unix timestamp |
| `limit` | No | Number to return (1-100, default 10) |
| `startingAfter` | No | Pagination cursor |

---

### Get Payment Intent Detail

Retrieves a single payment intent by ID. Supports expand and client secret
params for client-side usage.

```bash
one flow execute stripe-get-payment-intent.flow.json \
  --input stripeConnectionKey="<your-key>" \
  --input intentId="pi_1abc..."
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `stripeConnectionKey` | Yes | Your Stripe connection key |
| `intentId` | Yes | The payment intent ID |
| `clientSecret` | No | Client secret for client-side retrieval |
| `expand` | No | Fields to expand (e.g., `["customer", "payment_method"]`) |

---

### List Connected Accounts

Lists connected accounts (Stripe Connect). Compresses deeply nested settings,
requirements, and dashboard fields while preserving account identity,
capabilities, and payout status.

```bash
one flow execute stripe-get-connected-accounts.flow.json \
  --input stripeConnectionKey="<your-key>" \
  --input limit=50
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `stripeConnectionKey` | Yes | Your Stripe connection key (platform account) |
| `createdAfter` | No | Unix timestamp |
| `createdBefore` | No | Unix timestamp |
| `limit` | No | Number to return (1-100, default 10) |
| `startingAfter` | No | Pagination cursor |
| `expand` | No | Fields to expand |

## Adapting These Flows

These flows are templates. Fork and modify them for your use case:

- **Revenue dashboard**: Chain `stripe-get-payment-intents` with date filters into a Slack or Notion summary.
- **Overdue invoice alerts**: Use `stripe-get-invoices` with `status=open` and pipe results to email or Slack.
- **Checkout analytics**: Use `stripe-get-checkout-sessions` with `expand=["data.line_items"]` and aggregate in a code step.
- **Connect onboarding monitor**: Use `stripe-get-connected-accounts` and filter by `requirements.currently_due` to find accounts needing action.
- **Webhook setup automation**: Use `stripe-create-webhook` as part of a deployment flow to register endpoints per environment.
- **Invoice + line items**: Chain `stripe-get-invoices` into a loop of `stripe-get-invoice-detail` calls for full line-item data.

The orchestration knowledge is in the flow's `code` steps. Read them to understand the compression logic, query parameter construction, and date filter patterns -- then build your own variations.
