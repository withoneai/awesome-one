# n8n Flows for One CLI

> **218 of the most popular n8n workflows, rebuilt for One CLI.**
> Each flow runs with a single command — no drag-and-drop, no self-hosting, no manual credential wiring.

## Agent-native

These flows are designed to be used by AI agents. Drop any flow's URL into **Claude Code**, **Codex**, **Cursor**, **Windsurf**, **OpenClaw**, or any coding agent — it will read the README, connect the required platforms, and run the flow for you. No manual setup.

```
> Set up and run this flow: https://github.com/withoneai/awesome-one/tree/main/flows/n8n/ai-agent-chat
```

## Or run it yourself

```bash
# Connect a platform once
one add slack

# Run any flow
one flow execute n8n-1954-ai-agent-chat --input question="How does RAG work?"
```

That's it. No importing JSONs. No configuring nodes. No UI.

---

## All Flows

| # | Flow | Description | Platforms | n8n Views |
|---|------|-------------|-----------|-----------|
| 1 | [AI agent chat](./ai-agent-chat/) | An AI-powered chat agent that can search the web to answer user questions. Takes... | Exa, Slack | 1.4M |
| 2 | [Build your first AI agent](./build-first-agent/) | A beginner-friendly AI agent that demonstrates tool use: takes a question, searc... | Exa, Slack | 801.9K |
| 3 | [HTTP Data Fetcher with AI Summary](./api-endpoint/) | Fetch data from any URL, have Claude AI summarize and analyze the content, then ... | Firecrawl, Slack | 449.5K |
| 4 | [Scrape and summarize webpages with AI](./scrape-summarize-webpages/) | Scrapes a webpage using Firecrawl to extract its content, then uses Claude to ge... | Firecrawl, Slack | 380.0K |
| 5 | [Hello World — Random Quote to Slack](./very-quick-quickstart/) | A simple hello-world flow: fetches a random inspirational quote from the ZenQuot... | Slack | 317.4K |
| 6 | [AI Viral Video Script Generator](./generate-viral-videos-5338/) | Takes a video concept, uses Claude AI to generate creative viral video scripts w... | Google Sheets, Slack | 309.8K |
| 7 | [RAG chatbot for company documents using Google Drive and Gemini](./rag-chatbot-company/) | A RAG-style chatbot that answers employee questions using company documents stor... | Google Drive, Slack | 284.3K |
| 8 | [AI Web Research Agent](./rag-google-drive/) | Takes a research question, uses Exa to search the web for relevant sources, Fire... | Exa, Firecrawl, Slack | 277.5K |
| 9 | [Chat with a database using AI](./chat-database/) | Ask questions about data in a BigQuery database using natural language. Takes a ... | Bigquery, Slack | 261.5K |
| 10 | [AI Video Content Planner](./generate-videos-google/) | Takes a topic, uses Claude AI to generate multiple video concepts with full scri... | Google Sheets, Google Docs | 253.2K |
| 11 | [AI Video Generation & Multi-Platform Publish](./ai-video-gen-multiplatform/) | Claude AI generates creative video concepts with scene descriptions, image promp... | Google Sheets, Slack, Discord | 247.9K |
| 12 | [AI Video Content Planner](./generate-auto-post-videos/) | Generate video content ideas and full scripts using Claude AI. Produces concepts... | Google Sheets, Slack | 233.0K |
| 13 | [Viral Video Script Generator](./generate-viral-videos-8642/) | Generate viral short-form video scripts using Claude AI with trend analysis. Pro... | Google Sheets, Exa, Slack | 218.8K |
| 14 | [Business Email Finder](./scrape-business-emails/) | Takes a business type and location, uses Exa to find relevant businesses, Firecr... | Exa, Firecrawl, Google Sheets | 207.2K |
| 15 | [AI Landing Page Analyzer](./analyze-landing-page/) | Takes a URL, scrapes the landing page with Firecrawl (HTML + markdown + links), ... | Firecrawl, Slack | 204.6K |
| 16 | [Gmail Inbox Analyzer — AI Email Categorizer](./learn-basics-in/) | Fetch recent emails from Gmail, use Claude AI to categorize and prioritize them,... | Gmail, Slack | 197.8K |
| 17 | [AI Research Chat — Ask a Question, Get an Answer](./chat-local-llms/) | Ask any question, search the web for relevant sources via Exa, have Claude AI an... | Exa, Slack | 186.8K |
| 18 | [Generate leads with Google Maps](./generate-leads-google/) | Automated lead generation pipeline: searches for businesses using Exa, scrapes t... | Exa, Firecrawl, Google Sheets | 176.5K |
| 19 | [Build your first AI data analyst chatbot](./build-first-data/) | AI data analyst chatbot: takes a question about your data, fetches transactions ... | Google Sheets, Slack | 169.2K |
| 20 | [Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts](./linkedin-content-creation/) | LinkedIn content pipeline: Claude AI generates trending topic ideas, researches ... | Linked In | 152.3K |
| 21 | [Extract text from a PDF file](./extract-text-pdf/) | PDF text extraction pipeline: searches Gmail for emails with PDF attachments, ex... | Gmail, Slack | 150.7K |
| 22 | [Ask questions about a PDF using AI](./ask-questions-about/) | RAG-style Q&A pipeline: searches Google Drive for documents, retrieves their con... | Google Sheets, Slack, Exa | 142.8K |
| 23 | [Data Transformer: Fetch, Transform, and Post JSON to Slack](./learn-json-basics/) | Data transformer pipeline: fetches JSON data from a public API, transforms and e... | Slack | 133.9K |
| 24 | [Basic automatic Gmail email labelling with OpenAI and Gmail API](./basic-automatic-gmail/) | Gmail auto-categorizer: fetches recent emails from Gmail, uses Claude AI to cate... | Gmail, Slack | 127.9K |
| 25 | [Joining different datasets](./joining-different-datasets/) | Data merger pipeline: fetches data from two different API endpoints, merges and ... | Slack | 126.3K |
| 26 | [Automated web scraping: email a CSV, save to Google Sheets & Microsoft Excel](./web-scraping-email/) | Scrapes a target URL with Firecrawl, uses Claude AI to extract structured data (... | Firecrawl, Google Sheets, Gmail | 126.1K |
| 27 | [Chat with PDF docs using AI (quoting sources)](./chat-pdf-sources/) | Searches Google Drive for documents, uses Firecrawl to extract content from a do... | Exa, Firecrawl, Slack | 116.5K |
| 28 | [Talk to your Google Sheets data using AI](./talk-google-sheets/) | Reads data from a Google Sheets spreadsheet, uses Claude AI to analyze and answe... | Google Sheets, Slack | 114.5K |
| 29 | [AI Short-Form Video Script Generator](./short-form-video-generator/) | Claude AI creates professional short-form video scripts with AI image prompts, s... | Slack, Discord | 113.2K |
| 30 | [RAG chatbot with retrieval augmented generation](./local-chatbot-retrieval/) | Uses Exa search to retrieve relevant knowledge for a user question, then Claude ... | Exa, Slack | 112.8K |
| 31 | [Lead generation system: find businesses, scrape emails, qualify leads](./lead-generation-system/) | Uses Exa to find businesses by type and location, Firecrawl to scrape their webs... | Exa, Firecrawl, Google Sheets | 105.9K |
| 32 | [Scrape and store data from multiple website pages](./scrape-store-data/) | Scrapes multiple URLs with Firecrawl in a loop, uses Claude AI to compile and an... | Firecrawl, Slack | 103.7K |
| 33 | [Suggest meeting slots using AI](./suggest-meeting-slots/) | Fetches recent Gmail messages to find meeting requests, checks Google Calendar a... | Gmail, Google Calendar | 101.6K |
| 34 | [Backup workflows to GitHub (adapted: flow list summary to Slack)](./backup-workflows-github/) | Fetches the current One CLI flow list, uses Claude AI to analyze and summarize t... | Slack | 100.6K |
| 35 | [Personalize marketing emails with AI](./personalize-marketing-emails/) | Takes customer data (name, product, feedback), uses Claude AI to analyze sentime... | Gmail, Slack | 95.7K |
| 36 | [RAG knowledge retrieval with Exa and Claude](./rag-starter-template/) | Takes a user question, performs knowledge retrieval using Exa web search, feeds ... | Exa, Slack | 95.1K |
| 37 | [Gmail AI email manager](./gmail-email-manager/) | Fetches recent emails from Gmail inbox, uses Claude AI to triage and categorize ... | Gmail, Gmail, Slack | 93.7K |
| 38 | [Multi-tool research chain (Exa + Firecrawl + Claude)](./build-mcp-server/) | Chains multiple tools together: Exa searches for relevant pages, Firecrawl scrap... | Exa, Firecrawl, Slack | 91.4K |
| 39 | [Web search chatbot with Exa and Claude](./web-search-chatbot-2026/) | Takes a user question, searches the web with Exa for current information, feeds ... | Exa, Slack | 90.5K |
| 40 | [Company enrichment from website content](./company-enrichment/) | Scrapes a company website with Firecrawl, uses Claude AI to extract structured d... | Firecrawl, Google Sheets, Slack | 90.4K |
| 41 | [Chat with database via Claude (adapted: data analysis to Slack)](./chat-postgresql/) | Takes a natural language question about data, uses Claude AI to generate analysi... | Exa, Slack | 85.7K |
| 42 | [AI WordPress Blog Post Writer](./wordpress-post-ai/) | Takes a set of keywords, Claude AI researches and writes a complete SEO-optimize... | Word Press | 85.5K |
| 43 | [Date and time calculator with Claude formatting](./working-dates/) | Takes a date/time query (calculations, formatting, timezone conversions), uses C... | Slack | 85.1K |
| 44 | [Image generation API research and recommendations](./flux-image-generator/) | Researches image generation APIs and services using Exa search, uses Claude AI t... | Exa, Slack | 84.8K |
| 45 | [YouTube video summarizer](./summarize-youtube/) | Takes a YouTube URL, scrapes the page content with Firecrawl to extract transcri... | Firecrawl, Slack | 83.8K |
| 46 | [AI Email Summary Agent](./email-summary-agent/) | Fetches recent Gmail inbox emails, uses Claude AI to summarize all messages into... | Gmail, Slack | 82.6K |
| 47 | [AI Personal Assistant Daily Briefing](./personal-assistant-4723/) | Fetches Gmail inbox and Google Calendar events, uses Claude AI to create a compr... | Gmail, Google Calendar, Slack | 82.3K |
| 48 | [AI Supabase File Chat Agent](./supabase-file-chat/) | Lists storage buckets and files from Supabase, lets users ask questions about th... | Supabase, Slack | 80.1K |
| 49 | [AI Job Application Tracker](./job-application-tracker/) | Searches Gmail for job-related emails (applications, interviews, offers, rejecti... | Gmail, Google Sheets | 79.8K |
| 50 | [AI Stock Analysis Report Generator](./stock-analysis-reports/) | Uses Exa to search for recent stock news and technical analysis data, Claude AI ... | Exa, Slack | 79.1K |
| 51 | [AI Sales Web Researcher](./sales-web-researcher/) | Takes a company name, uses Exa for web search and Firecrawl for deep scraping of... | Exa, Firecrawl, Google Sheets | 77.9K |
| 52 | [AI Deep Research Agent](./deep-research-agent-2878/) | Performs multi-query Exa search for comprehensive research, deep scrapes top res... | Exa, Firecrawl, Notion | 76.6K |
| 53 | [Autonomous AI Crawler](./autonomous-ai-crawler/) | Uses Exa to search for pages matching a query, Firecrawl to scrape multiple page... | Exa, Firecrawl, Slack | 74.3K |
| 54 | [Gmail AI Auto-Responder with Slack Review](./gmail-auto-responder/) | Fetches unread Gmail emails, uses Claude AI to assess each email and draft conte... | Gmail, Slack | 72.9K |
| 55 | [Calendar Schedule Optimizer](./calendar-schedule-optimizer/) | Lists Google Calendar events for the current week, uses Claude AI to analyze the... | Google Calendar, Slack | 71.8K |
| 56 | [AI Tech Newsletter via Gmail](./tech-newsletter-gmail/) | Uses Exa to search for trending tech stories across multiple topics, Claude AI c... | Exa, Gmail | 68.9K |
| 57 | [Calendar AI Scheduling Assistant](./calendar-ai-assistant/) | Fetches Google Calendar events, uses Claude AI to help with scheduling decisions... | Google Calendar, Slack | 68.8K |
| 58 | [Google Drive Document Summarizer to Notion](./audio-doc-summarizer/) | Lists files from Google Drive, uses Claude AI to summarize document contents, an... | Google Drive, Notion, Slack | 67.8K |
| 59 | [AI Customer Support Agent](./ai-customer-support/) | Takes a customer question, uses Exa to search for relevant knowledge base conten... | Exa, Slack | 67.5K |
| 60 | [Google Maps Business Lead Scraper](./google-maps-leads/) | Searches for businesses via Exa, scrapes their websites with Firecrawl for conta... | Exa, Firecrawl, Google Sheets, Slack | 67.4K |
| 61 | [Pre-Call Research Brief Generator](./pre-call-research/) | Fetches today's meetings from Gmail/Calendar, searches Exa for recent company ne... | Google Calendar, Exa, Slack | 67.1K |
| 62 | [AI Chat with Memory via Slack](./ai-chat-with-memory/) | Takes a user question and optional conversation context, uses Claude AI to gener... | Slack | 66.0K |
| 63 | [HR CV analyzer and candidate ranker](./hr-cv-analysis/) | Automates HR CV analysis by listing files from a Google Drive folder, using Clau... | Google Drive, Google Sheets | 65.6K |
| 64 | [Structured web scraper with AI](./scrape-web-structured-json/) | Scrapes any web page using Firecrawl, uses Claude to extract structured JSON dat... | Firecrawl, Slack | 65.4K |
| 65 | [Data preparation and transformation pipeline](./preparing-data-service/) | Fetches raw data from a URL, uses a code step to transform, clean, and normalize... | Firecrawl, Google Sheets | 64.8K |
| 66 | [AI research assistant with Exa and Claude](./private-ai-assistant/) | A private AI research assistant that takes a topic, searches for relevant source... | Exa, Slack | 63.0K |
| 67 | [Website SEO analyzer](./website-seo-analyzer/) | Performs an on-page SEO audit by scraping any website URL with Firecrawl, using ... | Firecrawl, Gmail | 62.1K |
| 68 | [Google Maps business scraper](./google-maps-scraper/) | Scrapes business data from Google Maps by searching via Exa for businesses in a ... | Exa, Firecrawl, Google Sheets | 61.9K |
| 69 | [Chat with Google Sheets data](./chat-google-sheet/) | Reads data from a Google Sheets spreadsheet, uses Claude to answer natural langu... | Google Sheets, Slack | 61.8K |
| 70 | [Gmail campaign sender: bulk personalized emails from Sheets](./gmail-campaign-sender/) | Reads recipient data from Google Sheets, uses Claude AI to personalize each emai... | Google Sheets, Gmail, Slack | 58.3K |
| 71 | [AI chatbot with knowledge search](./voice-chatbot-elevenlabs/) | Adapted from the voice AI chatbot concept. Takes a user question, searches for r... | Exa, Slack | 58.1K |
| 72 | [Interactive AI agent with chat and tools](./interactive-agent-chat/) | An AI agent with a chat interface. Takes a user question, searches the web via E... | Exa, Slack | 57.4K |
| 73 | [WordPress SEO-optimized post generator](./wordpress-seo-posts/) | Researches a keyword using Exa, uses Claude to write an SEO-optimized blog post ... | Exa, Word Press | 56.8K |
| 74 | [Lead generation agent: search, scrape, qualify, outreach](./lead-generation-agent/) | Automated lead generation pipeline. Uses Exa to search for prospects, Firecrawl ... | Exa, Firecrawl, Gmail, Google Sheets, Slack | 56.7K |
| 75 | [Community insights: search, analyze sentiment, save to Sheets](./community-insights-qdrant/) | Searches community discussions via Exa, uses Claude AI to analyze sentiment, ide... | Exa, Google Sheets, Slack | 56.1K |
| 76 | [Conversational AI agent with web search](./conversational-agent-custom/) | A multi-turn conversational AI agent. Takes a user question, performs Exa web se... | Exa, Slack | 54.8K |
| 77 | [AI SQL query generator from natural language](./generate-sql-queries/) | Takes a natural language question and a database schema description, uses Claude... | Slack | 54.7K |
| 78 | [Ultimate scraper: multi-URL scrape with AI extraction](./ultimate-scraper/) | Scrapes multiple URLs using Firecrawl, uses Claude AI to extract and structure d... | Firecrawl, Slack | 54.6K |
| 79 | [Data transformation tutorial: code step examples](./learn-expressions/) | Adapted from the n8n expressions tutorial. Demonstrates various code step transf... | Slack | 53.3K |
| 80 | [Bulk email from Sheets: read recipients, send personalized Gmail](./bulk-gmail-sheets/) | Reads recipient data from a Google Sheets spreadsheet, uses Claude AI to generat... | Gmail, Google Sheets, Slack | 53.2K |
| 81 | [AI prompt generator: create optimized prompts for any task](./prompt-generator/) | Takes a rough task description, uses Claude AI to generate an optimized, structu... | Slack | 52.1K |
| 82 | [File Data Reader & Analyzer](./file-data-reader/) | Fetches a file from a URL, uses Claude AI to extract and transform the data into... | Slack | 51.4K |
| 83 | [Web scraping to Sheets: scrape URLs, AI structures data, save to Sheets](./web-scraping-jina-sheets/) | Scrapes one or more URLs using Firecrawl, uses Claude AI to extract and structur... | Firecrawl, Google Sheets, Slack | 51.3K |
| 84 | [Notion Knowledge Base AI Assistant](./notion-kb-ai-assistant/) | Searches a Notion knowledge base for relevant pages matching a user question, re... | Notion, Slack | 50.6K |
| 85 | [Notion AI Content Generator](./notion-ai-content-generator/) | Searches Notion for existing pages on a topic, uses Claude AI to generate new co... | Notion, Slack | 49.0K |
| 86 | [AI Code Snippet Generator](./code-snippet-generator/) | Takes a coding topic or problem description, uses Claude AI to generate well-doc... | Slack | 48.2K |
| 87 | [AI Call Scheduler](./call-scheduler/) | Checks Airtable for contacts that need calls scheduled, fetches Google Calendar ... | Airtable, Google Calendar, Slack | 47.2K |
| 88 | [AI Customer Inbox Responder](./customer-inbox-responder/) | Fetches recent unread emails from Gmail, uses Claude AI to analyze each message ... | Gmail, Slack | 47.1K |
| 89 | [WordPress AI content generator](./wordpress-content-generator/) | Uses Claude to generate a complete blog article from a topic prompt, including t... | Word Press | 46.9K |
| 90 | [AI Data Report Formatter](./data-report-formatter/) | Takes JSON data input, uses Claude AI to analyze, format, and transform it into ... | Slack | 46.0K |
| 91 | [AI Invoice Data Extractor](./invoice-extractor/) | Fetches emails from Gmail that contain invoices, uses Claude AI to extract struc... | Gmail, Google Sheets, Slack | 45.6K |
| 92 | [AI API Response Tester](./api-tester/) | Fetches data from a user-provided API URL, uses Claude AI to analyze the respons... | Slack | 45.2K |
| 93 | [AI Meeting Scheduler — Smart Slot Suggestions to Slack](./meeting-scheduler/) | Check calendar availability via Google Drive file listing, have Claude AI sugges... | Google Drive, Slack | 45.1K |
| 94 | [PDF Document RAG from Google Drive](./pdf-rag-drive/) | Searches Google Drive for documents matching a user question, exports their cont... | Google Drive, Slack | 45.1K |
| 95 | [Batch Processor — Loop, Transform & Collect to Slack](./batch-processor/) | Takes a comma-separated list of items, loops over each one, uses Claude AI to tr... | Slack | 45.0K |
| 96 | [Workflow Inventory to Google Drive](./workflow-inventory/) | Lists all One CLI flow files from the local flows directory, uses Claude AI to s... | Google Drive, Slack | 44.9K |
| 97 | [Chat with Any Data — Exa Search + Firecrawl Scrape + AI](./chat-any-data/) | Ask a question about any topic: Exa searches the web for relevant sources, Firec... | Exa, Firecrawl, Slack | 44.6K |
| 98 | [RSS Feed Generator — Firecrawl Scrape + AI Extraction to Slack](./rss-feed-generator/) | Scrapes a website with Firecrawl to extract its content, uses Claude AI to ident... | Firecrawl, Slack | 44.6K |
| 99 | [Slack Chatbot — Exa Search + Claude AI Answers](./slack-chatbot/) | Takes a question via input, searches the web with Exa for relevant sources, uses... | Exa, Slack | 44.3K |
| 100 | [SEO Keyword Tracker — Exa Research + AI Analysis to Sheets](./seo-keyword-tracker/) | Searches for ranking content around target keywords via Exa, uses Claude AI to a... | Exa, Google Sheets | 44.2K |
| 101 | [Chart & Data Analyzer — Firecrawl Scrape + Claude AI to Slack](./chart-analyzer/) | Scrapes a URL containing charts, tables, or data visualizations using Firecrawl,... | Firecrawl, Slack | 43.8K |
| 102 | [AI LinkedIn Posts — Research, Generate, Publish, Track & Email](./linkedin-posts-ai/) | Uses Exa to research a topic, Claude AI generates an engaging LinkedIn post, pub... | Exa, Linked In, Google Sheets, Gmail | 43.6K |
| 103 | [Email Organizer — Gmail Fetch + AI Categorization to Slack](./email-organizer/) | Fetches recent emails from Gmail inbox, uses Claude AI to categorize each with s... | Gmail, Slack | 43.5K |
| 104 | [Webpage Generator — Claude AI Creates HTML, Posts to Slack](./webpage-generator/) | Takes a description of a desired webpage, uses Claude AI to generate a complete,... | Slack | 43.4K |
| 105 | [AI Model Comparison — Exa Research + Claude Analysis to Slack](./llm-comparison/) | Researches open-source and proprietary LLM options via Exa, uses Claude AI to co... | Exa, Slack | 42.9K |
| 106 | [Doc/Image Parser — Google Drive to Claude OCR to Slack](./doc-image-parser/) | Fetches files from Google Drive, uses Claude AI to extract text and structured d... | Google Drive, Slack | 42.4K |
| 107 | [WordPress Content Pipeline — Claude writes, publishes, tracks in Sheets](./wordpress-content-pipeline/) | Uses Claude AI to generate blog content on a given topic, publishes the post to ... | Word Press, Google Sheets, Slack | 40.9K |
| 108 | [IT Ops Slack Bot — Exa Knowledge Base + Claude Answers](./it-ops-slackbot/) | Takes an IT question, searches a knowledge base using Exa for relevant documenta... | Exa, Slack | 40.8K |
| 109 | [Voice Script Writer — Claude generates speech-optimized scripts to Slack](./voice-script-writer/) | Takes a topic or brief, uses Claude AI to write scripts optimized for text-to-sp... | Slack | 40.5K |
| 110 | [Conversational AI — Question + Exa Research + Claude Answer to Slack](./conversational-ai/) | Takes a conversational question, enriches it with Exa web search for real-time c... | Exa, Slack | 40.2K |
| 111 | [AI Reasoning Demo — Claude Chain-of-Thought to Slack](./ai-reasoning-demo/) | Takes a question or problem, uses Claude AI with explicit chain-of-thought reaso... | Slack | 40.1K |
| 112 | [SEO Blog Posts — Exa Keyword Research + Claude Writing + Sheets Tracking](./seo-blog-posts/) | Uses Exa for keyword research and competitive analysis, Claude AI to write SEO-o... | Exa, Google Sheets, Slack | 39.2K |
| 113 | [Data File Processor — Fetch, Transform, and Report to Slack](./data-file-processor/) | Fetches data files from Google Drive, uses Claude AI to analyze and transform th... | Google Drive, Slack | 39.2K |
| 114 | [Invoice Gmail to Sheets — Search Gmail, Claude extracts data, save to Sheets](./invoice-gmail-to-sheets/) | Searches Gmail for invoice emails, uses Claude AI to extract invoice data (amoun... | Gmail, Gmail, Google Sheets, Slack | 38.2K |
| 115 | [Vision AI Scraper — Firecrawl + Claude Structured Extraction to Sheets](./vision-ai-scraper/) | Scrapes web pages using Firecrawl, uses Claude AI to extract structured data fro... | Firecrawl, Google Sheets, Slack | 37.3K |
| 116 | [Personal Assistant — Gmail + Calendar + Sheets daily brief to Slack](./personal-assistant-3905/) | Gathers today's Gmail inbox, Google Calendar events, and key data from Sheets, u... | Gmail, Google Calendar, Google Sheets, Slack | 36.8K |
| 117 | [Movie RAG Chatbot — Exa Search + Claude Recommendations to Slack](./movie-rag-chatbot/) | Takes a movie preference or question, uses Exa search to find relevant movie dat... | Exa, Slack | 36.0K |
| 118 | [Comedy Script Generator](./comedy-script-generator/) | Generate comedy video scripts using Claude AI and post them to Slack. Provide a ... | Slack | 35.9K |
| 119 | [Email Filter + Summarize — Gmail fetch, Claude categorizes, save to Sheets](./email-filter-summarize/) | Fetches emails from Gmail, uses Claude AI to categorize and summarize each email... | Gmail, Gmail, Google Sheets, Slack | 35.8K |
| 120 | [Google Drive File Summarizer](./drive-summarizer/) | List files from Google Drive, use Claude AI to summarize their content, and post... | Google Drive, Slack | 35.7K |
| 121 | [Meeting Next Steps Extractor](./meeting-next-steps/) | Pull today's calendar events and Drive transcripts, use Claude AI to extract act... | Google Calendar, Google Drive, Slack | 34.2K |
| 122 | [Documentation Expert Bot](./docs-expert-bot/) | A RAG-powered documentation bot that queries a Supabase knowledge base using Cla... | Supabase, Slack | 33.7K |
| 123 | [Voice Command Processor](./voice-command-processor/) | Process natural language voice commands into structured action plans using Claud... | Slack | 33.6K |
| 124 | [Human-in-the-Loop Email Responder](./human-loop-email/) | Fetch recent emails from Gmail, use Claude AI to draft replies, and post the dra... | Gmail, Slack | 33.2K |
| 125 | [AI Blog Automation for WordPress](./blog-automation-wordpress/) | Generate SEO-optimized blog posts with Claude AI and publish them directly to Wo... | Word Press | 33.2K |
| 126 | [Workflow Advisor](./workflow-advisor/) | Describe any business task and Claude AI will design a complete automation workf... | Slack | 33.0K |
| 127 | [AI Scheduling Assistant](./scheduling-assistant/) | Check Google Calendar availability, use Claude AI to suggest optimal meeting slo... | Google Calendar, Slack | 33.0K |
| 128 | [Deep Research Agent](./deep-research-agent-2883/) | Run multi-query Exa searches, deep-scrape top results with Firecrawl, and have C... | Exa, Firecrawl, Slack | 33.0K |
| 129 | [AI Code Review Analyzer](./code-review-analyzer/) | Submit a code snippet or file for Claude AI to review. Gets a thorough analysis ... | Slack | 33.0K |
| 130 | [Reddit Business Opportunity Analyzer](./reddit-biz-opportunities/) | Search Reddit-like discussions via Exa, use Claude AI to identify viable busines... | Exa, Google Sheets, Gmail | 32.9K |
| 131 | [Multi-Format Content Repurposer](./content-repurposer/) | Take one piece of content and use Claude AI to adapt it for multiple social medi... | Slack | 32.7K |
| 132 | [PDF and image text extraction with AI](./pdf-image-text-extraction/) | Lists files from Google Drive, downloads them, uses Claude AI to extract and str... | Google Drive, Slack | 32.6K |
| 133 | [AI-powered email management and summarization](./email-management-ai/) | Fetches recent emails from Gmail, uses Claude AI to organize, categorize, and pr... | Gmail, Google Drive | 32.2K |
| 134 | [AI stock fundamental analysis](./stock-fundamental-analysis/) | Researches stock financials using Exa web search, Claude AI analyzes fundamental... | Exa, Google Drive | 31.9K |
| 135 | [AI keyword generator and expander](./keyword-generator/) | Takes a seed keyword, uses Exa to find related search terms and trending queries... | Exa, Slack | 31.7K |
| 136 | [Sales cold calling pipeline with AI qualification](./sales-cold-calling-pipeline/) | Finds prospects via Exa web search, scrapes their websites with Firecrawl for de... | Exa, Firecrawl, Google Sheets | 31.7K |
| 137 | [Iterative content refinement with AI multi-pass](./content-refinement/) | Takes draft content, uses Claude AI in multiple refinement passes to iteratively... | Slack | 31.5K |
| 138 | [AI-powered website security audit](./website-security-audit/) | Scrapes a target website using Firecrawl, Claude AI analyzes security headers, S... | Firecrawl, Gmail | 31.3K |
| 139 | [AI conversational interview conductor](./conversational-interviews/) | Claude AI conducts a structured multi-question interview on a given topic, colle... | Google Sheets | 31.2K |
| 140 | [Invoice processor and extractor with AI](./invoice-processor/) | Fetches invoice emails from Gmail, Claude AI extracts structured data including ... | Gmail, Google Sheets | 31.1K |
| 141 | [Discord AI-powered question answering bot](./discord-ai-bot/) | Takes a user question, searches the web via Exa for relevant information, Claude... | Exa, Discord | 30.8K |
| 142 | [AI-powered stock market summary bot](./stock-market-summary/) | Searches for the latest market news via Exa, Claude AI summarizes market movemen... | Exa, Slack | 30.8K |
| 143 | [LinkedIn company search, AI scoring, and Sheets CRM](./linkedin-company-scorer/) | Searches for companies using Exa, scrapes their websites with Firecrawl, uses Cl... | Exa, Firecrawl, Google Sheets, Slack | 30.5K |
| 144 | [Auto-label incoming Gmail messages with AI](./gmail-auto-labeler/) | Fetches recent Gmail messages, uses Claude AI to classify each email into catego... | Gmail, Slack | 30.5K |
| 145 | [Scrape and summarize news site posts with AI](./news-scraper-summarizer/) | Scrapes a news site with Firecrawl, uses Claude AI to extract and summarize arti... | Firecrawl, Notion, Slack | 30.3K |
| 146 | [GitHub API documentation Q&A with web search and AI](./github-docs-chatbot/) | Answers questions about the GitHub API by searching for relevant documentation v... | Exa, Firecrawl, Slack | 30.1K |
| 147 | [Social media analysis and automated email generation](./social-media-email-gen/) | Reads prospect data from Google Sheets, scrapes their social media profiles with... | Google Sheets, Firecrawl, Gmail, Slack | 30.1K |
| 148 | [Qualify new leads in Google Sheets with AI](./lead-qualifier-sheets/) | Reads new leads from Google Sheets, uses Claude AI to qualify each lead based on... | Google Sheets, Exa, Slack | 29.6K |
| 149 | [API schema extractor and classifier](./api-schema-extractor/) | Takes an API documentation URL, scrapes it with Firecrawl, uses Claude AI to ext... | Firecrawl, Google Sheets, Slack | 29.4K |
| 150 | [Supabase document insertion, storage, and AI retrieval](./supabase-crud-rag/) | Fetches a document from Google Drive, stores its content in Supabase via SQL, an... | Google Drive, Supabase, Slack | 29.2K |
| 151 | [Deep research sales lead magnet agent](./deep-research-sales-lead/) | Takes a company or topic, performs deep web research via Exa, scrapes key source... | Exa, Firecrawl, Google Docs, Slack | 29.1K |
| 152 | [Google Calendar reminder system with AI and Slack](./calendar-reminder-slack/) | Fetches upcoming Google Calendar events, uses Claude AI to prioritize and format... | Google Calendar, Slack | 28.9K |
| 153 | [Uptime monitoring with Slack and Gmail alerts](./uptime-monitor/) | Reads a list of URLs from Google Sheets, checks each one via HTTP, logs results ... | Google Sheets, Slack, Gmail | 28.9K |
| 154 | [Email support agent with AI-powered Gmail replies](./email-support-agent/) | Fetches new support emails from Gmail, reads FAQ/knowledge data from Google Shee... | Gmail, Google Sheets, Slack | 28.9K |
| 155 | [Automate blog content creation with AI, Exa research, Gmail and Slack](./blog-content-creation/) | Researches a topic using Exa web search, generates an SEO-optimized blog article... | Exa, Gmail, Slack, Notion | 28.8K |
| 156 | [AI email analyzer with PDF processing and Google Sheets logging](./email-analyzer/) | Lists recent Gmail messages, uses Claude AI to analyze email content and extract... | Gmail, Google Sheets, Slack | 28.6K |
| 157 | [Automate competitor research with Exa AI, Notion and multi-agent analysis](./competitor-research/) | Searches for competitors of a given company using Exa web search, scrapes each c... | Exa, Firecrawl, Notion, Slack | 28.5K |
| 158 | [AI-powered customer support issue resolution with Slack and Notion](./customer-support-resolution/) | Analyzes customer support issues using AI text classification and sentiment anal... | Slack, Notion | 28.3K |
| 159 | [Generate AI-powered LinkedIn posts with content strategy and research](./ai-linkedin-posts/) | Takes a topic, researches it with Exa web search, generates a LinkedIn-optimized... | Exa, Gmail, Slack | 28.0K |
| 160 | [AI-powered social media content generator with strategic multi-stage pipeline](./social-media-content/) | Takes a content request, runs a multi-stage AI pipeline (intent extraction, stra... | Gmail, Slack | 28.0K |
| 161 | [Scrape any URL without getting blocked using Firecrawl](./anti-bot-web-scraper/) | Scrapes one or more URLs using Firecrawl (which handles anti-bot technologies), ... | Firecrawl, Google Sheets, Slack | 28.0K |
| 162 | [Turn YouTube videos into summaries, transcripts, and visual insights](./youtube-video-summarizer/) | Takes a YouTube video URL, scrapes the video page with Firecrawl, uses Claude AI... | Firecrawl, Google Sheets, Slack | 27.9K |
| 163 | [Business scraper with contact extraction via Firecrawl and Google Sheets](./business-scraper/) | Takes a list of business website URLs, scrapes each with Firecrawl, uses Claude ... | Firecrawl, Google Sheets, Slack | 27.7K |
| 164 | [Reply to emails with AI using Gmail and Claude](./email-reply-ai/) | Lists recent Gmail messages, uses Claude AI to analyze each email and generate c... | Gmail, Gmail, Slack | 27.6K |
| 165 | [Automated invoice processing with AI OCR and Google Sheets](./invoice-processing/) | Processes invoice documents by scraping content with Firecrawl or accepting text... | Firecrawl, Google Sheets, Slack | 27.5K |
| 166 | [AI image generator from text with content safety filtering](./ai-image-generator/) | Takes a text prompt, runs content safety classification with Claude AI to filter... | Gmail, Slack | 27.3K |
| 167 | [AI multi-tool showcase: chat, summarize, translate, code, and extract](./openai-examples-5in1/) | Demonstrates five AI capabilities in one flow: text chat/Q&A, content summarizat... | Google Sheets, Slack | 26.6K |
| 168 | [Automate image validation tasks using AI vision](./image-validation-ai/) | Downloads images from Google Drive, uses Claude AI vision to validate each image... | Google Drive, Google Sheets, Slack | 26.6K |
| 169 | [Export search console results to Google Sheets with AI analysis](./search-console-to-sheets/) | Scrapes a website with Firecrawl to identify SEO content, uses Claude AI to anal... | Firecrawl, Google Sheets, Slack | 26.4K |
| 170 | [AI stock market analyzer with Exa research and Sheets tracking](./ai-stock-analysis-sheets/) | Searches for latest stock market news and analysis using Exa, uses Claude AI to ... | Exa, Google Sheets, Slack | 26.4K |
| 171 | [Blog creator in brand voice using AI](./blog-brand-voice-ai/) | Scrapes existing blog posts from a website to learn brand voice, then uses Claud... | Firecrawl, Slack | 26.3K |
| 172 | [AI email categorizer with Gmail and Slack alerts](./ai-email-categorizer/) | Lists recent Gmail messages, uses Claude AI to categorize each email by type and... | Gmail, Google Sheets, Slack | 26.1K |
| 173 | [AI-powered web researcher with Exa search and Slack delivery](./ai-researcher-web-search/) | Uses Exa to search the web for a given research topic, scrapes the top results w... | Exa, Firecrawl, Slack | 25.7K |
| 174 | [Daily LinkedIn post publisher from Notion](./daily-linkedin-posts-notion/) | Fetches scheduled social media posts from a Notion database, uses Claude AI to p... | Notion, Slack | 25.5K |
| 175 | [Business lead scraper with AI cleaning to Google Sheets](./lead-scraper-sheets/) | Scrapes a business directory or listings page with Firecrawl, uses Claude AI to ... | Firecrawl, Google Sheets | 25.4K |
| 176 | [Daily news digest from web sources via email](./daily-news-digest-email/) | Searches the web for news on specified topics using Exa, uses Claude AI to summa... | Exa, Gmail | 25.1K |
| 177 | [AI research assistant with Exa web search and Slack Q&A](./perplexity-research-slack/) | Takes a question, searches the web with Exa to find authoritative answers, uses ... | Exa, Slack | 24.8K |
| 178 | [SEO seed keyword generator with AI and Google Sheets](./seo-seed-keywords-ai/) | Uses Claude AI to generate SEO seed keywords based on an ideal customer profile ... | Exa, Google Sheets | 24.8K |
| 179 | [Job listing finder with Exa search and Google Sheets](./job-finder-sheets/) | Searches for job listings matching specified criteria using Exa, uses Claude AI ... | Exa, Google Sheets | 24.6K |
| 180 | [AI appointment scheduler with Sheets and email confirmation](./appointment-scheduler-ai/) | Takes appointment requests, uses Claude AI to parse scheduling details and check... | Google Sheets, Gmail | 24.6K |
| 181 | [Web search chatbot with Exa and Firecrawl deep scraping](./web-search-chatbot-3189/) | Takes a user question, performs a web search with Exa, deep-scrapes the most rel... | Exa, Firecrawl, Slack | 24.6K |
| 182 | [Lead enrichment pipeline with Exa research and email outreach](./lead-enrichment-email/) | Takes lead names or companies from Google Sheets, uses Exa to research each lead... | Exa, Google Sheets, Gmail | 24.5K |
| 183 | [Blog content creator with Sheets tracking and email approval](./blog-content-approval/) | Reads blog topic ideas from Google Sheets, uses Claude AI to research and write ... | Google Sheets, Gmail, Exa | 24.3K |
| 184 | [AI-powered CV screening and candidate analysis](./cv-screening-ai/) | Reads job application data from Google Sheets, uses Claude AI to screen and scor... | Google Sheets, Slack | 24.2K |
| 185 | [AI logo concept generator with brand research and Drive storage](./logo-generator-drive/) | Researches a brand or company using Exa, uses Claude AI to generate detailed log... | Exa, Google Drive, Gmail | 24.0K |
| 186 | [Backup workflow configs to Google Drive](./backup-workflows-drive/) | Exports workflow configurations and settings as a JSON backup file, uploads it t... | Google Drive, Slack | 23.6K |
| 187 | [Audio transcription and AI summary to Google Drive](./audio-transcribe-summarize/) | Lists audio attachments from Gmail, uses Claude AI to generate transcription not... | Gmail, Gmail, Google Drive | 23.5K |
| 188 | [Generate AI Video from Prompt and Upload to Google Drive](./veo3-video-drive-upload/) | Takes a text prompt, uses Claude AI to generate an optimized video production br... | Google Drive, Exa, Slack | 23.4K |
| 189 | [AI-Powered API Data Fetcher and Analyzer](./ai-api-data-fetcher/) | Takes a natural language query, uses Claude AI to determine what data to fetch, ... | Exa, Firecrawl, Slack | 23.2K |
| 190 | [Website Content Scraper and SEO Keyword Extractor](./website-seo-keyword-extractor/) | Scrapes a website URL with Firecrawl, extracts structured content and SEO keywor... | Firecrawl, Exa, Google Sheets, Slack | 22.9K |
| 191 | [Extract Expenses from Emails and Add to Google Sheets](./email-expense-extractor/) | Searches Gmail for expense-related emails (receipts, invoices), uses Claude AI t... | Gmail, Google Sheets, Slack | 22.7K |
| 192 | [Download and Process a File from Google Drive](./download-file-google-drive/) | Downloads a file from Google Drive by file ID, analyzes its content with Claude ... | Google Drive, Slack | 22.5K |
| 193 | [AI Social Media Content Generator and Publisher](./social-content-generator/) | Takes a topic and target platforms, researches trending content via Exa, generat... | Exa, Google Sheets, Slack | 22.5K |
| 194 | [AI Knowledge Assistant with Google Drive Documents](./ai-assistant-drive-knowledge/) | Retrieves a document from Google Drive, processes it as a knowledge base with Cl... | Google Drive, Slack | 22.5K |
| 195 | [AI Video Script and Production Plan Generator](./ai-video-script-generator/) | Takes a text topic, researches trending content via Exa, generates a detailed vi... | Exa, Google Drive, Slack | 22.4K |
| 196 | [AI Social Video Content Planner with Captions and Logging](./social-video-content-planner/) | Generates a social media video content plan with Claude AI, creates optimized ca... | Google Sheets, Exa, Slack | 22.2K |
| 197 | [AI Lead Qualification Agent with Gmail and Google Sheets](./lead-qualification-agent/) | Reads lead data from a Google Sheet, uses Claude AI to score and qualify each le... | Google Sheets, Gmail, Slack | 22.2K |
| 198 | [AI Timesheet Generator from Gmail and Calendar to Google Sheets](./ai-timesheet-generator/) | Collects recent emails from Gmail, uses Claude AI to extract work activities and... | Gmail, Google Sheets, Slack | 22.0K |
| 199 | [Automate Gmail Inbox Organization with AI Categorization](./gmail-inbox-organizer/) | Searches recent Gmail messages, uses Claude AI to categorize each email (Work, S... | Gmail, Gmail, Slack | 21.9K |
| 200 | [AI Video Prompt Optimizer with Google Drive Storage](./veo3-video-optimizer-drive/) | Takes a simple video idea, optimizes the prompt using Claude AI for cinematic qu... | Google Drive, Exa, Slack | 21.9K |
| 201 | [Send PDF Attachments from Gmail to Google Drive with AI Filtering](./gmail-pdf-to-drive/) | Searches Gmail for emails with PDF attachments, uses Claude AI to classify which... | Gmail, Google Sheets, Slack | 21.9K |
| 202 | [Generate Monthly Financial Reports with AI Analysis](./financial-report-generator/) | Reads financial data from a Google Sheet, uses Claude AI to generate comprehensi... | Google Sheets, Gmail, Slack | 21.7K |
| 203 | [One-Click YouTube Shorts Script and Storyboard Generator](./youtube-shorts-generator/) | Takes a topic, researches trending short-form content via Exa, generates a compl... | Exa, Google Drive, Google Sheets, Slack | 21.7K |
| 204 | [Channel Message Composer & Sender](./teams-channel-messaging/) | Composes a professional channel message using Claude AI based on a topic and con... | Slack | 21.7K |
| 205 | [HackerNews Trend Extractor & Report Generator](./hackernews-to-docs/) | Fetches trending HackerNews discussions via Exa search, uses Claude AI to transf... | Exa, Google Sheets, Slack | 21.5K |
| 206 | [Multi-Source Research Agent with Knowledge Synthesis](./graphrag-research-agent/) | Takes a research question, queries multiple knowledge domains via Exa search, us... | Exa, Slack | 21.0K |
| 207 | [AI Email & Calendar Management Assistant](./email-calendar-ai/) | Fetches recent Gmail messages, uses Claude AI to classify, prioritize, and sugge... | Gmail, Google Sheets, Slack | 20.8K |
| 208 | [Conversational Q&A Agent with Web Research](./conversational-qa-agent/) | Takes a user question with optional image context, researches the topic via Exa ... | Exa, Slack | 20.7K |
| 209 | [Short-Form Video Content Generator](./youtube-shorts-content/) | Researches trending topics via Exa, uses Claude AI to generate engaging short-fo... | Exa, Google Sheets, Slack | 20.6K |
| 210 | [Webpage Content Extractor & Analyzer](./webpage-content-extractor/) | Scrapes a webpage via Firecrawl, uses Claude AI to extract structured content an... | Firecrawl, Google Sheets, Slack | 20.6K |
| 211 | [LinkedIn Outreach Content Generator with Notion](./linkedin-outreach-notion/) | Reads content snippets from a Notion database, researches relevant context via E... | Notion, Exa, Google Sheets, Slack | 20.5K |
| 212 | [Trend-Driven Social Content Generator](./trend-social-content/) | Extracts trending topics via Exa search, uses Claude AI to score trends and gene... | Exa, Google Sheets, Gmail, Slack | 20.5K |
| 213 | [Video Content Repurposing Planner](./youtube-to-shorts-repurpose/) | Analyzes YouTube video pages via Firecrawl scraping, uses Claude AI to identify ... | Firecrawl, Google Sheets, Slack | 20.5K |
| 214 | [LinkedIn Hiring Signal Scraper & Prospecting Tool](./linkedin-hiring-signals/) | Scrapes LinkedIn job listing pages via Firecrawl, uses Claude AI to extract hiri... | Firecrawl, Google Sheets, Slack | 20.4K |
| 215 | [Instagram Content Schedule Generator](./instagram-content-schedule/) | Reads content strategy inputs and blog post data from Google Sheets, researches ... | Google Sheets, Exa, Slack | 20.4K |
| 216 | [AI Task Manager with Notion](./task-manager-notion/) | Reads tasks from a Notion database, uses Claude AI to prioritize, organize, and ... | Notion, Google Sheets, Slack | 20.3K |
| 217 | [AI Security & Compliance News Digest](./security-digest-email/) | Searches for the latest security, privacy, and compliance news via Exa, uses Cla... | Exa, Gmail, Slack | 20.2K |
| 218 | [SEO Keyword Research & Volume Analyzer](./seo-keyword-volume/) | Takes a list of SEO keywords, researches search volume and competition data via ... | Exa, Google Sheets, Slack | 20.1K |

---

## Getting Started

1. **Install One CLI**
   ```bash
   npm i -g @anthropic/one
   ```

2. **Connect your platforms**
   ```bash
   one add slack
   one add gmail
   one add google-sheets
   # ... whatever the flow needs
   ```

3. **Pick a flow and run it**
   ```bash
   one flow execute <flow-key> --input <param>=<value>
   ```

> Run `one list` to see all your connected platforms.
> Run `one flow list` to see all available flows.

---

## Why One CLI instead of n8n?

| | n8n | One CLI |
|---|-----|---------|
| **Setup** | Self-host or pay for Cloud | `npm i -g @anthropic/one` |
| **Connect a platform** | OAuth config per node in UI | `one add gmail` |
| **Run a workflow** | Import JSON → configure → execute in UI | `one flow execute <key>` |
| **Credentials** | Stored in n8n's database | Managed by One — connect once, use everywhere |
| **Scheduling** | Built-in cron in UI | `cron`, CI, or any scheduler |
| **Customization** | Visual node editor | Edit the `.flow.json` — it's just JSON |
| **AI** | LangChain nodes + OpenAI keys | Claude built in — no API key needed |

n8n is great for visual workflow building. One CLI is for people who want to **run automations, not build them.**
