#!/usr/bin/env tsx
/**
 * FONT-LOVER MDN 知見同期スクリプト
 *
 * MDN のフォント関連ドキュメントから解説テキストを取得し、
 * ローカル SQLite（apps/zine/font-lover.db）の font_mdn_refs テーブルへ同期します。
 *
 * 実行方法（apps/zine の workspace から）:
 *   pnpm --filter @font-lover/zine mdn:sync
 *
 * オプション:
 *   --db <path>      DB ファイルのパス（既定: apps/zine/font-lover.db）
 *   --family <名前>  指定ファミリーのみ同期（既定: 全ファミリー）
 */

import { createRequire } from "node:module";
import path from "node:path";

// better-sqlite3 は apps/zine の依存として解決する（pnpm strict のため）
// ※ このスクリプトは tsx（CJS）で実行される
const zineDir = path.resolve(__dirname, "../../apps/zine");
const require = createRequire(path.join(zineDir, "package.json"));
const Database = require("better-sqlite3");
const DEFAULT_DB = path.join(zineDir, "font-lover.db");

// MDN フォント関連スラグ一覧（path は MDN のページパス、既定は Web/CSS/<slug>）
const MDN_FONT_SLUGS = [
  { slug: "font-family" },
  { slug: "@font-face" },
  { slug: "font-display", path: "@font-face/font-display" },
  { slug: "font-weight" },
  { slug: "font-style" },
  { slug: "font-size" },
  { slug: "line-height" },
  { slug: "font-feature-settings" },
] as const;

interface MdnSlugDef {
  slug: string;
  path?: string;
}

interface MdnRef {
  familyName: string;
  mdnSlug: string;
  description: string;
  compatibility: string;
}

// MDN 公式ページから meta description と互換性情報を抽出
async function fetchMdnPage(
  slug: string,
  pagePath?: string,
): Promise<{ summary: string; slugTitle: string; hasCompat: boolean } | null> {
  try {
    const path = pagePath || slug;
    const res = await fetch(
      `https://developer.mozilla.org/en-US/docs/Web/CSS/${encodeURIComponent(path)}`,
      { headers: { "User-Agent": "FONT-LOVER/1.0" } },
    );
    if (!res.ok) return null;
    const html = await res.text();

    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const description = descMatch?.[1] || "";
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const slugTitle = titleMatch?.[1]?.replace(/\s*[|·].*$/, "").trim() || slug;
    const hasCompat = html.includes("browser_compatibility");
    return { summary: decodeHtml(description), slugTitle, hasCompat };
  } catch {
    return null;
  }
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function syncMdnRefs() {
  const args = process.argv.slice(2);
  const dbPath = (args.find((a) => a.startsWith("--db=")) || "--db=").split("=")[1] || DEFAULT_DB;
  const familyOnly = args.find((a) => a.startsWith("--family="))?.split("=")[1];

  console.log(`[FONT-LOVER] MDN sync started → ${dbPath}`);

  const sqlite = new Database(dbPath);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS font_mdn_refs (
      id INTEGER PRIMARY KEY,
      family_id INTEGER NOT NULL,
      mdn_slug TEXT NOT NULL,
      description TEXT,
      compatibility_note TEXT
    );
  `);

  const families = familyOnly
    ? [{ id: null as number | null, family_name: familyOnly }]
    : (sqlite.prepare(`SELECT id, family_name FROM font_families`).all() as {
        id: number;
        family_name: string;
      }[]);

  if (families.length === 0) {
    console.log("  [SKIP] font_families is empty. Run `pnpm --filter @font-lover/zine db:seed` first.");
    sqlite.close();
    process.exit(0);
  }

  // familyName → MDN slug を必ず持たせる（シードのみ参照 + event title）
  const getFamilyId: (name: string) => number | null = (name) => {
    if (familyOnly) return null;
    return families.find((f) => f.family_name === name)?.id ?? null;
  };

  let synced = 0;
  for (const fam of families) {
    const familyId = fam.id ?? getFamilyId(fam.family_name);
    if (familyId === null) {
      console.log(`  [MISS] family not found in DB: ${fam.family_name}`);
      continue;
    }

    const refs: MdnRef[] = [];
    for (const slugDef of MDN_FONT_SLUGS as readonly MdnSlugDef[]) {
      const { slug, path } = slugDef;
      const page = await fetchMdnPage(slug, path);
      if (!page) {
        console.log(`    [SKIP] ${fam.family_name} / ${slug} (fetch failed)`);
        continue;
      }
      refs.push({
        familyName: fam.family_name,
        mdnSlug: slug,
        description: page.summary,
        compatibility: page.hasCompat
          ? "ブラウザー互換性データあり（MDN 参照）"
          : "",
      });
    }

    // 冪等化: 対象ファミリーの既存 refs を置き換え
    sqlite.prepare(`DELETE FROM font_mdn_refs WHERE family_id = ?`).run(familyId);
    const insert = sqlite.prepare(`
      INSERT INTO font_mdn_refs (family_id, mdn_slug, description, compatibility_note)
      VALUES (?, ?, ?, ?)
    `);
    for (const ref of refs) {
      insert.run(familyId, ref.mdnSlug, ref.description, ref.compatibility);
    }

    synced += refs.length;
    console.log(`  [OK] ${fam.family_name}: ${refs.length} refs synced`);
  }

  sqlite.close();
  console.log(`[FONT-LOVER] MDN sync completed. Total refs: ${synced}`);
}

// CLI 実行
if (require.main === module) {
  syncMdnRefs().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}

export { syncMdnRefs, MDN_FONT_SLUGS };