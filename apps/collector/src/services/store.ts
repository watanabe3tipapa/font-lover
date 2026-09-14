import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { fontFamilies, fontSightings } from "@font-lover/database";
import type { DetectedFont, ScanMode, SourceType } from "@font-lover/shared-types";

export async function storeScanResult(
  db: D1Database,
  url: string,
  domain: string,
  pageTitle: string | null,
  fonts: DetectedFont[],
  mode: ScanMode
) {
  const orm = drizzle(db);

  for (const font of fonts) {
    // font_families に UPSERT
    const existing = await orm
      .select()
      .from(fontFamilies)
      .where(eq(fontFamilies.familyName, font.family))
      .limit(1);

    let familyId: number;

    if (existing.length > 0) {
      familyId = existing[0].id;
      // popularity_score を更新（簡易実装）
      await orm
        .update(fontFamilies)
        .set({
          popularityScore: (existing[0].popularityScore || 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(fontFamilies.id, familyId));
    } else {
      const sourceType = (font.source as SourceType) || "unknown";
      const result = await orm
        .insert(fontFamilies)
        .values({
          familyName: font.family,
          category: "unknown",
          sourceType,
          popularityScore: 1,
          firstSeenAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
      familyId = result[0].id;
    }

    // font_sightings に記録
    await orm.insert(fontSightings).values({
      familyId,
      siteUrl: url,
      siteDomain: domain,
      pageTitle,
      usageCount: font.weight ? 1 : null,
      mode,
      detectedAt: new Date().toISOString(),
    });
  }
}
