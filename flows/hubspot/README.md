---
name: hubspot
description: |
  HubSpot CRM integration flows for the One CLI. Create contacts, search
  contacts, and search any CRM object type (companies, deals, tickets) with
  filters and property selection.
triggers:
  - "hubspot"
  - "create contact hubspot"
  - "search contacts hubspot"
  - "search deals hubspot"
  - "crm search"
  - "/hubspot"
---

# HubSpot Flows

Ready-to-run workflows for HubSpot CRM via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add hubspot                    # Connect your HubSpot account
one --agent list                   # Find your connection key
```

## Flows

### Create Contact

Create a new contact with standard and custom properties.

```bash
one flow execute hubspot-create-contact.flow.json \
  --input hubspotConnectionKey="<your-key>" \
  --input email="alice@example.com" \
  --input firstName="Alice" \
  --input lastName="Smith" \
  --input company="Acme Corp" \
  --input lifecycleStage="lead"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `hubspotConnectionKey` | Yes | HubSpot connection key |
| `email` | Yes | Contact email |
| `firstName` | No | First name |
| `lastName` | No | Last name |
| `phone` | No | Phone number |
| `company` | No | Company name |
| `jobTitle` | No | Job title |
| `lifecycleStage` | No | 'subscriber', 'lead', 'opportunity', 'customer' |
| `customProperties` | No | Object of additional properties (string values) |

### Search Contacts

Search HubSpot contacts by free text or property filters.

```bash
one flow execute hubspot-search-contacts.flow.json \
  --input hubspotConnectionKey="<your-key>" \
  --input searchTerm="alice" \
  --input limit=5
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `hubspotConnectionKey` | Yes | HubSpot connection key |
| `searchTerm` | No | Free-text search |
| `filterProperty` | No | Property to filter by |
| `filterOperator` | No | Operator: 'EQ', 'CONTAINS', 'GT', 'LT', etc. |
| `filterValue` | No | Filter value |
| `properties` | No | Properties to return (default: email, name, phone, company) |
| `limit` | No | Results (max 100, default 10) |

### Search CRM Objects

Search any HubSpot CRM object type: contacts, companies, deals, tickets, or custom objects.

```bash
one flow execute hubspot-search-crm-objects.flow.json \
  --input hubspotConnectionKey="<your-key>" \
  --input objectType="deals" \
  --input filterProperty="dealstage" \
  --input filterOperator="EQ" \
  --input filterValue="closedwon" \
  --input properties='["dealname","amount","closedate"]'
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `hubspotConnectionKey` | Yes | HubSpot connection key |
| `objectType` | Yes | 'contacts', 'companies', 'deals', 'tickets', or custom type |
| `searchTerm` | No | Free-text search |
| `filterProperty` | No | Property to filter by |
| `filterOperator` | No | Operator: 'EQ', 'CONTAINS', 'GT', 'LT', etc. |
| `filterValue` | No | Filter value |
| `properties` | No | Properties to return |
| `limit` | No | Results (max 100, default 10) |

## Adapting These Flows

- **Lead capture**: Chain `gmail-read-emails` into `hubspot-create-contact` to auto-create contacts from inbound emails.
- **Deal pipeline**: Search contacts, then create deals associated with them.
- **Reporting**: Search deals by stage and pipe into Google Sheets for dashboard tracking.
