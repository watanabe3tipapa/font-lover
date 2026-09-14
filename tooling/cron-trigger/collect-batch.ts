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

// 日本の中央省庁・機関（2026-09-14 に light スキャンした 39 サイト）
const GOVERNMENT_SITES = [
  "https://www.kantei.go.jp", // 首相官邸
  "https://www.cas.go.jp", // 内閣官房
  "https://www.clb.go.jp", // 内閣法制局
  "https://www.jinji.go.jp", // 人事院
  "https://www.jbaudit.go.jp", // 会計検査院
  "https://www.cao.go.jp", // 内閣府
  "https://www.kunaicho.go.jp", // 宮内庁
  "https://www.jftc.go.jp", // 公正取引委員会
  "https://www.ppc.go.jp", // 個人情報保護委員会
  "https://www.fsa.go.jp", // 金融庁
  "https://www.caa.go.jp", // 消費者庁
  "https://www.digital.go.jp", // デジタル庁
  "https://www.cfa.go.jp", // こども家庭庁
  "https://www.reconstruction.go.jp", // 復興庁
  "https://www.soumu.go.jp", // 総務省
  "https://www.fdma.go.jp", // 消防庁
  "https://www.npa.go.jp", // 警察庁
  "https://www.moj.go.jp", // 法務省
  "https://www.mofa.go.jp", // 外務省
  "https://www.mof.go.jp", // 財務省
  "https://www.nta.go.jp", // 国税庁
  "https://www.mhlw.go.jp", // 厚生労働省
  "https://www.maff.go.jp", // 農林水産省
  "https://www.rinya.maff.go.jp", // 林野庁
  "https://www.jfa.maff.go.jp", // 水産庁
  "https://www.meti.go.jp", // 経済産業省
  "https://www.jpo.go.jp", // 特許庁
  "https://www.mlit.go.jp", // 国土交通省
  "https://www.jma.go.jp", // 気象庁
  "https://www.env.go.jp", // 環境省
  "https://www.nsr.go.jp", // 原子力規制委員会
  "https://www.mod.go.jp", // 防衛省
  "https://www.mext.go.jp", // 文部科学省
  "https://www.bunka.go.jp", // 文化庁
  "https://www.shugiin.go.jp", // 衆議院
  "https://www.sangiin.go.jp", // 参議院
  "https://www.ndl.go.jp", // 国立国会図書館
  "https://www.courts.go.jp", // 裁判所
  "https://www.japan.go.jp", // JapanGov
];

/** CLI 引数で採集対象を選択: `collect-batch.ts [light|full] [tech|government|all]` */
function selectTargets(cliArg?: string): string[] {
  switch (cliArg) {
    case "government":
      return GOVERNMENT_SITES;
    case "all":
      return [...TARGET_SITES, ...GOVERNMENT_SITES];
    default:
      return TARGET_SITES;
  }
}

interface CollectResponse {
  results: any[];
  processed: number;
  failed: number;
}

async function runBatch(mode: "light" | "full" = "light", sites: string[] = TARGET_SITES) {
  console.log(`[FONT-LOVER] Batch collection started (${mode} mode)`);
  console.log(`Target sites: ${sites.length}`);

  const res = await fetch(`${COLLECTOR_URL}/api/collect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WORKER_TOKEN ? { Authorization: `Bearer ${WORKER_TOKEN}` } : {}),
    },
    body: JSON.stringify({ urls: sites, mode }),
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
  const targets = selectTargets(process.argv[3]);
  runBatch(mode, targets).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { runBatch };
