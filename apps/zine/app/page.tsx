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