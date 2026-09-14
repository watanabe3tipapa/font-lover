import { NextRequest, NextResponse } from "next/server";
import { getSiteFonts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = decodeURIComponent(params.domain);

  try {
    const fonts = await getSiteFonts(domain);
    return NextResponse.json({ fonts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, fonts: [] }, { status: 500 });
  }
}