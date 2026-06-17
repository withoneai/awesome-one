---
name: apollo
description: |
  Apollo.io integration flows for the One CLI. Ready-to-run workflows for
  prospecting, enrichment, company research, and outreach sequence management
  against Apollo's 270M+ contact database.
triggers:
  - "search people"
  - "find prospects"
  - "enrich person"
  - "enrich company"
  - "enrich organization"
  - "search companies"
  - "search organizations"
  - "prospect to sequence"
  - "add to sequence"
  - "apollo"
  - "/apollo"
---

# Apollo Flows

Ready-to-run workflows for [Apollo.io](https://apollo.io) via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add apollo                     # Connect your Apollo account
one --agent list                   # Find your connection key
```

## Discovery

The prospect-to-sequence flow requires a `sequenceId` and `emailAccountId`. Find them with:

```bash
# List your sequences (emailer campaigns)
one --agent actions search apollo "list sequences"
one --agent actions execute apollo <list-sequences-action-id> <your-connection-key> \
  --query-params '{"per_page":"10"}'

# List your email accounts
one --agent actions search apollo "list email accounts"
one --agent actions execute apollo <list-email-accounts-action-id> <your-connection-key>
```

## Flows

### People Search (Net-New Prospecting)

Search Apollo's database of 270M+ people by title, seniority, location, employer
domain, technologies, and more. Does not return emails/phones -- use enrichment
for contact details.

```bash
one flow execute apollo-people-search.flow.json \
  --input apolloConnectionKey="<your-key>" \
  --input personTitles='["VP of Engineering", "CTO"]' \
  --input personSeniorities='["vp", "c_suite"]' \
  --input personLocations='["california"]' \
  --input employeeRanges='["50,500"]' \
  --input perPage=25
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `apolloConnectionKey` | Yes | Your Apollo connection key |
| `personTitles` | No | Job titles to search (matches similar titles) |
| `personSeniorities` | No | Levels: owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern |
| `personLocations` | No | Where people live (cities, states, countries) |
| `organizationDomains` | No | Employer domains (up to 1000) |
| `organizationLocations` | No | Employer HQ locations |
| `employeeRanges` | No | Headcount ranges as "min,max" strings |
| `technologies` | No | Technologies used by employer (underscores for spaces) |
| `keywords` | No | Free-text keyword filter |
| `page` | No | Page number, 1-500 (default 1) |
| `perPage` | No | Results per page, 1-100 (default 25) |

**What it does under the hood:**

1. Builds array query parameters from structured inputs (Apollo uses bracket notation)
2. Calls `POST /api/v1/mixed_people/api_search` with filters as query params
3. Extracts and formats person data with organization metadata

---

### Enrich a Person

Enrich a single person's data by email, name+domain, LinkedIn URL, or Apollo ID.
Returns title, employer, employment history, location, seniority, and engagement
likelihood.

```bash
one flow execute apollo-enrich-person.flow.json \
  --input apolloConnectionKey="<your-key>" \
  --input email="tim@apollo.io"
```

```bash
one flow execute apollo-enrich-person.flow.json \
  --input apolloConnectionKey="<your-key>" \
  --input firstName="Tim" \
  --input lastName="Zheng" \
  --input domain="apollo.io"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `apolloConnectionKey` | Yes | Your Apollo connection key |
| `email` | No | Email address (strongest match signal) |
| `firstName` | No | First name (combine with lastName + domain) |
| `lastName` | No | Last name |
| `domain` | No | Employer domain (no www. or @) |
| `linkedinUrl` | No | LinkedIn profile URL |
| `apolloPersonId` | No | Apollo person ID from a previous search |
| `revealPersonalEmails` | No | Reveal personal emails (consumes credits, GDPR-restricted) |

At least one identifier is required. Best results come from email or name+domain.

**What it does under the hood:**

1. Validates at least one identifier is provided
2. Calls `POST /api/v1/people/match` with identifiers as query params
3. Extracts person profile, organization data, and employment history

---

### Enrich an Organization by Domain

Get comprehensive company intelligence from a single domain. Returns industry,
revenue, employee count, funding history, technologies, departmental headcount,
and social links.

```bash
one flow execute apollo-enrich-org.flow.json \
  --input apolloConnectionKey="<your-key>" \
  --input domain="stripe.com"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `apolloConnectionKey` | Yes | Your Apollo connection key |
| `domain` | Yes | Company domain (no www. or @) |

**What it does under the hood:**

1. Cleans domain input (strips protocol, www., trailing slashes)
2. Calls `GET /api/v1/organizations/enrich?domain=...`
3. Extracts company profile, funding events, tech stack, and department headcounts

---

### Search Organizations (Company Search)

Search Apollo's company database by name, domain, location, employee count,
revenue, funding, technologies, and keyword tags.

```bash
one flow execute apollo-search-orgs.flow.json \
  --input apolloConnectionKey="<your-key>" \
  --input technologies='["salesforce", "hubspot"]' \
  --input employeeRanges='["50,500"]' \
  --input locations='["california", "new york"]' \
  --input perPage=25
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `apolloConnectionKey` | Yes | Your Apollo connection key |
| `name` | No | Organization name (partial match) |
| `domains` | No | Organization domains (up to 1000) |
| `locations` | No | HQ locations (cities, states, countries) |
| `excludeLocations` | No | Exclude HQ locations |
| `employeeRanges` | No | Headcount ranges as "min,max" strings |
| `revenueMin` | No | Minimum revenue (integer) |
| `revenueMax` | No | Maximum revenue (integer) |
| `technologies` | No | Technologies in use (underscores for spaces) |
| `keywords` | No | Keyword tags |
| `page` | No | Page number, 1-500 (default 1) |
| `perPage` | No | Results per page, 1-100 (default 25) |

**What it does under the hood:**

1. Builds bracket-notation query params from structured inputs
2. Calls `POST /api/v1/mixed_companies/search` with filters as query params
3. Extracts organization profiles with pagination metadata

---

### Prospect People and Add to Sequence

End-to-end outbound workflow. Searches for people matching your ICP, creates them
as contacts in your Apollo workspace (with deduplication), and enrolls them into
an outreach sequence.

```bash
one flow execute apollo-prospect-to-sequence.flow.json \
  --input apolloConnectionKey="<your-key>" \
  --input personTitles='["VP of Engineering"]' \
  --input personSeniorities='["vp", "director"]' \
  --input employeeRanges='["50,500"]' \
  --input technologies='["salesforce"]' \
  --input maxContacts=10 \
  --input sequenceId="<your-sequence-id>" \
  --input emailAccountId="<your-email-account-id>"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `apolloConnectionKey` | Yes | Your Apollo connection key |
| `personTitles` | No | Job titles to search |
| `personSeniorities` | No | Seniority levels |
| `personLocations` | No | Where people live |
| `organizationDomains` | No | Employer domains |
| `employeeRanges` | No | Headcount ranges |
| `technologies` | No | Technologies used by employer |
| `maxContacts` | No | Max people to process (1-100, default 25) |
| `sequenceId` | Yes | Apollo sequence (emailer campaign) ID |
| `emailAccountId` | Yes | Apollo email account ID to send from |

**What it does under the hood:**

1. Searches Apollo's people database with your ICP filters
2. Loops through results, creating each as an Apollo contact (dedup enabled)
3. Collects created contact IDs
4. Adds all contacts to the specified sequence in a single API call
5. Returns pipeline summary (found -> created -> enrolled)

**Finding your sequence and email account IDs:**

Use the One CLI to search for sequences:
```bash
one --agent actions execute apollo \
  conn_mod_def::GJz2BqHQQLU::bmUbbCglQh2KqfGP0IXpOA \
  <your-connection-key> \
  --query-params '{"q_name":"your sequence name","per_page":"5"}'
```

## Apollo API Notes

- **Rate limits**: 600 calls/hour per endpoint on most plans.
- **People Search** does not return emails or phones. Use the Enrich Person flow to get contact details.
- **Enrichment consumes credits** on your Apollo plan.
- **Master API key** may be required for sequence and people search endpoints.
- **50,000 record display limit**: Search results cap at 500 pages of 100 results. Use tighter filters to narrow results.

## Adapting These Flows

These flows are templates. Fork and modify them for your use case:

- **Bulk enrichment**: Replace single enrichment with the bulk endpoints (`/api/v1/people/bulk_match`, `/api/v1/organizations/bulk_enrich`).
- **CRM sync**: Chain any flow into a HubSpot, Salesforce, or Attio action to push enriched data to your CRM.
- **Lead scoring**: Add a code step after enrichment to score leads based on seniority, company size, or tech stack.
- **Email verification**: Filter enriched contacts by `emailStatus === 'verified'` before adding to sequences.
- **Slack alerts**: Pipe prospect-to-sequence results into a Slack notification for your sales team.

The orchestration logic is in the flow's `code` steps. Read them to understand the parameter construction, pagination, and data extraction patterns -- then build your own variations.
