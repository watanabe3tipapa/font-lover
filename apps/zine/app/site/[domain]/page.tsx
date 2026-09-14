"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface SiteFont {
  familyName: string;
  category: string;
  sourceType: string;
  detectedAt: string;
  usageCount: number | null;
}

export default function SitePage() {
  const params = useParams();
  const domain = decodeURIComponent(params.domain as string);
  const [fonts, setFonts] = useState<SiteFont[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sites/${encodeURIComponent(domain)}`)
      .then((r) => r.json())
      .then((data) => {
        setFonts(data.fonts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [domain]);

  return (
    <div>
      <a href="/" style={{ color: "#1e3a8a", textDecoration: "none", fontSize: "0.9rem" }}>← 図鑑トップへ</a>
      <h2 style={{ fontSize: "1.8rem", marginTop: "1rem", color: "#1e3a8a" }}>{domain}</h2>
      <p style={{ color: "#475569" }}>このサイトで検出されたフォント一覧</p>

      {loading ? (
        <p>読み込み中...</p>
      ) : fonts.length === 0 ? (
        <p style={{ color: "#475569", marginTop: "1rem" }}>まだフォントが検出されていません。</p>
      ) : (
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.6rem" }}>
          {fonts.map((font, i) => (
            <a
              key={i}
              href={`/font/${encodeURIComponent(font.familyName)}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.9rem 1rem",
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{font.familyName}</div>
                <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.15rem" }}>
                  {font.category} · {font.sourceType}
                </div>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#475569", textAlign: "right" }}>
                <div>{new Date(font.detectedAt).toLocaleDateString("ja-JP")}</div>
                {font.usageCount ? <div>使用数: {font.usageCount}</div> : null}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
