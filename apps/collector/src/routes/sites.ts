import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
import { fontFamilies, fontSightings } from "@font-lover/database";
import type { Env } from "../types";

// GET /api/sites/:domain  ... サイト別フォント一覧
const app = new Hono<{ Bindings: Env }>();

app.get("/:domain", async (c) => {
  const domain = decodeURIComponent(c.req.param("domain"));
  const orm = drizzle(c.env.DB);

  const fonts = await orm
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

  return c.json({ fonts });
});

export default app;