// One MCP integration — proper MCP protocol
//
// Uses @withone/mcp as a stdio MCP server process
// Connected via @ai-sdk/mcp client
// Tools are discovered automatically via the MCP protocol
//
// This is the same pattern as registering an MCP server in claude_desktop_config.json:
// { "command": "npx", "args": ["@withone/mcp"], "env": { "ONE_SECRET": "..." } }

import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let mcpClient: MCPClient | null = null;

export async function getOneMCPClient(): Promise<MCPClient> {
  if (mcpClient) return mcpClient;

  mcpClient = await createMCPClient({
    transport: new StdioClientTransport({
      command: "npx",
      args: ["@withone/mcp"],
      env: {
        ...(process.env as Record<string, string>),
        PICA_SECRET: process.env.ONE_SECRET!,
        ...(process.env.ONE_IDENTITY
          ? {
              PICA_IDENTITY: process.env.ONE_IDENTITY,
              PICA_IDENTITY_TYPE: process.env.ONE_IDENTITY_TYPE || "user",
            }
          : {}),
      },
    }),
    name: "dev-pulse",
    version: "1.0.0",
  });

  return mcpClient;
}

export async function getOneMCPTools() {
  const client = await getOneMCPClient();
  return client.tools();
}
