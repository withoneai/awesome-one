---
name: shippo
description: |
  Shippo shipping flows for the One CLI. Create shipments to get carrier rates,
  purchase shipping labels, and track packages across carriers.
triggers:
  - "create shipment"
  - "shipping label"
  - "track package"
  - "shippo"
  - "/shippo"
---

# Shippo Flows

Ready-to-run shipping workflows via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add shippo                     # Connect your Shippo account
one --agent list                   # Find your connection key
```

## Flows

### Create Shipment

Creates a shipment with sender/recipient addresses and package dimensions.
Returns available shipping rates from multiple carriers (USPS, FedEx, UPS, etc.).

```bash
one flow execute shippo-create-shipment.flow.json \
  --input shippoConnectionKey="<your-key>" \
  --input fromName="Jane Doe" \
  --input fromStreet1="123 Main St" \
  --input fromCity="San Francisco" \
  --input fromState="CA" \
  --input fromZip="94105" \
  --input fromCountry="US" \
  --input toName="John Smith" \
  --input toStreet1="456 Oak Ave" \
  --input toCity="New York" \
  --input toState="NY" \
  --input toZip="10001" \
  --input toCountry="US" \
  --input length="10" \
  --input width="7" \
  --input height="4" \
  --input weight="1"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `shippoConnectionKey` | Yes | Your Shippo connection key |
| `fromName/Street1/City/State/Zip/Country` | Yes | Sender address fields |
| `toName/Street1/City/State/Zip/Country` | Yes | Recipient address fields |
| `length`, `width`, `height` | Yes | Package dimensions |
| `weight` | Yes | Package weight |
| `distanceUnit` | No | Unit: in (default) or cm |
| `massUnit` | No | Unit: lb (default), kg, g, oz |

### Create Shipping Label

Purchases a shipping label for a specific rate. Use this after `create-shipment`
to buy the label.

```bash
one flow execute shippo-create-label.flow.json \
  --input shippoConnectionKey="<your-key>" \
  --input rateId="<rate-object-id-from-shipment>"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `shippoConnectionKey` | Yes | Your Shippo connection key |
| `rateId` | Yes | Rate object ID from a shipment |
| `labelFileType` | No | Format: PDF (default), PNG, PDF_4x6, ZPLII |
| `async` | No | Create label asynchronously |

### Track Package

Gets tracking status and history for any package. Auto-detects Shippo test
tracking numbers (SHIPPO_TRANSIT, SHIPPO_DELIVERED, etc.).

```bash
one flow execute shippo-track-package.flow.json \
  --input shippoConnectionKey="<your-key>" \
  --input carrier="usps" \
  --input trackingNumber="9205590164917312751089"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `shippoConnectionKey` | Yes | Your Shippo connection key |
| `carrier` | Yes | Carrier: usps, fedex, ups, dhl_express, shippo (test) |
| `trackingNumber` | Yes | Tracking number |

## Typical Workflow

1. **Create shipment** to get rates from multiple carriers
2. **Pick a rate** based on price, speed, or carrier preference
3. **Create label** with the chosen rate ID
4. **Track package** using the returned tracking number
