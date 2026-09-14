import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { count, desc } from "drizzle-orm";
import { fontFamilies, fontSightings } from "@font-lover/database";
import type { Env } from "../types";

// GET /api/stats ... ダッシュボード用統計
const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const orm = drizzle(c.env.DB);

  const [totalFonts] = await orm.select({ value: count() }).from(fontFamilies);
  const [totalSightings] = await orm.select({ value: count() }).from(fontSightings);

  const categoryDistribution = await orm
    .select({ category: fontFamilies.category, count: count() })
    .from(fontFamilies)
    .groupBy(fontFamilies.category)
    .orderBy(desc(count()));

  const sourceDistribution = await orm
    .select({ sourceType: fontFamilies.sourceType, count: count() })
    .from(fontFamilies)
    .groupBy(fontFamilies.sourceType)
    .orderBy(desc(count()));

  const topFonts = await orm
    .select({
      familyName: fontFamilies.familyName,
      popularityScore: fontFamilies.popularityScore,
    })
    .from(fontFamilies)
    .orderBy(desc(fontFamilies.popularityScore))
    .limit(10);

  return c.json({
    totalFonts: totalFonts?.value ?? 0,
    totalSightings: totalSightings?.value ?? 0,
    categoryDistribution,
    sourceDistribution,
    topFonts,
  });
});

export default app;