import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fontFamilies, fontSightings } from "@font-lover/database";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = decodeURIComponent(params.domain);

  try {
    const fonts = await db
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

    return NextResponse.json({ fonts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, fonts: [] }, { status: 500 });
  }
}