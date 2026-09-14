import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ============================================================
// OKF v0.2 (Open Knowledge Format) の機械可読 JSON 表現を
// better-sqlite3 の DB から組み立てるモジュール。
//
// 出力は okf-seedling の pipeline/knowledge/ と同型:
//   index.json                ... { generatedAt, total, byStatus, concepts }
//   concepts/<id>.json        ... { id, type, url, title, meta, sections,
//                                   learnedAt, hash }
//
// OKF 仕様(§11 準拠文脈)に沿い、frontmatter は meta へそのままJSON化し、
// 本文相当は sections (見出し/階層/本文ブロック) で構造化する。
// ============================================================

// 生成元アクター(<producer>/<version> 規約、OKF §7)
const COLLECTOR_ACTOR = "process:font-lover-collector/0.1.0";
// 検出後この日数で stale_after に到達させる(絶対時刻で記録、OKF §5.5)
const STALE_AFTER_DAYS = 90;

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";

const hash16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
};

const googleFontsResource = (name) =>
  `https://fonts.google.com/specimen/${encodeURIComponent(name)}`;

const mdnResource = (slug) =>
  `https://developer.mozilla.org/docs/Web/CSS/${slug}`;

// 前回生成された pipeline/knowledge/concepts/ から id -> hash を読む
// (スクリプト以外のライブ参照(API/ページ)で status 差分を出すための共通処理)
export function loadPreviousHashes(dir) {
  const base = dir ?? join(process.cwd(), "pipeline", "knowledge", "concepts");
  const out = {};
  if (!existsSync(base)) return out;
  for (const f of readdirSync(base, { recursive: true })) {
    if (!String(f).endsWith(".json")) continue;
    try {
      const j = JSON.parse(readFileSync(join(base, f), "utf8"));
      if (j && j.id && j.hash) out[j.id] = j.hash;
    } catch {
      // 壊れたファイルは無視して前回差分として扱わない
    }
  }
  return out;
}

function queryAll(sqlite, sql, params = []) {
  return sqlite.prepare(sql).all(...params);
}

// フォント1つ分を OKF concept (FontFamily) に組み立てる
function buildConcept(family, faces, sightings, mdnRefs, now) {
  const firstSeenAt = family.first_seen_at ?? now;
  const updatedAt = family.updated_at ?? firstSeenAt;
  const learnedAt = updatedAt;

  const slug = slugify(family.family_name);
  const id = `fonts/${slug}`;

  const siteCount = sightings.length;
  const category = family.category ?? "unknown";
  const sourceType = family.source_type ?? "unknown";

  const description = `${category} カテゴリのフォント。${siteCount} サイトで検出(${sourceType}由来)。`;

  const sources = [
    ...sightings.map((s) => ({
      id: `sight:${s.site_domain}`,
      resource: s.site_url,
      title: s.page_title ?? s.site_domain,
      usage_count: s.usage_count ?? 1,
      last_modified: s.detected_at ?? learnedAt,
    })),
    ...mdnRefs.map((r) => ({
      id: `mdn:${r.mdn_slug}`,
      resource: mdnResource(r.mdn_slug),
      title: r.mdn_slug,
      last_modified: learnedAt,
    })),
  ];

  const meta = {
    type: "FontFamily",
    title: family.family_name,
    description,
    ...(sourceType === "google-fonts"
      ? { resource: googleFontsResource(family.family_name) }
      : {}),
    tags: [category, sourceType],
    status: "stable",
    // generated / verified は OKF §5.2 の信任系。収集は機械由来なので
    // producer を process: とし、trust tier は machine-confirmed になる。
    generated: { by: COLLECTOR_ACTOR, at: updatedAt },
    verified: { by: COLLECTOR_ACTOR, at: firstSeenAt },
    stale_after: addDays(learnedAt, STALE_AFTER_DAYS),
    sources,
  };

  const sections = [
    {
      heading: "Summary",
      level: 1,
      blocks: [
        description,
        `カテゴリ: ${category} / 由来: ${sourceType} / 人気スコア: ${family.popularity_score ?? "未測定"}`,
      ],
    },
    {
      heading: "Sightings",
      level: 1,
      blocks:
        sightings.length === 0
          ? ["- (検出記録なし)"]
          : sightings.map(
              (s) =>
                `- ${s.site_domain} — ${s.page_title ?? s.site_url} (用途回数: ${s.usage_count ?? 1}, mode: ${s.mode ?? "?"}, 検出: ${s.detected_at ?? "?"})`,
            ),
    },
    {
      heading: "Faces",
      level: 1,
      blocks:
        faces.length === 0
          ? ["- (記録なし)"]
          : faces.map(
              (f) =>
                `- ${f.weight ?? "?"} ${f.style ?? "normal"}: ${f.source_url ?? "(URLなし)"} (${f.format ?? "?"})`,
            ),
    },
  ];

  // 見出しは完全に任意(OKF §4.2)。MDN 参照があるときだけ追記する。
  if (mdnRefs.length > 0) {
    sections.push({
      heading: "MDN",
      level: 1,
      blocks: mdnRefs.map(
        (r) => `- ${r.mdn_slug} — ${r.description ?? r.compatibility_note ?? "(説明なし)"}`,
      ),
    });
  }

  const hash = hash16(JSON.stringify({ meta, sections }));

  return {
    id,
    type: "FontFamily",
    url: `${id.replace(/^fonts\//, "")}.md`,
    title: family.family_name,
    meta,
    sections,
    learnedAt,
    hash,
  };
}

export function buildOkfKnowledge(sqlite, { previousHashes = {}, now = new Date() } = {}) {
  const nowIso = now.toISOString();

  let concepts = [];
  try {
    const families = queryAll(sqlite, "SELECT * FROM font_families");
    for (const family of families) {
      const faces = queryAll(sqlite, "SELECT * FROM font_faces WHERE family_id = ? ORDER BY weight, style", [family.id]);
      const sightings = queryAll(
        sqlite,
        "SELECT * FROM font_sightings WHERE family_id = ? ORDER BY detected_at, site_domain",
        [family.id],
      );
      const mdnRefs = queryAll(sqlite, "SELECT * FROM font_mdn_refs WHERE family_id = ? ORDER BY mdn_slug", [family.id]);
      concepts.push(buildConcept(family, faces, sightings, mdnRefs, nowIso));
    }
  } catch {
    // テーブル未作成(=DBがまだ空)などの場合は空バンドルとして扱う
    concepts = [];
  }

  // status: 前回バンドルとの差分 (新規 / 更新 / 変化なし)
  for (const c of concepts) {
    const prev = previousHashes[c.id];
    c.status = prev === undefined ? "new" : prev === c.hash ? "unchanged" : "updated";
  }

  const byStatus = concepts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    index: {
      generatedAt: nowIso,
      total: concepts.length,
      byStatus,
      concepts: concepts.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        sections: c.sections.length,
      })),
    },
    concepts,
  };
}