import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFileSync } from "fs";
import { resolve } from "path";

const app = new Hono();

// CORS — required because the auth widget iframe calls from auth.withone.ai
const allowedOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  "/api/*",
  cors({
    origin: allowedOrigin,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ---------- Types ----------

interface ConnectorRow {
  platform: string;
  name: string;
  image: string;
  description: string;
}

interface PaginatedResponse<T> {
  rows: T[];
  pages: number;
}

// ---------- Helpers ----------

function getSecretKey(): string | undefined {
  return process.env.ONE_SECRET_KEY;
}

function getRequestedPlatforms(): string[] {
  return (process.env.PLATFORMS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchAllConnectors(
  secretKey: string
): Promise<ConnectorRow[]> {
  const all: ConnectorRow[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetch(
      `https://api.withone.ai/v1/available-connectors?limit=100&page=${page}`,
      { headers: { "x-one-secret": secretKey } }
    );
    if (!res.ok) break;
    const data: PaginatedResponse<ConnectorRow> = await res.json();
    all.push(...(data.rows || []));
    totalPages = data.pages || 1;
    page++;
  } while (page <= totalPages);

  return all;
}

// ---------- Routes ----------

// Config — serves env vars to the frontend
app.get("/api/config", (c) => {
  return c.json({
    platforms: getRequestedPlatforms(),
    companyName: process.env.COMPANY_NAME || "",
    companyLogoDark: process.env.COMPANY_LOGO_DARK || "",
    companyLogoLight: process.env.COMPANY_LOGO_LIGHT || "",
    welcomeMessage: process.env.WELCOME_MESSAGE || "",
    successMessage: process.env.SUCCESS_MESSAGE || "",
  });
});

// Token — called by the @withone/auth iframe
app.post("/api/one-auth", async (c) => {
  const secretKey = getSecretKey();
  if (!secretKey) {
    return c.json({ error: "ONE_SECRET_KEY not configured" }, 500);
  }

  const url = new URL(c.req.url);
  const page = url.searchParams.get("page") || "1";
  const limit = url.searchParams.get("limit") || "100";

  const body: Record<string, string> = {};
  if (process.env.IDENTITY) body.identity = process.env.IDENTITY;
  if (process.env.IDENTITY_TYPE) body.identityType = process.env.IDENTITY_TYPE;

  try {
    const response = await fetch(
      `https://api.withone.ai/v1/authkit/token?page=${page}&limit=${limit}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-One-Secret": secretKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.error("Token API error:", response.status, await response.text());
      return c.json({ error: "Failed to generate token" }, response.status as 400);
    }

    return c.json(await response.json());
  } catch (error) {
    console.error("Token endpoint error:", error);
    return c.json({ error: "Failed to generate token" }, 500);
  }
});

// Connections — check which platforms are already connected
app.get("/api/connections", async (c) => {
  const secretKey = getSecretKey();
  if (!secretKey) {
    return c.json({ rows: [] });
  }

  try {
    const response = await fetch("https://api.withone.ai/v1/connections", {
      headers: { "x-one-secret": secretKey },
    });
    return c.json(response.ok ? await response.json() : { rows: [] });
  } catch {
    return c.json({ rows: [] });
  }
});

// Delete connection — used for reconnect flow
app.delete("/api/connections/:id", async (c) => {
  const secretKey = getSecretKey();
  if (!secretKey) {
    return c.json({ error: "ONE_SECRET_KEY not configured" }, 500);
  }

  const connectionId = c.req.param("id");

  try {
    const response = await fetch(
      `https://api.withone.ai/v1/vault/connections/${connectionId}`,
      {
        method: "DELETE",
        headers: { "x-one-secret": secretKey },
      }
    );
    return response.ok
      ? c.json({ deleted: true })
      : c.json({ error: "Failed to delete" }, response.status as 400);
  } catch {
    return c.json({ error: "Failed to delete" }, 500);
  }
});

// Platforms — fetch logo and details for requested platforms
app.get("/api/platforms", async (c) => {
  const secretKey = getSecretKey();
  const requestedPlatforms = getRequestedPlatforms();

  if (!secretKey || requestedPlatforms.length === 0) {
    return c.json({ platforms: [] });
  }

  try {
    const allConnectors = await fetchAllConnectors(secretKey);

    const platforms = requestedPlatforms.map((p) => {
      const connector = allConnectors.find(
        (row) =>
          row.platform === p ||
          row.name?.toLowerCase() === p.toLowerCase()
      );
      return connector
        ? {
            platform: connector.platform,
            name: connector.name,
            image: connector.image,
            description: connector.description,
          }
        : {
            platform: p,
            name: p.charAt(0).toUpperCase() + p.slice(1),
            image: "",
            description: "",
          };
    });

    return c.json({ platforms });
  } catch {
    return c.json({ platforms: [] });
  }
});

// Static files in production
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", (c) => {
    const html = readFileSync(resolve("./dist/index.html"), "utf-8");
    return c.html(html);
  });
}

const port = parseInt(process.env.PORT || "3000");
console.log(`One Link server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
