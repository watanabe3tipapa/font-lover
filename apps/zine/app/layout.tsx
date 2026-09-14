import "./globals.css";

export const metadata = {
  title: "FONT-LOVER — フォントの生態図鑑",
  description: "Web上で実際に使われているフォントを採集・分類・展示するFONT図鑑",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="header">
          <div className="header-inner">
            <div>
              <a href="/" className="header-logo">FONT-LOVER</a>
              <div className="header-tagline">フォントの生態図鑑 🔍✨</div>
            </div>
            <nav className="nav">
              <a href="/">図鑑トップ</a>
              <a href="/dashboard">統計</a>
              <a href="/site/stripe.com">サイト別</a>
              <a href="/inspector">DB検査</a>
              <a href="/okf">OKF</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          FONT-LOVER Experiment Repository — Webフォント探索プロジェクト
        </footer>
      </body>
    </html>
  );
}