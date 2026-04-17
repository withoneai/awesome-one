// Direct passthrough API calls to One
// Used for KPI data fetching where action IDs are known and deterministic
// Docs: https://withone.ai/docs — see passthrough API section

import { ONE_API_BASE } from "@/lib/constants";

export async function passthrough(
  path: string,
  connectionKey: string,
  actionId: string,
  options: {
    method?: string;
    data?: unknown;
    pathVariables?: Record<string, string>;
    queryParams?: Record<string, string>;
  } = {}
) {
  const { method = "GET", data, pathVariables, queryParams } = options;

  // Replace path variables
  let resolvedPath = path;
  if (pathVariables) {
    for (const [key, value] of Object.entries(pathVariables)) {
      resolvedPath = resolvedPath.replace(`{{${key}}}`, encodeURIComponent(value));
      resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
    }
  }

  let url = `${ONE_API_BASE}/passthrough/${resolvedPath}`;
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "x-one-secret": process.env.ONE_SECRET!,
      "x-one-connection-key": connectionKey,
      "x-one-action-id": actionId,
      "Content-Type": "application/json",
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });

  return res.json();
}
