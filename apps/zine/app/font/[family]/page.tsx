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

  if (loading) return <p>読み込み中...</p>;
  if (!font) return <p>フォントが見つかりませんでした。</p>;

  return (
    <div>
      <a href="/" style={{ color: "#1e3a8a", textDecoration: "none", fontSize: "0.9rem" }}>← 図鑑トップへ</a>

      <h2 style={{ fontSize: "2rem", marginTop: "1rem", color: "#1e3a8a" }}>{font.familyName}</h2>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ background: "#1e3a8a", color: "#fff", padding: "0.2em 0.7em", borderRadius: 999, fontSize: "0.8rem" }}>
          {font.category}
        </span>
        <span style={{ background: "#f59e0b", color: "#fff", padding: "0.2em 0.7em", borderRadius: 999, fontSize: "0.8rem" }}>
          {font.sourceType}
        </span>
        {font.popularityScore ? (
          <span style={{ background: "#0f172a", color: "#fff", padding: "0.2em 0.7em", borderRadius: 999, fontSize: "0.8rem" }}>
            採集回数: {Math.round(font.popularityScore)}
          </span>
        ) : null}
      </div>

      {/* Google Fonts プレビュー */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.familyName)}:wght@400;700&display=swap`}
        rel="stylesheet"
      />
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1.5rem",
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          fontFamily: `"${font.familyName}", sans-serif`,
          fontSize: "1.5rem",
        }}
      >
        The quick brown fox jumps over the lazy dog.
        <br />
        あいうえお、かきくけこ。フォントのプレビュー表示。
      </div>

      {/* 採集記録 */}
      <h3 style={{ fontSize: "1.2rem", marginTop: "2rem", color: "#1e3a8a" }}>採集記録</h3>
      {sightings.length === 0 ? (
        <p style={{ color: "#475569" }}>まだ採集記録がありません。</p>
      ) : (
        <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.5rem" }}>
          {sightings.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "0.8rem 1rem",
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <a
                href={s.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1e3a8a", textDecoration: "none", fontWeight: 500 }}
              >
                {s.siteDomain}
              </a>
              <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                {new Date(s.detectedAt).toLocaleDateString("ja-JP")}
                {s.usageCount ? ` · 使用数: ${s.usageCount}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* MDN解説セクション（拡張用） */}
      <h3 style={{ fontSize: "1.2rem", marginTop: "2rem", color: "#1e3a8a" }}>MDN 解説</h3>
      <div
        style={{
          marginTop: "0.8rem",
          padding: "1rem",
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          color: "#475569",
          fontSize: "0.95rem",
        }}
      >
        MDN Web Docs からのフォント関連解説をここに表示します。
        <code>font_mdn_refs</code> テーブルとの連携を実装してください。
      </div>
    </div>
  );
}
