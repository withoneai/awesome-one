<p align="center">
  <img src="https://assets.withone.ai/banners/awesome.png" alt="Awesome One — Open-source tools, templates, and examples built on the One platform." style="border-radius: 5px;">
</p>

<h3 align="center">Awesome One</h3>
<p align="center">Open-source tools, templates, and examples built on the <a href="https://withone.ai">One</a> platform. <br />Ready to clone, customize, and deploy.</p>

<p align="center">
  <a href="https://withone.ai"><strong>Website</strong></a>
  &nbsp;·&nbsp;
  <a href="https://withone.ai/docs"><strong>Docs</strong></a>
  &nbsp;·&nbsp;
  <a href="https://app.withone.ai"><strong>Dashboard</strong></a>
  &nbsp;·&nbsp;
  <a href="https://withone.ai/changelog"><strong>Changelog</strong></a>
  &nbsp;·&nbsp;
  <a href="https://x.com/withoneai"><strong>X</strong></a>
  &nbsp;·&nbsp;
  <a href="https://linkedin.com/company/withoneai"><strong>LinkedIn</strong></a>
</p>

---

**[Flows](./flows/)**

*218+ automation workflows rebuilt from the most popular n8n templates. Each flow connects real platforms (Gmail, Slack, Sheets, etc.) and runs with a single command. Agent-native — paste any flow's URL into Claude Code or Cursor and it sets itself up.*

```bash
one flow execute n8n-1954-ai-agent-chat --input question="What is RAG?"
```

[Browse all n8n flows →](./flows/n8n/)

---

**[Link](./link/)**

*Drop-in connection onboarding page for agencies. Your customers connect their integrations (Gmail, Slack, etc.) through a branded card. Clone and deploy, or [paste a prompt](./link/PROMPT.md) into Lovable/Bolt/v0 to generate it instantly.*

---

**[Inbox Run](./inbox-run/)**

*Two thousand emails triaged in five seconds. [TypeSafe Jev](https://typesafe.ai) answers four typed questions about every conversation in a Gmail mailbox — what it is, whether it was sent to a list, whether it needs you, how urgent it is — and One acts on the answers: labels the mail, archives the bulk, writes a ledger to Google Sheets, creates a HubSpot contact for every lead, and posts a summary to Slack. Zero npm dependencies, and every archive is reversible.*

```bash
cd inbox-run && cp .env.example .env && node fetch-batch.js 5000 && node server.js
```

[View Inbox Run →](./inbox-run/)

---

**[Dev Pulse](./dev-pulse/)**

*Real-time engineering command center. Connects GitHub, Linear, Slack, and Google Calendar with live webhook streaming, an AI chat panel powered by One's MCP server, and natural-language automations. Built with Next.js, Claude, and SQLite.*

```bash
cd dev-pulse && cp .env.example .env.local && npm install && npm run dev
```

[View Dev Pulse →](./dev-pulse/)
