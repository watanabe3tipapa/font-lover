import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import { buildOkfKnowledge, loadPreviousHashes } from "@/lib/okf-builder.mjs";

export const dynamic = "force-dynamic";

// DB の最新状態を OKF v0.2 の機械可読 JSON(index + concepts)として返す。
// OKF バンドルのライブ参照用エンドポイントで、gen-okf.mjs(= okf:build)の成果物と同型。
export async function GET() {
  try {
    const { index, concepts } = buildOkfKnowledge(sqlite, {
      previousHashes: loadPreviousHashes(),
    });
    return NextResponse.json({
      okf_version: "0.2",
      index,
      concepts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}