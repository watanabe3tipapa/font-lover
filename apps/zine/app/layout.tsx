export const metadata = {
  title: "FONT-LOVER — フォントの生態図鑑",
  description: "Web上で実際に使われているフォントを採集・分類・展示するFONT図鑑",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: '"Noto Sans JP", sans-serif', background: "#f4f6f8" }}>
        <header style={{ background: "linear-gradient(160deg, #1e3a8a, #0f172a)", color: "#fff", padding: "2rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>
            <a href="/" style={{ color: "inherit", textDecoration: "none" }}>FONT-LOVER</a>
          </h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.85 }}>フォントの生態図鑑</p>
          <nav style={{ marginTop: "1.2rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <a href="/" style={{ color: "#fff", textDecoration: "none", fontSize: "0.9rem", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", padding: "0.4em 0.9em", borderRadius: 999 }}>図鑑トップ</a>
            <a href="/dashboard" style={{ color: "#fff", textDecoration: "none", fontSize: "0.9rem", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", padding: "0.4em 0.9em", borderRadius: 999 }}>統計ダッシュボード</a>
            <a href="/site/stripe.com" style={{ color: "#fff", textDecoration: "none", fontSize: "0.9rem", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", padding: "0.4em 0.9em", borderRadius: 999 }}>サイト別ビュー</a>
            <a href="/inspector" style={{ color: "#fff", textDecoration: "none", fontSize: "0.9rem", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", padding: "0.4em 0.9em", borderRadius: 999 }}>DBインスペクタ</a>
            <a href="/okf" style={{ color: "#fff", textDecoration: "none", fontSize: "0.9rem", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", padding: "0.4em 0.9em", borderRadius: 999 }}>OKFビューワー</a>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
          {children}
        </main>
        <footer style={{ textAlign: "center", padding: "2rem", color: "#475569", fontSize: "0.875rem", borderTop: "1px solid #e2e8f0" }}>
          FONT-LOVER Experiment Repository
        </footer>
      </body>
    </html>
  );
}
