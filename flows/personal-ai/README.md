---
name: personal-ai
description: |
  Personal AI messaging flow for the One CLI. Send messages to a Personal AI
  persona and get AI-generated responses with session continuity.
triggers:
  - "personal ai"
  - "personal-ai"
  - "ai message"
  - "/personal-ai"
---

# Personal AI Flows

Ready-to-run AI messaging via the [One CLI](https://github.com/withoneai/one).

## Setup

```bash
npm i -g @withone/cli        # Install One CLI
one add personal-ai                # Connect your Personal AI account
one --agent list                   # Find your connection key
```

## Flows

### Send Message

Send a message to a Personal AI persona and receive an AI-generated response.
Supports session continuity, context injection, and memory stacking.

```bash
one flow execute personal-ai-send-message.flow.json \
  --input personalAiConnectionKey="<your-key>" \
  --input text="What is an SLM?" \
  --input domainName="product-demo-jebzrhw"
```

**Inputs:**

| Input | Required | Description |
|-------|----------|-------------|
| `personalAiConnectionKey` | Yes | Your Personal AI connection key |
| `text` | Yes | Message to send to the AI |
| `domainName` | Yes | AI persona domain name (hyphenated text under the AI's name) |
| `context` | No | Additional context (e.g., "Reply in one sentence") |
| `sessionId` | No | Session ID to continue a conversation |
| `userName` | No | Name of the user sending the message |
| `isStack` | No | Set `true` to also add the message to the AI's memory |

**What it does under the hood:**

1. Builds the message payload with text, domain name, and optional settings
2. Sends via Personal AI API (`POST /v1/message`)
3. Returns AI response with confidence score and session ID for continuation
