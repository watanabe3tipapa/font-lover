import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fontFamilies, fontSightings } from "@font-lover/database";
import { count, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalFonts] = await db
      .select({ value: count() })
      .from(fontFamilies);
    const [totalSightings] = await db
      .select({ value: count() })
      .from(fontSightings);

    const categoryDistribution = await db
      .select({ category: fontFamilies.category, count: count() })
      .from(fontFamilies)
      .groupBy(fontFamilies.category)
      .orderBy(desc(count()));

    const sourceDistribution = await db
      .select({ sourceType: fontFamilies.sourceType, count: count() })
      .from(fontFamilies)
      .groupBy(fontFamilies.sourceType)
      .orderBy(desc(count()));

    const topFonts = await db
      .select({
        familyName: fontFamilies.familyName,
        popularityScore: fontFamilies.popularityScore,
      })
      .from(fontFamilies)
      .orderBy(desc(fontFamilies.popularityScore))
      .limit(10);

    return NextResponse.json({
      totalFonts: totalFonts?.value ?? 0,
      totalSightings: totalSightings?.value ?? 0,
      categoryDistribution,
      sourceDistribution,
      topFonts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}