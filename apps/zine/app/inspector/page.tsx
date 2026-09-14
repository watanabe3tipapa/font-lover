import { getDb } from "@/lib/db";
import { REMOTE } from "@/lib/config";
import { fontFamilies, fontFaces, fontSightings, fontMdnRefs } from "@font-lover/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DBインスペクタ — FONT-LOVER",
};

const tables = [
  { name: "font_families", query: () => getDb().select().from(fontFamilies) },
  { name: "font_faces", query: () => getDb().select().from(fontFaces) },
  { name: "font_sightings", query: () => getDb().select().from(fontSightings) },
  { name: "font_mdn_refs", query: () => getDb().select().from(fontMdnRefs) },
] as const;

export default async function InspectorPage() {
  if (REMOTE) {
    return (
      <div>
        <a href="/" className="back-link">← 図鑑トップへ</a>
        <h2 className="page-title">DBインスペクタ</h2>
        <div className="notice" style={{ borderLeftColor: "var(--blue)" }}>
          リモートモード（collector / D1 プロキシ）ではローカルSQLiteは直接表示しません。
          代わりに公開 API をどうぞ。
        </div>
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {[
            { href: "/api/fonts", label: "/api/fonts", desc: "フォント一覧" },
            { href: "/api/stats", label: "/api/stats", desc: "統計" },
            { href: "/api/okf", label: "/api/okf", desc: "OKF知識バンドル（コミット済みJSON）" },
            { href: "/okf", label: "/okf", desc: "OKFビューワー" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="row">
              <div>
                <div className="row-main"><code>{item.label}</code></div>
                <div className="row-sub">{item.desc}</div>
              </div>
              <div className="row-right">OPEN →</div>
            </a>
          ))}
        </div>
      </div>
    );
  }

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
      <a href="/" className="back-link">← 図鑑トップへ</a>
      <h2 className="page-title">DBインスペクタ</h2>
      <p className="page-sub">
        ローカルDB（better-sqlite3）の中身をそのまま JSON で表示します。再読み込みで最新状態を確認できます。
      </p>

      {tables.map((table) => (
        <details key={table.name} open className="okf-item">
          <summary>
            {table.name}
            <span style={{ marginLeft: "0.8rem", opacity: 0.7, fontWeight: 500 }}>
              {errors[table.name] ? "(取得失敗)" : `${rows[table.name].length} rows`}
            </span>
          </summary>
          {errors[table.name] ? (
            <pre
              className="okf-tags"
              style={{ border: "3px solid var(--ink)", background: "var(--red)", color: "var(--white)" }}
            >
              {errors[table.name]}
            </pre>
          ) : (
            <pre
              className="okf-tags"
              style={{ maxHeight: 480, overflow: "auto" }}
            >
              {JSON.stringify(rows[table.name], null, 2)}
            </pre>
          )}
        </details>
      ))}
    </div>
  );
}