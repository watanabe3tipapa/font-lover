import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fontFamilies } from "@font-lover/database";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fonts = await db
      .select()
      .from(fontFamilies)
      .orderBy(desc(fontFamilies.popularityScore))
      .limit(100);

    return NextResponse.json({ fonts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, fonts: [] }, { status: 500 });
  }
}
