"use client";

import { useState, useEffect } from "react";

interface FontItem {
  id: number;
  familyName: string;
  category: string;
  sourceType: string;
  popularityScore: number | null;
}

export default function HomePage() {
  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fonts")
      .then((r) => r.json())
      .then((data) => {
        setFonts(data.fonts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="page-title">フォント図鑑</h2>
      <p className="page-sub">
        Web 上で実際に使われているフォントの観測データ。カードをクリックすると詳細を確認できます。
      </p>

      <h3 className="dash-section-title">政府サイトの採集記録</h3>
      <p className="page-sub" style={{ marginBottom: "1rem" }}>
        2026-09-14、日本の中央省庁・機関 39サイトを light スキャンして採集した実際のフォント使用例です。
      </p>
      <div style={{ marginBottom: "1.5rem" }}>
        <span className="pill">39 サイト採集</span>
        <span className="pill pill-green">7 フォント検出</span>
        <span className="pill pill-yellow">2026-09-14</span>
      </div>
      <div className="font-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        <div className="card">
          <h3>Noto Sans JP</h3>
          <p>デジタル庁 / 総務省で標準採用。公的サイトの定番を実測で確認。</p>
        </div>
        <div className="card card-yellow">
          <h3>Noto Serif JP</h3>
          <p>首相官邸の見出しで使用。フォーマルな文書表現の実例。</p>
        </div>
        <div className="card card-blue">
          <h3>BIZ UDPGothic</h3>
          <p>文化庁で検出。国産ユニバーサルデザイン書体の行政採用例。</p>
        </div>
        <div className="card card-lime">
          <h3>M PLUS Rounded 1c</h3>
          <p>こども家庭庁で検出。丸ゴシックの親しみやすいトーンを選択。</p>
        </div>
      </div>

      {loading ? (
        <p className="loading">LOADING...</p>
      ) : fonts.length === 0 ? (
        <div className="notice">
          <strong>まだフォントが観測されていません。</strong>
          <br />
          collector の /api/scan でサイトをスキャンすると、ここに追加されます。
        </div>
      ) : (
        <div className="font-grid">
          {fonts.map((font) => (
            <a
              key={font.id}
              href={`/font/${encodeURIComponent(font.familyName)}`}
              className="font-card"
            >
              <div className="font-name">{font.familyName}</div>
              <div className="font-meta">
                {font.category} · {font.sourceType}
              </div>
              {font.popularityScore ? (
                <div>
                  <span className="font-count">採集 ×{Math.round(font.popularityScore)}</span>
                </div>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}