import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fontFamilies, fontSightings } from "@font-lover/database";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { family: string } }
) {
  const family = decodeURIComponent(params.family);

  try {
    const font = await db
      .select()
      .from(fontFamilies)
      .where(eq(fontFamilies.familyName, family))
      .limit(1);

    if (font.length === 0) {
      return NextResponse.json(
        { error: "Font not found", font: null, sightings: [] },
        { status: 404 }
      );
    }

    const sightings = await db
      .select({
        siteDomain: fontSightings.siteDomain,
        siteUrl: fontSightings.siteUrl,
        detectedAt: fontSightings.detectedAt,
        usageCount: fontSightings.usageCount,
        mode: fontSightings.mode,
      })
      .from(fontSightings)
      .where(eq(fontSightings.familyId, font[0].id))
      .orderBy(desc(fontSightings.detectedAt))
      .limit(100);

    return NextResponse.json({ font: font[0], sightings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message, font: null, sightings: [] },
      { status: 500 }
    );
  }
}