import { NextResponse } from "next/server";
import { listFonts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fonts = await listFonts();
    return NextResponse.json({ fonts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, fonts: [] }, { status: 500 });
  }
}