#!/usr/bin/env tsx
/**
 * MDN Web Docs フォント知見同期スクリプト
 *
 * MDN のフォント関連ドキュメントから解説テキストを取得し、
 * font_mdn_refs テーブルに同期します。
 *
 * 実行方法:
 *   npx tsx tooling/mdn-sync/sync-mdn.ts
 */

// MDN フォント関連スラグ一覧（必要に応じて拡張）
const MDN_FONT_SLUGS = [
  { slug: "font-family", title: "font-family" },
  { slug: "@font-face", title: "@font-face" },
  { slug: "font-display", title: "font-display" },
  { slug: "font-weight", title: "font-weight" },
  { slug: "font-style", title: "font-style" },
  { slug: "font-size", title: "font-size" },
  { slug: "line-height", title: "line-height" },
  { slug: "font-feature-settings", title: "font-feature-settings" },
];

async function fetchMdnPage(slug: string): Promise<{ description: string; compatibility: string } | null> {
  try {
    // MDN の生コンテンツ API（非公式、必要に応じてスクレイピングに切り替え）
    const res = await fetch(`https://developer.mozilla.org/en-US/docs/Web/CSS/${encodeURIComponent(slug)}`, {
      headers: { "User-Agent": "FONT-LOVER/1.0" },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // 簡易的な説明抽出（本番では cheerio 等で正確にパース推奨）
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const description = descMatch?.[1] || "";

    // ブラウザ互換性情報の有無を判定
    const hasCompat = html.includes("browser_compatibility");
    const compatibility = hasCompat ? "Browser compatibility data available on MDN" : "";

    return { description, compatibility };
  } catch (err) {
    console.error(`Failed to fetch ${slug}:`, err);
    return null;
  }
}

async function syncMdnRefs() {
  console.log("[FONT-LOVER] MDN sync started...");

  for (const item of MDN_FONT_SLUGS) {
    const data = await fetchMdnPage(item.slug);
    if (!data) {
      console.log(`  Skipped: ${item.slug}`);
      continue;
    }

    // font_mdn_refs テーブルへの保存（実際のDB接続に置き換え）
    console.log(`  Synced: ${item.slug}`);
    console.log(`    Description: ${data.description.slice(0, 80)}...`);
    console.log(`    Compatibility: ${data.compatibility}`);
  }

  console.log("[FONT-LOVER] MDN sync completed.");
}

// CLI 実行
if (require.main === module) {
  syncMdnRefs().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { syncMdnRefs };
