import { db } from "@/lib/db";
import { fontFamilies, fontFaces, fontSightings, fontMdnRefs } from "@font-lover/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DBインスペクタ — FONT-LOVER",
};

const tables = [
  { name: "font_families", query: () => db.select().from(fontFamilies) },
  { name: "font_faces", query: () => db.select().from(fontFaces) },
  { name: "font_sightings", query: () => db.select().from(fontSightings) },
  { name: "font_mdn_refs", query: () => db.select().from(fontMdnRefs) },
] as const;

export default async function InspectorPage() {
  const rows: Record<string, unknown[]> = {};
  const errors: Record<string, string> = {};

  for (const table of tables) {
    try {
      rows[table.name] = await table.query();
    } catch (err) {
      errors[table.name] = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <div>
      <a href="/" style={{ color: "#1e3a8a", textDecoration: "none", fontSize: "0.9rem" }}>
        ← 図鑑トップへ
      </a>
      <h2 style={{ fontSize: "1.8rem", marginTop: "1rem", color: "#1e3a8a" }}>DBインスペクタ</h2>
      <p style={{ color: "#475569", fontSize: "0.9rem" }}>
        ローカルDB（better-sqlite3）の中身をそのままJSONで表示します。再読み込みで最新状態を確認できます。
      </p>

      {tables.map((table) => (
        <details
          key={table.name}
          open
          style={{
            marginTop: "1rem",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <summary
            style={{
              padding: "0.7rem 1rem",
              fontWeight: 700,
              color: "#1e3a8a",
              background: "#f8fafc",
              cursor: "pointer",
            }}
          >
            {table.name}
            <span style={{ color: "#64748b", fontWeight: 500, marginLeft: "0.6em" }}>
              {errors[table.name] ? "(取得失敗)" : `${rows[table.name].length} rows`}
            </span>
          </summary>
          {errors[table.name] ? (
            <pre
              style={{
                margin: 0,
                padding: "1rem",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: "0.85rem",
                overflow: "auto",
              }}
            >
              {errors[table.name]}
            </pre>
          ) : (
            <pre
              style={{
                margin: 0,
                padding: "1rem",
                background: "#0b1220",
                color: "#e2e8f0",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                maxHeight: 480,
                overflow: "auto",
              }}
            >
              {JSON.stringify(rows[table.name], null, 2)}
            </pre>
          )}
        </details>
      ))}
    </div>
  );
}