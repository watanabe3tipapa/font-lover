"use client";

interface FontCardProps {
  family: string;
  category: string;
  sourceType: string;
  popularityScore?: number | null;
}

export default function FontCard({ family, category, sourceType, popularityScore }: FontCardProps) {
  return (
    <a
      href={`/font/${encodeURIComponent(family)}`}
      style={{
        display: "block",
        padding: "1.2rem",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px -6px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
      }}
    >
      <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.3rem" }}>{family}</div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.15em 0.6em",
            borderRadius: 999,
            background: "#1e3a8a15",
            color: "#1e3a8a",
          }}
        >
          {category}
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.15em 0.6em",
            borderRadius: 999,
            background: "#f59e0b15",
            color: "#b45309",
          }}
        >
          {sourceType}
        </span>
        {popularityScore ? (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.15em 0.6em",
              borderRadius: 999,
              background: "#0f172a15",
              color: "#0f172a",
            }}
          >
            採集 {Math.round(popularityScore)}
          </span>
        ) : null}
      </div>
    </a>
  );
}
