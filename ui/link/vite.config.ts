import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { ViteDevServer } from "vite";
import { config as loadDotenv } from "dotenv";

loadDotenv();

function apiPlugin() {
  return {
    name: "api-server",
    configureServer(server: ViteDevServer) {
      // GET /api/config
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/api/config") return next();
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          platforms: (process.env.PLATFORMS || "").split(",").map(s => s.trim()).filter(Boolean),
          companyName: process.env.COMPANY_NAME || "",
          companyLogoDark: process.env.COMPANY_LOGO_DARK || "",
          companyLogoLight: process.env.COMPANY_LOGO_LIGHT || "",
          welcomeMessage: process.env.WELCOME_MESSAGE || "",
          successMessage: process.env.SUCCESS_MESSAGE || "",
        }));
      });

      // GET /api/platforms
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/api/platforms") return next();
        res.setHeader("Content-Type", "application/json");
        const secretKey = process.env.ONE_SECRET_KEY;
        const requestedPlatforms = (process.env.PLATFORMS || "").split(",").map(s => s.trim()).filter(Boolean);
        if (!secretKey || !requestedPlatforms.length) { res.end(JSON.stringify({ platforms: [] })); return; }

        try {
          const all: any[] = [];
          let page = 1, pages = 1;
          do {
            const r = await fetch(`https://api.withone.ai/v1/available-connectors?limit=100&page=${page}`, {
              headers: { "x-one-secret": secretKey },
            });
            if (!r.ok) break;
            const d = await r.json();
            all.push(...(d.rows || []));
            pages = d.pages || 1;
            page++;
          } while (page <= pages);

          const platforms = requestedPlatforms.map(p => {
            const c = all.find((x: any) => x.platform === p || x.name?.toLowerCase() === p.toLowerCase());
            return c ? { platform: c.platform, name: c.name, image: c.image, description: c.description }
              : { platform: p, name: p.charAt(0).toUpperCase() + p.slice(1), image: "", description: "" };
          });
          res.end(JSON.stringify({ platforms }));
        } catch { res.end(JSON.stringify({ platforms: [] })); }
      });

      // GET /api/connections
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/api/connections") return next();
        res.setHeader("Content-Type", "application/json");
        const secretKey = process.env.ONE_SECRET_KEY;
        if (!secretKey) { res.end(JSON.stringify({ rows: [] })); return; }
        try {
          const r = await fetch("https://api.withone.ai/v1/connections", { headers: { "x-one-secret": secretKey } });
          res.end(JSON.stringify(r.ok ? await r.json() : { rows: [] }));
        } catch { res.end(JSON.stringify({ rows: [] })); }
      });

      // POST /api/one-auth
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/one-auth") || req.method !== "POST") return next();
        res.setHeader("Content-Type", "application/json");
        const secretKey = process.env.ONE_SECRET_KEY;
        if (!secretKey) { res.statusCode = 500; res.end(JSON.stringify({ error: "ONE_SECRET_KEY not configured" })); return; }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const page = url.searchParams.get("page") || "1";
        const limit = url.searchParams.get("limit") || "100";

        const body: Record<string, string> = {};
        if (process.env.IDENTITY) body.identity = process.env.IDENTITY;
        if (process.env.IDENTITY_TYPE) body.identityType = process.env.IDENTITY_TYPE;

        try {
          const r = await fetch(`https://api.withone.ai/v1/authkit/token?page=${page}&limit=${limit}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-One-Secret": secretKey },
            body: JSON.stringify(body),
          });
          if (!r.ok) { res.statusCode = r.status; res.end(JSON.stringify({ error: "Failed to generate token" })); return; }
          res.end(JSON.stringify(await r.json()));
        } catch (e) {
          console.error("Token error:", e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to generate token" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  server: {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    },
  },
});
