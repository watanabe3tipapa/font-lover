import { REMOTE } from "@/lib/config";
import { getSqlite } from "@/lib/db";
import { buildOkfKnowledge, loadOkfBundleFromDisk, loadPreviousHashes } from "@/lib/okf-builder.mjs";
import type { OkfBundle } from "@/lib/okf-builder.mjs";

export const dynamic = "force-dynamic";

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

  const statusColors: Record<string, string> = {
    new: "#f59e0b",
    updated: "#3b82f6",
    unchanged: "#16a34a",
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>OKF Knowledge Bundle (v0.2)</h2>
      <p style={{ color: "#475569", fontSize: "0.9rem" }}>
        蓄積されたフォント知見を Open Knowledge Format v0.2 の JSON 表現として表示。
        generatedAt {index.generatedAt}
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "1rem 0" }}>
        <code style={{ background: "#eef2ff", padding: "0.3em 0.8em", borderRadius: 8 }}>
          total: {index.total}
        </code>
        {Object.entries(index.byStatus).map(([k, v]) => (
          <code
            key={k}
            style={{
              background: "rgba(59,130,246,0.08)",
              padding: "0.3em 0.8em",
              borderRadius: 8,
              color: statusColors[k] ?? "#334155",
            }}
          >
            {k}: {v}
          </code>
        ))}
        <a
          href="/api/okf"
          style={{ marginLeft: "auto", fontSize: "0.9rem", color: "#1e3a8a" }}
        >
          raw JSON (/api/okf)
        </a>
      </div>

      {concepts.length === 0 ? (
        <p>まだ knowledge がありません。`pnpm db:seed` 後に `pnpm okf:build` を実行してください。</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {concepts.map((c) => (
            <li key={c.id} style={{ marginBottom: "0.75rem" }}>
              <details
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "0.25rem 1rem",
                }}
              >
                <summary style={{ cursor: "pointer", padding: "0.6rem 0" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{c.id}</span>
                  <span style={{ marginLeft: "0.8rem", color: "#64748b", fontSize: "0.85rem" }}>
                    {c.type}
                  </span>
                  <span
                    style={{
                      marginLeft: "0.6rem",
                      color: statusColors[c.status ?? "unchanged"] ?? "#334155",
                      fontSize: "0.85rem",
                    }}
                  >
                    {c.status}
                  </span>
                  <span style={{ marginLeft: "0.6rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                    sections: {c.sections.length}
                  </span>
                </summary>
                <pre
                  style={{
                    background: "#0f172a",
                    color: "#e2e8f0",
                    padding: "1rem",
                    borderRadius: 8,
                    overflow: "auto",
                    fontSize: "0.78rem",
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(c, null, 2)}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}