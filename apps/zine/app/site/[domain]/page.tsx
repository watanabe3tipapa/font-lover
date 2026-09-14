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
      <a href="/" className="back-link">← 図鑑トップへ</a>
      <h2 className="page-title">{domain}</h2>
      <p className="page-sub">このサイトで検出されたフォント一覧</p>

      {loading ? (
        <p className="loading">LOADING...</p>
      ) : fonts.length === 0 ? (
        <div className="notice">まだフォントが検出されていません。</div>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {fonts.map((font, i) => (
            <a
              key={i}
              href={`/font/${encodeURIComponent(font.familyName)}`}
              className="row"
            >
              <div>
                <div className="row-main">{font.familyName}</div>
                <div className="row-sub">
                  {font.category} · {font.sourceType}
                </div>
              </div>
              <div className="row-right">
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