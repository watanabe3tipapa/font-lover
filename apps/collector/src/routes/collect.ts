import { Hono } from "hono";
import { lightScan } from "../services/light-scan";
import { fullScan } from "../services/full-scan";
import { storeScanResult } from "../services/store";
import type { Env } from "../types";
import type { CollectRequest, CollectResponse, ScanResponse, ScanError } from "@font-lover/shared-types";

const app = new Hono<{ Bindings: Env }>();

app.post("/", async (c) => {
  const { urls, mode = "light" } = await c.req.json<CollectRequest>();

  if (!Array.isArray(urls) || urls.length === 0) {
    return c.json<ScanError>({ error: "urls must be a non-empty array" }, 400);
  }

  const results: (ScanResponse | ScanError)[] = [];
  let processed = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const blocked = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];
      if (blocked.includes(parsed.hostname)) {
        results.push({ error: `Forbidden host: ${parsed.hostname}` });
        failed++;
        continue;
      }

      const result = mode === "full"
        ? await fullScan(url, c.env.MYBROWSER)
        : await lightScan(url);

      await storeScanResult(
        c.env.DB,
        url,
        parsed.hostname,
        null,
        result.fonts,
        result.mode
      );

      results.push(result);
      processed++;
    } catch (err: any) {
      results.push({ error: err.message });
      failed++;
    }
  }

  return c.json<CollectResponse>({ results, processed, failed });
});

export default app;
