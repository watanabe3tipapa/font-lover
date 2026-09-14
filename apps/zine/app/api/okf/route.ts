import { NextResponse } from "next/server";
import { REMOTE } from "@/lib/config";
import { getSqlite } from "@/lib/db";
import { buildOkfKnowledge, loadOkfBundleFromDisk, loadPreviousHashes } from "@/lib/okf-builder.mjs";

export const dynamic = "force-dynamic";

// 蓄積したフォント知見を OKF v0.2 の機械可読 JSON(index + concepts)として返す。
// - リモート(Vercel): コミット済み pipeline/knowledge/*.json をそのまま返す
// - ローカル: DB の最新状態からライブ生成（buildOkfKnowledge）。
//   DB が使えない環境でも、コミット済みバンドルがあればフォールバックする。
export async function GET() {
  try {
    if (REMOTE) {
      const bundle = loadOkfBundleFromDisk();
      if (bundle) return NextResponse.json({ okf_version: "0.2", ...bundle });
      return NextResponse.json({
        okf_version: "0.2",
        index: { generatedAt: "", total: 0, byStatus: {}, concepts: [] },
        concepts: [],
      });
    }

    try {
      const { index, concepts } = buildOkfKnowledge(getSqlite(), {
        previousHashes: loadPreviousHashes(),
      });
      return NextResponse.json({ okf_version: "0.2", index, concepts });
    } catch {
      const bundle = loadOkfBundleFromDisk();
      if (bundle) return NextResponse.json({ okf_version: "0.2", ...bundle });
      throw new Error("OKF bundle could not be built (DB unavailable)");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}