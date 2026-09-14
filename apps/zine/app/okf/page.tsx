import { REMOTE } from "@/lib/config";
import { getSqlite } from "@/lib/db";
import { buildOkfKnowledge, loadOkfBundleFromDisk, loadPreviousHashes } from "@/lib/okf-builder.mjs";
import type { OkfBundle } from "@/lib/okf-builder.mjs";

export const dynamic = "force-dynamic";

const statusClass: Record<string, string> = {
  new: "okf-pill-yellow",
  updated: "okf-pill-blue",
  unchanged: "okf-pill-green",
};

export default async function OkfPage() {
  let bundle: OkfBundle;
  if (REMOTE) {
    bundle =
      loadOkfBundleFromDisk() ?? {
        index: { generatedAt: "", total: 0, byStatus: {}, concepts: [] },
        concepts: [],
      };
  } else {
    try {
      bundle = buildOkfKnowledge(getSqlite(), {
        previousHashes: loadPreviousHashes(),
      });
    } catch {
      bundle = loadOkfBundleFromDisk() ?? {
        index: { generatedAt: "", total: 0, byStatus: {}, concepts: [] },
        concepts: [],
      };
    }
  }
  const { index, concepts } = bundle;

  return (
    <div>
      <h2 className="page-title">OKF Knowledge Bundle</h2>
      <p className="page-sub">
        蓄積されたフォント知見を Open Knowledge Format <strong>v0.2</strong> の JSON 表現として表示。
        generatedAt: <code>{index.generatedAt}</code>
      </p>

      <div className="okf-summary">
        <span className="okf-pill okf-pill-yellow">total: {index.total}</span>
        {Object.entries(index.byStatus).map(([k, v]) => (
          <span key={k} className={`okf-pill ${statusClass[k] ?? "okf-pill"}`}>
            {k}: {v}
          </span>
        ))}
        <a href="/api/okf" className="btn" style={{ marginLeft: "auto", fontSize: "0.8rem" }}>
          raw JSON (/api/okf)
        </a>
      </div>

      {concepts.length === 0 ? (
        <div className="notice">
          まだ knowledge がありません。`pnpm db:seed` 後に `pnpm okf:build` を実行してください。
        </div>
      ) : (
        <div>
          {concepts.map((c) => (
            <details key={c.id} className="okf-item">
              <summary>
                {c.id}
                <span style={{ marginLeft: "0.8rem", opacity: 0.7 }}>{c.type}</span>
                <span className={`okf-pill ${statusClass[c.status ?? "unchanged"] ?? ""}`} style={{ marginLeft: "0.6rem", boxShadow: "none" }}>
                  {c.status}
                </span>
                <span style={{ marginLeft: "0.6rem", opacity: 0.6 }}>sections: {c.sections.length}</span>
              </summary>
              <pre className="okf-tags">{JSON.stringify(c, null, 2)}</pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}