import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
import { fontFamilies, fontSightings, fontMdnRefs } from "@font-lover/database";
import type { Env } from "../types";

// GET /api/fonts          ... フォント一覧（人気順）
// GET /api/fonts/:family  ... フォント詳細 + 採集記録
// zine の読み取りAPIがローカルSQLiteのかわりに D1 へ問い合わせるためのエンドポイント。
const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const orm = drizzle(c.env.DB);
  const fonts = await orm
    .select()
    .from(fontFamilies)
    .orderBy(desc(fontFamilies.popularityScore))
    .limit(200);
  return c.json({ fonts });
});

app.get("/:family", async (c) => {
  const family = decodeURIComponent(c.req.param("family"));
  const orm = drizzle(c.env.DB);

  const rows = await orm
    .select()
    .from(fontFamilies)
    .where(eq(fontFamilies.familyName, family))
    .limit(1);

  if (rows.length === 0) {
    return c.json({ error: "Font not found", font: null, sightings: [], mdnRefs: [] }, 404);
  }

  const sightings = await orm
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
    .limit(200);

  const mdnRefs = await orm
    .select()
    .from(fontMdnRefs)
    .where(eq(fontMdnRefs.familyId, rows[0].id))
    .limit(20);

  return c.json({ font: rows[0], sightings, mdnRefs });
});

export default app;