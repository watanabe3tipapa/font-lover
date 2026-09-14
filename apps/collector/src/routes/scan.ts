import { Hono } from "hono";
import { lightScan } from "../services/light-scan";
import { storeScanResult } from "../services/store";
import type { Env } from "../types";
import type { ScanRequest, ScanResponse, ScanError } from "@font-lover/shared-types";

const app = new Hono<{ Bindings: Env }>();

app.post("/", async (c) => {
  const { url, mode = "light" } = await c.req.json<ScanRequest>();

  if (!url || !URL.canParse(url)) {
    return c.json<ScanError>({ error: "Invalid URL" }, 400);
  }

  // SSRF対策
  const parsed = new URL(url);
  const blocked = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];
  if (blocked.includes(parsed.hostname)) {
    return c.json<ScanError>({ error: "Forbidden host" }, 403);
  }

  try {
    // puppeteer は起動コストが大きいため、full スキャン時のみ動的 import する
    const result = mode === "full"
      ? await (await import("../services/full-scan")).fullScan(url, c.env.MYBROWSER)
      : await lightScan(url);

    // DBに保存
    const pageTitle = null; // 完全モードでは取得可能
    await storeScanResult(
      c.env.DB,
      url,
      parsed.hostname,
      pageTitle,
      result.fonts,
      result.mode
    );

    return c.json<ScanResponse>(result);
  } catch (err: any) {
    return c.json<ScanError>({ error: err.message }, 500);
  }
});

export default app;
