"use client";

import { useState, useEffect } from "react";

interface StatsData {
  totalFonts: number;
  totalSightings: number;
  categoryDistribution: { category: string; count: number }[];
  sourceDistribution: { sourceType: string; count: number }[];
  topFonts: { familyName: string; popularityScore: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>読み込み中...</p>;
  if (!stats) return <p>統計データを取得できませんでした。</p>;

  const maxPop = Math.max(...stats.topFonts.map((f) => f.popularityScore), 1);

  return (
    <div>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "#1e3a8a" }}>統計ダッシュボード</h2>

      {/* サマリーカード */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ background: "#1e3a8a", color: "#fff", padding: "1.2rem", borderRadius: 12 }}>
          <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>総フォント数</div>
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.totalFonts}</div>
        </div>
        <div style={{ background: "#f59e0b", color: "#fff", padding: "1.2rem", borderRadius: 12 }}>
          <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>総採集回数</div>
          <div style={{ fontSize: "2rem", fontWeight: 700 }}>{stats.totalSightings}</div>
        </div>
      </div>

      {/* カテゴリ分布 */}
      <h3 style={{ fontSize: "1.2rem", color: "#1e3a8a", marginBottom: "0.8rem" }}>カテゴリ分布</h3>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1rem", marginBottom: "2rem" }}>
        {stats.categoryDistribution.map((cat) => (
          <div key={cat.category} style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 100, fontSize: "0.85rem", fontWeight: 500 }}>{cat.category}</div>
            <div style={{ flex: 1, height: 20, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(cat.count / Math.max(...stats.categoryDistribution.map((c) => c.count))) * 100}%`,
                  background: "#1e3a8a",
                  borderRadius: 10,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div style={{ width: 40, textAlign: "right", fontSize: "0.85rem", color: "#475569" }}>{cat.count}</div>
          </div>
        ))}
      </div>

      {/* ソース分布 */}
      <h3 style={{ fontSize: "1.2rem", color: "#1e3a8a", marginBottom: "0.8rem" }}>ソース種別分布</h3>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1rem", marginBottom: "2rem" }}>
        {stats.sourceDistribution.map((src) => (
          <div key={src.sourceType} style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 120, fontSize: "0.85rem", fontWeight: 500 }}>{src.sourceType}</div>
            <div style={{ flex: 1, height: 20, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(src.count / Math.max(...stats.sourceDistribution.map((s) => s.count))) * 100}%`,
                  background: "#f59e0b",
                  borderRadius: 10,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div style={{ width: 40, textAlign: "right", fontSize: "0.85rem", color: "#475569" }}>{src.count}</div>
          </div>
        ))}
      </div>

      {/* 人気フォントランキング */}
      <h3 style={{ fontSize: "1.2rem", color: "#1e3a8a", marginBottom: "0.8rem" }}>人気フォント TOP 10</h3>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1rem" }}>
        {stats.topFonts.slice(0, 10).map((font, i) => (
          <div key={font.familyName} style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 28, textAlign: "center", fontWeight: 700, color: "#f59e0b" }}>{i + 1}</div>
            <a
              href={`/font/${encodeURIComponent(font.familyName)}`}
              style={{ width: 200, fontSize: "0.9rem", color: "#1e3a8a", textDecoration: "none", fontWeight: 500 }}
            >
              {font.familyName}
            </a>
            <div style={{ flex: 1, height: 16, background: "#f1f5f9", borderRadius: 8, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(font.popularityScore / maxPop) * 100}%`,
                  background: "#1e3a8a",
                  borderRadius: 8,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div style={{ width: 50, textAlign: "right", fontSize: "0.8rem", color: "#475569" }}>
              {Math.round(font.popularityScore)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
