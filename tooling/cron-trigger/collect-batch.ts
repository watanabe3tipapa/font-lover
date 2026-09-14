#!/usr/bin/env tsx
/**
 * FONT-LOVER バッチ収集スクリプト
 *
 * 対象サイトリストを巡回し、collector の /api/collect へ POST して
 * フォント情報を一括採集・蓄積します。
 *
 * 実行方法:
 *   npx tsx tooling/cron-trigger/collect-batch.ts
 *
 * Cloudflare Workers Cron Trigger としても動作可能:
 *   wrangler.toml で [triggers] crons = ["0 3 * * *"] を設定
 */

const COLLECTOR_URL = process.env.COLLECTOR_URL || "http://localhost:8787";
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

// 採集対象サイトリスト（拡張: 外部ファイルやDBから読み込み可能）
const TARGET_SITES = [
  "https://stripe.com",
  "https://linear.app",
  "https://vercel.com",
  "https://figma.com",
  "https://tailwindcss.com",
  "https://github.com",
  "https://notion.so",
  "https://slack.com",
  "https://spotify.com",
  "https://airbnb.com",
];

interface CollectResponse {
  results: any[];
  processed: number;
  failed: number;
}

async function runBatch(mode: "light" | "full" = "light") {
  console.log(`[FONT-LOVER] Batch collection started (${mode} mode)`);
  console.log(`Target sites: ${TARGET_SITES.length}`);

  const res = await fetch(`${COLLECTOR_URL}/api/collect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WORKER_TOKEN ? { Authorization: `Bearer ${WORKER_TOKEN}` } : {}),
    },
    body: JSON.stringify({ urls: TARGET_SITES, mode }),
  });

  if (!res.ok) {
    console.error(`Batch failed: ${res.status} ${res.statusText}`);
    const err = await res.text();
    console.error(err);
    process.exit(1);
  }

  const data = (await res.json()) as CollectResponse;
  console.log(`Processed: ${data.processed}, Failed: ${data.failed}`);
  console.log("[FONT-LOVER] Batch collection completed.");
}

// CLI 実行
if (require.main === module) {
  const mode = (process.argv[2] as "light" | "full") || "light";
  runBatch(mode).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { runBatch };
