import { NextRequest, NextResponse } from "next/server";
import { getFontDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { family: string } }
) {
  const family = decodeURIComponent(params.family);

  try {
    const detail = await getFontDetail(family);
    if (!detail.font) {
      return NextResponse.json(
        { error: "Font not found", font: null, sightings: [], mdnRefs: [] },
        { status: 404 }
      );
    }
    return NextResponse.json(detail);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message, font: null, sightings: [], mdnRefs: [] },
      { status: 500 }
    );
  }
}