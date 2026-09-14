import { getDb } from "@/lib/db";
import { fontFamilies, fontSightings } from "@font-lover/database";
import { count, desc, eq } from "drizzle-orm";
import { COLLECTOR_URL, REMOTE, WORKER_TOKEN } from "@/lib/config";

// ============================================================
// データ取得レイヤ（ローカル / プロキシの切替）
//
// - ローカル開発: better-sqlite3 を直接参照（既存の db.ts）
// - 本番（Vercel）: COLLECTOR_URL が設定されていれば、cloudflare worker（D1）
//   の読み取りGET API を経由する。真実の源は D1 側。
// ============================================================

async function proxy<T>(path: string): Promise<T> {
  const res = await fetch(`${COLLECTOR_URL}${path}`, {
    headers: WORKER_TOKEN ? { Authorization: `Bearer ${WORKER_TOKEN}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`collector GET ${path} -> ${res.status} ${body}`);
  }
  return res.json();
}

// プロキシ失敗時は空データを返し、デプロイ直後（collector未デプロイ等）でも
// UI（zine）が落ちないようにする。
async function proxySafe<T extends object>(path: string, empty: T): Promise<T> {
  try {
    return await proxy<T>(path);
  } catch (err) {
    console.warn(`[data] collector unreachable for ${path}:`, err instanceof Error ? err.message : err);
    return empty;
  }
}

export async function listFonts() {
  if (REMOTE) {
    const data = await proxySafe<{ fonts: LocalFont[] }>("/api/fonts", { fonts: [] });
    return data.fonts;
  }
  const fonts = await getDb()
    .select()
    .from(fontFamilies)
    .orderBy(desc(fontFamilies.popularityScore))
    .limit(100);
  return fonts;
}

export async function getFontDetail(family: string) {
  if (REMOTE) {
    try {
      return await proxy<FontDetail>(`/api/fonts/${encodeURIComponent(family)}`);
    } catch {
      return { font: null, sightings: [] };
    }
  }
  const rows = await getDb()
    .select()
    .from(fontFamilies)
    .where(eq(fontFamilies.familyName, family))
    .limit(1);
  if (rows.length === 0) return { font: null, sightings: [] };

  const sightings = await getDb()
    .select({
      siteDomain: fontSightings.siteDomain,
      siteUrl: fontSightings.siteUrl,
      detectedAt: fontSightings.detectedAt,
      usageCount: fontSightings.usageCount,
      mode: fontSightings.mode,
    })
    .from(fontSightings)
    .where(eq(fontSightings.familyId, rows[0].id))
    .orderBy(desc(fontSightings.detectedAt))
    .limit(100);

  return { font: rows[0], sightings };
}

export async function getSiteFonts(domain: string) {
  if (REMOTE) {
    const data = await proxySafe<{ fonts: SiteFont[] }>(
      `/api/sites/${encodeURIComponent(domain)}`,
      { fonts: [] },
    );
    return data.fonts;
  }
  const fonts = await getDb()
    .select({
      familyName: fontFamilies.familyName,
      category: fontFamilies.category,
      sourceType: fontFamilies.sourceType,
      detectedAt: fontSightings.detectedAt,
      usageCount: fontSightings.usageCount,
    })
    .from(fontSightings)
    .innerJoin(fontFamilies, eq(fontSightings.familyId, fontFamilies.id))
    .where(eq(fontSightings.siteDomain, domain))
    .orderBy(desc(fontSightings.detectedAt))
    .limit(200);
  return fonts;
}

export async function getStats() {
  if (REMOTE) {
    return proxySafe<StatsData>("/api/stats", {
      totalFonts: 0,
      totalSightings: 0,
      categoryDistribution: [],
      sourceDistribution: [],
      topFonts: [],
    });
  }
  const [totalFonts] = await getDb().select({ value: count() }).from(fontFamilies);
  const [totalSightings] = await getDb().select({ value: count() }).from(fontSightings);

  const categoryDistribution = await getDb()
    .select({ category: fontFamilies.category, count: count() })
    .from(fontFamilies)
    .groupBy(fontFamilies.category)
    .orderBy(desc(count()));

  const sourceDistribution = await getDb()
    .select({ sourceType: fontFamilies.sourceType, count: count() })
    .from(fontFamilies)
    .groupBy(fontFamilies.sourceType)
    .orderBy(desc(count()));

  const topFonts = await getDb()
    .select({
      familyName: fontFamilies.familyName,
      popularityScore: fontFamilies.popularityScore,
    })
    .from(fontFamilies)
    .orderBy(desc(fontFamilies.popularityScore))
    .limit(10);

  return {
    totalFonts: totalFonts?.value ?? 0,
    totalSightings: totalSightings?.value ?? 0,
    categoryDistribution,
    sourceDistribution,
    topFonts,
  };
}

// ---- 型定義（zine 側で使うデータ形状） ----
export interface LocalFont {
  id: number;
  familyName: string;
  category: string;
  sourceType: string;
  popularityScore: number | null;
  firstSeenAt?: string | null;
  updatedAt?: string | null;
}

export interface FontDetail {
  font: LocalFont | null;
  sightings: {
    siteDomain: string;
    siteUrl: string;
    detectedAt: string;
    usageCount: number | null;
    mode?: string | null;
  }[];
}

export interface SiteFont {
  familyName: string;
  category: string;
  sourceType: string;
  detectedAt: string;
  usageCount: number | null;
}

export interface StatsData {
  totalFonts: number;
  totalSightings: number;
  categoryDistribution: { category: string; count: number }[];
  sourceDistribution: { sourceType: string; count: number }[];
  topFonts: { familyName: string; popularityScore: number }[];
}