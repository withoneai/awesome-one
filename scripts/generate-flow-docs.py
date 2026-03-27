#!/usr/bin/env python3
"""
Generate per-flow README.md files and index for awesome-one/flows/n8n/.

Reads from:
  - ../.one/flows/n8n-*.flow.json  (converted One CLI flows)
  - ../n8n/metadata/master-index.json  (creator info, categories)

Writes to:
  - flows/n8n/{slug}/README.md
  - flows/n8n/{slug}/n8n-{id}-{slug}.flow.json
  - flows/n8n/README.md  (index)
"""

import json
import glob
import os
import re
import shutil
import sys

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
FLOWS_SRC = os.path.join(os.path.dirname(REPO_ROOT), ".one", "flows")
MASTER_INDEX = os.path.join(os.path.dirname(REPO_ROOT), "n8n", "metadata", "master-index.json")
FLOWS_DST = os.path.join(REPO_ROOT, "flows", "n8n")


def load_master_index():
    """Load master index for creator info."""
    if not os.path.exists(MASTER_INDEX):
        print(f"Warning: master-index.json not found at {MASTER_INDEX}")
        return {}
    with open(MASTER_INDEX) as f:
        data = json.load(f)
    # Index by n8n ID
    return {entry["id"]: entry for entry in data}


def format_views(views):
    """Format view count: 1428179 -> '1.4M', 56671 -> '56.7K'."""
    if views >= 1_000_000:
        return f"{views / 1_000_000:.1f}M"
    elif views >= 1_000:
        return f"{views / 1_000:.1f}K"
    return str(views)


def extract_slug_from_key(key):
    """Extract slug from flow key: 'n8n-1954-ai-agent-chat-1428179' -> 'ai-agent-chat'."""
    # Pattern: n8n-{id}-{slug}-{views}
    match = re.match(r"n8n-(\d+)-(.+)-(\d+)$", key)
    if match:
        return match.group(2)
    # Fallback: n8n-{id}-{slug}
    match = re.match(r"n8n-(\d+)-(.+)$", key)
    if match:
        return match.group(2)
    return key


def extract_id_from_key(key):
    """Extract n8n ID from flow key."""
    match = re.match(r"n8n-(\d+)", key)
    return int(match.group(1)) if match else None


def get_platforms(flow_data):
    """Extract platforms and their purposes from flow inputs."""
    platforms = []
    for input_name, input_def in flow_data.get("inputs", {}).items():
        conn = input_def.get("connection", {})
        platform = conn.get("platform")
        if platform:
            # Infer purpose from the input description
            desc = input_def.get("description", "")
            # Strip boilerplate prefixes
            for prefix in [
                f"{platform} connection key for ",
                f"{platform.replace('-', ' ').title()} connection key for ",
                "connection key for ",
                "Connection key for ",
                f"{platform} connection key",
                "connection key",
            ]:
                if desc.lower().startswith(prefix.lower()):
                    desc = desc[len(prefix):]
                    break

            # Strip leading platform name if it's redundant
            platform_display = platform.replace("-", " ").lower()
            if desc.lower().startswith(platform_display):
                desc = desc[len(platform_display):].lstrip(" -:")

            desc = desc.strip().capitalize()

            # Fallback: derive purpose from how the platform is used in steps
            if not desc:
                desc = _infer_platform_purpose(platform, flow_data)

            platforms.append({
                "name": platform,
                "purpose": desc,
            })
    return platforms


# Default platform purposes when we can't infer from context
PLATFORM_DEFAULTS = {
    "slack": "Posting results",
    "gmail": "Sending emails",
    "google-sheets": "Reading/writing spreadsheet data",
    "google-drive": "File storage",
    "google-docs": "Document creation",
    "google-calendar": "Calendar events",
    "notion": "Database operations",
    "airtable": "Database operations",
    "hubspot": "CRM operations",
    "exa": "Web search",
    "firecrawl": "Web scraping",
    "linkedin": "LinkedIn operations",
    "apollo": "Contact enrichment",
    "bigquery": "Data warehouse queries",
    "google-ads": "Ad campaign management",
}


def _infer_platform_purpose(platform, flow_data):
    """Infer what a platform is used for from step names."""
    for step in flow_data.get("steps", []):
        action = step.get("action", {})
        if action.get("platform") == platform:
            step_name = step.get("name", "")
            if step_name:
                # Use the step name as purpose
                return step_name
    return PLATFORM_DEFAULTS.get(platform, "Platform integration")


def get_user_inputs(flow_data):
    """Extract non-connection inputs (user-provided parameters)."""
    inputs = []
    for input_name, input_def in flow_data.get("inputs", {}).items():
        if input_def.get("connection"):
            continue  # Skip connection keys
        inputs.append({
            "name": input_name,
            "type": input_def.get("type", "string"),
            "required": input_def.get("required", False),
            "description": input_def.get("description", ""),
            "default": input_def.get("default"),
        })
    return inputs


def get_steps_summary(flow_data):
    """Extract user-facing step descriptions, filtering out implementation details."""
    # Patterns that indicate internal/implementation steps users don't care about
    INTERNAL_PATTERNS = [
        "save prompt to temp",
        "save to temp",
        "write prompt",
        "parse claude output",
        "parse ai output",
        "strip code fences",
        "build slack block kit",
        "build block kit",
        "build slack summary",
        "build slack notification",
        "build google sheets",
        "build sheets",
        "normalize json",
        "parse json",
        "clean up temp",
    ]

    steps = []
    for step in flow_data.get("steps", []):
        name = step.get("name", "")
        if not name:
            continue
        # Skip internal steps
        name_lower = name.lower()
        if any(pat in name_lower for pat in INTERNAL_PATTERNS):
            continue
        steps.append(name)
    return steps


def _mermaid_escape(text):
    """Escape/remove special characters for mermaid labels inside double quotes.

    Mermaid is very picky about characters inside quoted labels.
    Safest approach: strip problematic chars rather than trying HTML entities
    (which themselves contain & and ;, causing further issues).
    """
    text = text.replace('"', "'")
    text = text.replace("&", "+")
    text = text.replace("<", "")
    text = text.replace(">", "")
    text = text.replace("(", " - ")
    text = text.replace(")", "")
    text = text.replace("[", "")
    text = text.replace("]", "")
    text = text.replace("#", "")
    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()
    # Strip trailing " -" from parenthesis removal
    text = re.sub(r"\s*-\s*$", "", text).strip()
    return text


def generate_mermaid_diagram(flow_data):
    """Generate a mermaid flowchart from flow steps.

    Groups internal steps (code, file-write) into logical phases and
    highlights platform actions and AI steps with distinct styling.
    """
    steps = flow_data.get("steps", [])
    if not steps:
        return None

    # Classify steps into visual nodes
    nodes = []
    for step in steps:
        stype = step.get("type", "")
        name = step.get("name", "")
        sid = step.get("id", "")
        platform = ""
        if stype == "action":
            platform = step.get("action", {}).get("platform", "")

        # Skip purely internal steps — they clutter the diagram
        name_lower = name.lower()
        skip_patterns = [
            "save prompt to temp", "save to temp", "write prompt",
            "parse claude output", "parse ai output", "strip code fences",
            "build slack block kit", "build block kit",
            "normalize json", "parse json", "clean up temp",
        ]
        if any(pat in name_lower for pat in skip_patterns):
            continue

        # Classify for styling
        if stype == "bash" and ("claude" in name_lower or "ai" in name_lower):
            category = "ai"
        elif stype == "action" and platform:
            category = "platform"
        elif stype == "loop":
            category = "loop"
        elif stype == "condition":
            category = "condition"
        else:
            category = "process"

        # Clean name for mermaid — keep short, escape special chars
        display = name[:55]
        if len(name) > 55:
            display += "..."
        display = _mermaid_escape(display)

        # Sanitize node ID — must be alphanumeric (no dashes, dots, etc.)
        safe_id = re.sub(r"[^a-zA-Z0-9]", "", sid or f"step{len(nodes)}")

        nodes.append({
            "id": safe_id,
            "name": display,
            "category": category,
            "platform": _mermaid_escape(
                platform.replace("-", " ").title()
            ) if platform else "",
        })

    if len(nodes) < 2:
        return None

    lines = []
    lines.append("```mermaid")
    lines.append("flowchart TD")

    # Define nodes with shapes based on category
    for node in nodes:
        nid = node["id"]
        label = node["name"]
        cat = node["category"]

        if cat == "platform":
            # Stadium shape for platform actions
            plat = node["platform"]
            lines.append(f'    {nid}(["{plat}: {label}"])')
        elif cat == "ai":
            # Subroutine shape for AI steps (double vertical bars)
            lines.append(f'    {nid}[["AI: {label}"]]')
        elif cat == "loop":
            # Circular for loops
            lines.append(f'    {nid}(("{label}"))')
        elif cat == "condition":
            # Diamond for conditions
            lines.append(f'    {nid}{{"{label}"}}')
        else:
            # Rectangle for process steps
            lines.append(f'    {nid}["{label}"]')

    # Connect nodes sequentially
    for i in range(len(nodes) - 1):
        lines.append(f"    {nodes[i]['id']} --> {nodes[i+1]['id']}")

    # Style — one line per node (mermaid requires this)
    lines.append("")
    for node in nodes:
        if node["category"] == "platform":
            lines.append(f"    style {node['id']} fill:#e1f5fe,stroke:#0288d1")
        elif node["category"] == "ai":
            lines.append(f"    style {node['id']} fill:#fce4ec,stroke:#c62828")

    lines.append("```")

    return "\n".join(lines)


def make_new_key(n8n_id, slug):
    """Generate new flow key without views: n8n-{id}-{slug}."""
    return f"n8n-{n8n_id}-{slug}"


def rewrite_flow_json(flow_data, new_key):
    """Return a copy of flow data with updated key (views removed)."""
    data = json.loads(json.dumps(flow_data))  # Deep copy
    data["key"] = new_key
    return data


def validate_no_hardcoded_keys(flow_data, filename):
    """Safety check: ensure no hardcoded connection keys."""
    content = json.dumps(flow_data)
    # Find all connectionKey values
    matches = re.findall(r'"connectionKey"\s*:\s*"([^"]+)"', content)
    for match in matches:
        if not match.startswith("$.input."):
            print(f"SECURITY WARNING: {filename} has hardcoded connectionKey: {match}")
            return False
    return True


def generate_per_flow_readme(flow_data, slug, n8n_id, new_key, master_entry):
    """Generate README.md content for a single flow."""
    name = flow_data.get("name", slug)
    description = flow_data.get("description", "")
    source = flow_data.get("source", {})
    n8n_url = source.get("url", f"https://n8n.io/workflows/{n8n_id}")
    total_views = source.get("totalViews", 0)
    replicated_at = source.get("replicatedAt", "")

    platforms = get_platforms(flow_data)
    user_inputs = get_user_inputs(flow_data)
    steps = get_steps_summary(flow_data)

    creator = master_entry.get("user", "n8n community") if master_entry else "n8n community"

    lines = []

    # Title
    lines.append(f"# {name}")
    lines.append("")
    lines.append(description)
    lines.append("")

    # Agent-native callout
    lines.append("> **Works with any AI agent.** Paste this page's URL into Claude Code, Codex, Cursor, Windsurf, OpenClaw, or any coding agent — it will read the docs, connect your platforms, and run this flow for you.")
    lines.append("")

    # Quick Start
    lines.append("## Quick Start")
    lines.append("")
    lines.append("```bash")
    if platforms:
        lines.append("# 1. Connect your platforms (one-time setup)")
        for p in platforms:
            lines.append(f"one add {p['name']}")
        lines.append("")
    lines.append("# 2. Run the flow")
    cmd = f"one flow execute {new_key}"
    if user_inputs:
        for inp in user_inputs:
            example_val = _example_value(inp)
            cmd += f" \\\n  --input {inp['name']}=\"{example_val}\""
    lines.append(cmd)
    lines.append("```")
    lines.append("")

    # Platforms
    if platforms:
        lines.append("## Platforms")
        lines.append("")
        lines.append("| Platform | Used for |")
        lines.append("|----------|----------|")
        for p in platforms:
            display_name = p["name"].replace("-", " ").title()
            lines.append(f"| {display_name} | {p['purpose']} |")
        lines.append("")
        lines.append("> Don't have these connected yet? Run `one list` to check, then `one add <platform>` to connect.")
        lines.append("")

    # What it does
    if steps:
        lines.append("## What it does")
        lines.append("")
        for i, step in enumerate(steps, 1):
            lines.append(f"{i}. {step}")
        lines.append("")

    # Mermaid flow diagram
    mermaid = generate_mermaid_diagram(flow_data)
    if mermaid:
        lines.append("## Flow diagram")
        lines.append("")
        lines.append(mermaid)
        lines.append("")

    # Inputs
    if user_inputs:
        lines.append("## Inputs")
        lines.append("")
        lines.append("| Input | Required | Description |")
        lines.append("|-------|----------|-------------|")
        for inp in user_inputs:
            req = "Yes" if inp["required"] else "No"
            desc = inp["description"]
            if inp.get("default") is not None:
                desc += f" (default: {inp['default']})"
            lines.append(f"| `{inp['name']}` | {req} | {desc} |")
        lines.append("")

    # Footer
    lines.append("---")
    lines.append("")
    footer_parts = [f"Based on [n8n #{n8n_id}]({n8n_url})"]
    footer_parts.append(f"{format_views(total_views)} views on n8n")
    if creator and creator != "n8n community":
        footer_parts.append(f"by [{creator}](https://n8n.io/creators/{creator})")
    if replicated_at:
        footer_parts.append(f"Converted to One CLI on {replicated_at}")
    lines.append(f"<sub>{' · '.join(footer_parts)}</sub>")
    lines.append("")

    return "\n".join(lines)


def _example_value(inp):
    """Generate a sensible example value for an input."""
    name = inp["name"].lower()
    desc = inp.get("description", "").lower()

    if "channel" in name:
        return "C01ABC123"
    if "email" in name:
        return "user@example.com"
    if "url" in name:
        return "https://example.com"
    if "question" in name or "query" in name:
        return "your question here"
    if "industry" in name:
        return "B2B SaaS"
    if "location" in name:
        return "San Francisco"
    if "name" in name and "sender" in name:
        return "Alex"
    if "max" in name:
        return "10"
    if "topic" in name:
        return "your topic here"
    return "..."


def generate_index_readme(all_flows):
    """Generate the flows/n8n/README.md index."""
    lines = []

    lines.append("# n8n Flows for One CLI")
    lines.append("")
    lines.append(f"> **{len(all_flows)} of the most popular n8n workflows, rebuilt for One CLI.**")
    lines.append("> Each flow runs with a single command — no drag-and-drop, no self-hosting, no manual credential wiring.")
    lines.append("")

    # Agent-native section
    lines.append("## Agent-native")
    lines.append("")
    lines.append("These flows are designed to be used by AI agents. Drop any flow's URL into **Claude Code**, **Codex**, **Cursor**, **Windsurf**, **OpenClaw**, or any coding agent — it will read the README, connect the required platforms, and run the flow for you. No manual setup.")
    lines.append("")
    lines.append("```")
    lines.append("> Set up and run this flow: https://github.com/withoneai/awesome-one/tree/main/flows/n8n/ai-agent-chat")
    lines.append("```")
    lines.append("")

    # Or run it yourself
    lines.append("## Or run it yourself")
    lines.append("")
    lines.append("```bash")
    lines.append("# Connect a platform once")
    lines.append("one add slack")
    lines.append("")
    lines.append("# Run any flow")
    lines.append('one flow execute n8n-1954-ai-agent-chat --input question="How does RAG work?"')
    lines.append("```")
    lines.append("")
    lines.append("That's it. No importing JSONs. No configuring nodes. No UI.")
    lines.append("")

    # All Flows table
    lines.append("---")
    lines.append("")
    lines.append("## All Flows")
    lines.append("")
    lines.append("| # | Flow | Description | Platforms | n8n Views |")
    lines.append("|---|------|-------------|-----------|-----------|")

    for i, flow in enumerate(all_flows, 1):
        name = flow["name"]
        slug = flow["slug"]
        desc = flow["description"][:80]
        if len(flow["description"]) > 80:
            desc += "..."
        platforms_str = ", ".join(p["name"].replace("-", " ").title() for p in flow["platforms"])
        views = format_views(flow["views"])
        lines.append(f"| {i} | [{name}](./{slug}/) | {desc} | {platforms_str} | {views} |")

    lines.append("")

    # Getting Started
    lines.append("---")
    lines.append("")
    lines.append("## Getting Started")
    lines.append("")
    lines.append("1. **Install One CLI**")
    lines.append("   ```bash")
    lines.append("   npm i -g @anthropic/one")
    lines.append("   ```")
    lines.append("")
    lines.append("2. **Connect your platforms**")
    lines.append("   ```bash")
    lines.append("   one add slack")
    lines.append("   one add gmail")
    lines.append("   one add google-sheets")
    lines.append("   # ... whatever the flow needs")
    lines.append("   ```")
    lines.append("")
    lines.append("3. **Pick a flow and run it**")
    lines.append("   ```bash")
    lines.append("   one flow execute <flow-key> --input <param>=<value>")
    lines.append("   ```")
    lines.append("")
    lines.append("> Run `one list` to see all your connected platforms.")
    lines.append("> Run `one flow list` to see all available flows.")
    lines.append("")

    # Why One CLI
    lines.append("---")
    lines.append("")
    lines.append("## Why One CLI instead of n8n?")
    lines.append("")
    lines.append("| | n8n | One CLI |")
    lines.append("|---|-----|---------|")
    lines.append("| **Setup** | Self-host or pay for Cloud | `npm i -g @anthropic/one` |")
    lines.append("| **Connect a platform** | OAuth config per node in UI | `one add gmail` |")
    lines.append("| **Run a workflow** | Import JSON → configure → execute in UI | `one flow execute <key>` |")
    lines.append("| **Credentials** | Stored in n8n's database | Managed by One — connect once, use everywhere |")
    lines.append("| **Scheduling** | Built-in cron in UI | `cron`, CI, or any scheduler |")
    lines.append("| **Customization** | Visual node editor | Edit the `.flow.json` — it's just JSON |")
    lines.append("| **AI** | LangChain nodes + OpenAI keys | Claude built in — no API key needed |")
    lines.append("")
    lines.append("n8n is great for visual workflow building. One CLI is for people who want to **run automations, not build them.**")
    lines.append("")

    return "\n".join(lines)


def main():
    # Load master index for creator info
    master = load_master_index()

    # Find all n8n flow files
    pattern = os.path.join(FLOWS_SRC, "n8n-*.flow.json")
    flow_files = sorted(glob.glob(pattern))
    print(f"Found {len(flow_files)} n8n flow files")

    if not flow_files:
        print(f"No flow files found at {pattern}")
        sys.exit(1)

    # Create output directory
    os.makedirs(FLOWS_DST, exist_ok=True)

    all_flows = []  # For index generation
    skipped = 0
    generated = 0

    # Pre-scan for slug collisions
    slug_counts = {}
    for flow_file in flow_files:
        with open(flow_file) as f:
            fd = json.load(f)
        key = fd.get("key", "")
        slug = extract_slug_from_key(key)
        slug_counts[slug] = slug_counts.get(slug, 0) + 1
    colliding_slugs = {s for s, c in slug_counts.items() if c > 1}
    if colliding_slugs:
        print(f"  Slug collisions detected (will append n8n ID): {colliding_slugs}")

    for flow_file in flow_files:
        with open(flow_file) as f:
            flow_data = json.load(f)

        key = flow_data.get("key", "")
        n8n_id = extract_id_from_key(key)
        slug = extract_slug_from_key(key)

        if not n8n_id or not slug:
            print(f"  Skipping {flow_file}: could not parse key '{key}'")
            skipped += 1
            continue

        # Safety check
        if not validate_no_hardcoded_keys(flow_data, flow_file):
            print(f"  SKIPPING {flow_file}: hardcoded connection keys detected!")
            skipped += 1
            continue

        # Resolve slug collisions by appending n8n ID
        folder_slug = slug
        if slug in colliding_slugs:
            folder_slug = f"{slug}-{n8n_id}"
            print(f"  Collision: {slug} -> {folder_slug}")

        new_key = make_new_key(n8n_id, slug)
        master_entry = master.get(n8n_id, {})

        # Create folder
        flow_dir = os.path.join(FLOWS_DST, folder_slug)
        os.makedirs(flow_dir, exist_ok=True)

        # Write rewritten flow JSON (key without views)
        new_flow = rewrite_flow_json(flow_data, new_key)
        flow_json_path = os.path.join(flow_dir, f"{new_key}.flow.json")
        with open(flow_json_path, "w") as f:
            json.dump(new_flow, f, indent=2)
            f.write("\n")

        # Generate and write README
        readme_content = generate_per_flow_readme(
            flow_data, slug, n8n_id, new_key, master_entry
        )
        readme_path = os.path.join(flow_dir, "README.md")
        with open(readme_path, "w") as f:
            f.write(readme_content)

        # Collect for index
        platforms = get_platforms(flow_data)
        source = flow_data.get("source", {})
        all_flows.append({
            "name": flow_data.get("name", slug),
            "slug": folder_slug,
            "description": flow_data.get("description", ""),
            "platforms": platforms,
            "views": source.get("totalViews", 0),
            "n8n_id": n8n_id,
            "new_key": new_key,
        })

        generated += 1

    # Sort index by views (descending)
    all_flows.sort(key=lambda x: -x["views"])

    # Generate index README
    index_content = generate_index_readme(all_flows)
    index_path = os.path.join(FLOWS_DST, "README.md")
    with open(index_path, "w") as f:
        f.write(index_content)

    print(f"\nDone! Generated {generated} flows, skipped {skipped}")
    print(f"Index: {index_path}")
    print(f"Output: {FLOWS_DST}")


if __name__ == "__main__":
    main()
