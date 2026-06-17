---
name: active-campaign
description: |
  ActiveCampaign integration flows for the One CLI. Manage contacts, deals,
  and tags in your ActiveCampaign CRM with ready-to-run workflows.
triggers:
  - "activecampaign"
  - "active campaign"
  - "create contact activecampaign"
  - "search contacts activecampaign"
  - "create deal activecampaign"
  - "/active-campaign"
---

# ActiveCampaign Flows

Ready-to-run workflows for ActiveCampaign via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add active-campaign            # Connect your ActiveCampaign account
one --agent list                   # Find your connection key
```

## Discovery

Creating deals requires pipeline (`group`) and `stage` IDs. Filtering contacts may need `listId` or `tagId`. Find them with:

```bash
# List pipelines (to get group/pipeline IDs and their stages)
one --agent actions search active-campaign "list pipelines"
one --agent actions execute active-campaign <list-pipelines-action-id> <your-connection-key>

# List tags (to get tagId)
one --agent actions search active-campaign "list tags"
one --agent actions execute active-campaign <list-tags-action-id> <your-connection-key>

# List contact lists (to get listId)
one --agent actions search active-campaign "list lists"
one --agent actions execute active-campaign <list-lists-action-id> <your-connection-key>
```

## Flows

### Create Contact

Create a new contact with email, name, phone, custom fields, and an optional tag.

```bash
one flow execute activecampaign-create-contact.flow.json \
  --input activeCampaignConnectionKey="<your-key>" \
  --input email="alice@example.com" \
  --input firstName="Alice" \
  --input lastName="Smith"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `activeCampaignConnectionKey` | Yes | ActiveCampaign connection key |
| `email` | Yes | Contact email address |
| `firstName` | No | First name |
| `lastName` | No | Last name |
| `phone` | No | Phone number |
| `fieldValues` | No | Custom field values (array of `{field, value}`) |
| `tagId` | No | Tag ID to apply after creation |

**What it does under the hood:**

1. Builds contact payload with standard and custom fields
2. Creates the contact via `POST /api/3/contacts`
3. Optionally adds a tag via `POST /api/3/contactTags`

### Create Deal

Create a deal in the ActiveCampaign CRM pipeline.

```bash
one flow execute activecampaign-create-deal.flow.json \
  --input activeCampaignConnectionKey="<your-key>" \
  --input title="Enterprise License" \
  --input value=50000 \
  --input group="1" \
  --input stage="1"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `activeCampaignConnectionKey` | Yes | ActiveCampaign connection key |
| `title` | Yes | Deal title |
| `value` | No | Deal value in cents (default 0) |
| `currency` | No | 3-letter currency code (default 'usd') |
| `group` | Yes | Pipeline ID |
| `stage` | Yes | Stage ID within the pipeline |
| `owner` | No | Owner user ID |
| `contactId` | No | Contact ID to associate |
| `description` | No | Deal description |

### Search Contacts

Search and filter contacts by email, name, list, or tag.

```bash
one flow execute activecampaign-search-contacts.flow.json \
  --input activeCampaignConnectionKey="<your-key>" \
  --input email="alice@example.com"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `activeCampaignConnectionKey` | Yes | ActiveCampaign connection key |
| `email` | No | Filter by email |
| `search` | No | Free-text search term |
| `listId` | No | Filter by list ID |
| `tagId` | No | Filter by tag ID |
| `limit` | No | Results to return (max 100, default 20) |

## Adapting These Flows

- **Tag + deal pipeline**: Chain `activecampaign-create-contact` into `activecampaign-create-deal` using the returned contact ID.
- **Bulk import**: Use the ActiveCampaign bulk import action for large contact lists.
- **Lead scoring**: Search contacts, then update scores via the update contact action.
