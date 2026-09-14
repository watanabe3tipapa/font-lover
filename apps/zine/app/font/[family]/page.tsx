"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface FontDetail {
  id: number;
  familyName: string;
  category: string;
  sourceType: string;
  popularityScore: number | null;
  firstSeenAt: string;
}

interface Sighting {
  siteDomain: string;
  siteUrl: string;
  detectedAt: string;
  usageCount: number | null;
}

export default function FontDetailPage() {
  const params = useParams();
  const family = decodeURIComponent(params.family as string);
  const [font, setFont] = useState<FontDetail | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/fonts/${encodeURIComponent(family)}`)
      .then((r) => r.json())
      .then((data) => {
        setFont(data.font || null);
        setSightings(data.sightings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [family]);

  if (loading) return <p className="loading">LOADING...</p>;
  if (!font) return <div className="notice">フォントが見つかりませんでした。</div>;

  return (
    <div>
      <a href="/" className="back-link">← 図鑑トップへ</a>

      <h2 className="page-title">{font.familyName}</h2>

      <div style={{ marginBottom: "1rem" }}>
        <span className="pill pill-blue">{font.category}</span>
        <span className="pill pill-green">{font.sourceType}</span>
        {font.popularityScore ? (
          <span className="pill pill-yellow">採集 ×{Math.round(font.popularityScore)}</span>
        ) : null}
      </div>

      {/* Google Fonts プレビュー */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.familyName)}:wght@400;700&display=swap`}
        rel="stylesheet"
      />
      <div
        className="card card-yellow"
        style={{
          fontFamily: `"${font.familyName}", sans-serif`,
          fontSize: "1.5rem",
        }}
      >
        <div style={{ fontWeight: 700 }}>{font.familyName}</div>
        <div style={{ fontSize: "1rem" }}>
          The quick brown fox jumps over the lazy dog.
          <br />
          あいうえお、かきくけこ。フォントのプレビュー表示。
        </div>
      </div>

      {/* 採集記録 */}
      <h3 className="dash-section-title">採集記録</h3>
      {sightings.length === 0 ? (
        <div className="notice">まだ採集記録がありません。</div>
      ) : (
        <div style={{ marginTop: "0.8rem" }}>
          {sightings.map((s, i) => (
            <a
              key={i}
              href={s.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="row"
            >
              <div>
                <div className="row-main">{s.siteDomain}</div>
                <div className="row-sub">URL: {s.siteUrl}</div>
              </div>
              <div className="row-right">
                <div>{new Date(s.detectedAt).toLocaleDateString("ja-JP")}</div>
                {s.usageCount ? <div>使用数: {s.usageCount}</div> : null}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* MDN解説セクション（拡張用） */}
      <h3 className="dash-section-title">MDN 解説</h3>
      <div className="notice" style={{ borderLeftColor: "var(--blue)" }}>
        MDN Web Docs からのフォント関連解説をここに表示します。
        <br />
        <code>font_mdn_refs</code> テーブルとの連携を実装してください。
      </div>
    </div>
  );
}