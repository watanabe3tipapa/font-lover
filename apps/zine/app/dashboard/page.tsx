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

  if (loading) return <p className="loading">LOADING...</p>;
  if (!stats) return <div className="notice">統計データを取得できませんでした。</div>;

  const maxPop = Math.max(...stats.topFonts.map((f) => f.popularityScore), 1);

  return (
    <div>
      <h2 className="page-title">統計ダッシュボード</h2>
      <p className="page-sub">観測データの要約。数字はすべて D1 / SQLite からリアルタイム集計しています。</p>

      <div className="stat-grid">
        <div className="stat-card card-yellow">
          <div className="stat-label">総フォント数</div>
          <div className="stat-value">{stats.totalFonts}</div>
        </div>
        <div className="stat-card card-pink">
          <div className="stat-label">総採集回数</div>
          <div className="stat-value">{stats.totalSightings}</div>
        </div>
      </div>

      <h3 className="dash-section-title">カテゴリ分布</h3>
      <div className="card">
        {stats.categoryDistribution.length === 0 ? (
          <p>データがありません。</p>
        ) : (
          stats.categoryDistribution.map((cat) => {
            const max = Math.max(...stats.categoryDistribution.map((c) => c.count));
            return (
              <div key={cat.category} className="bar-row">
                <div className="bar-label">{cat.category}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(cat.count / max) * 100}%` }} />
                </div>
                <div className="bar-num">{cat.count}</div>
              </div>
            );
          })
        )}
      </div>

      <h3 className="dash-section-title">ソース種別分布</h3>
      <div className="card">
        {stats.sourceDistribution.length === 0 ? (
          <p>データがありません。</p>
        ) : (
          stats.sourceDistribution.map((src) => {
            const max = Math.max(...stats.sourceDistribution.map((s) => s.count));
            return (
              <div key={src.sourceType} className="bar-row">
                <div className="bar-label">{src.sourceType}</div>
                <div className="bar-track">
                  <div className="bar-fill bar-fill-blue" style={{ width: `${(src.count / max) * 100}%` }} />
                </div>
                <div className="bar-num">{src.count}</div>
              </div>
            );
          })
        )}
      </div>

      <h3 className="dash-section-title">人気フォント TOP 10</h3>
      <div className="card">
        {stats.topFonts.slice(0, 10).map((font, i) => (
          <div key={font.familyName} className="bar-row">
            <span className="rank-num">{i + 1}</span>
            <a
              href={`/font/${encodeURIComponent(font.familyName)}`}
              style={{ width: 200, fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {font.familyName}
            </a>
            <div className="bar-track">
              <div
                className="bar-fill bar-fill-green"
                style={{ width: `${(font.popularityScore / maxPop) * 100}%` }}
              />
            </div>
            <div className="bar-num">{Math.round(font.popularityScore)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}