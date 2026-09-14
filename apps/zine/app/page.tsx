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
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1e3a8a" }}>フォント図鑑</h2>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {fonts.map((font) => (
            <a
              key={font.id}
              href={`/font/${encodeURIComponent(font.familyName)}`}
              style={{
                display: "block",
                padding: "1.2rem",
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                color: "inherit",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>{font.familyName}</div>
              <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                {font.category} · {font.sourceType}
              </div>
              {font.popularityScore ? (
                <div style={{ fontSize: "0.8rem", color: "#f59e0b", marginTop: "0.3rem" }}>
                  採集回数: {Math.round(font.popularityScore)}
                </div>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
