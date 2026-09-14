import Database from "better-sqlite3";

const sqlite = new Database("./font-lover.db");

const families = [
  { familyName: "Inter", category: "sans-serif", sourceType: "google-fonts", popularityScore: 25 },
  { familyName: "Noto Sans JP", category: "sans-serif", sourceType: "google-fonts", popularityScore: 22 },
  { familyName: "JetBrains Mono", category: "monospace", sourceType: "google-fonts", popularityScore: 18 },
  { familyName: "Playfair Display", category: "serif", sourceType: "google-fonts", popularityScore: 14 },
  { familyName: "Merriweather", category: "serif", sourceType: "google-fonts", popularityScore: 9 },
  { familyName: "SF Pro Display", category: "sans-serif", sourceType: "system", popularityScore: 12 },
  { familyName: "IBM Plex Sans", category: "sans-serif", sourceType: "google-fonts", popularityScore: 7 },
];

const now = new Date().toISOString();

const insertFamily = sqlite.prepare(`
  INSERT INTO font_families (family_name, category, source_type, popularity_score, first_seen_at, updated_at)
  VALUES (@familyName, @category, @sourceType, @popularityScore, @firstSeenAt, @updatedAt)
`);

const insertSighting = sqlite.prepare(`
  INSERT INTO font_sightings (family_id, site_url, site_domain, page_title, usage_count, mode, detected_at)
  VALUES (@familyId, @siteUrl, @siteDomain, @pageTitle, @usageCount, @mode, @detectedAt)
`);

const insertMdnRef = sqlite.prepare(`
  INSERT INTO font_mdn_refs (family_id, mdn_slug, description, compatibility_note)
  VALUES (@familyId, @mdnSlug, @description, @compatibilityNote)
`);

const sites = [
  { url: "https://stripe.com", domain: "stripe.com", title: "Stripe — Payment infrastructure" },
  { url: "https://linear.app", domain: "linear.app", title: "Linear — Plan and build" },
  { url: "https://vercel.com", domain: "vercel.com", title: "Vercel — Develop. Preview. Ship." },
  { url: "https://github.com", domain: "github.com", title: "GitHub" },
  { url: "https://tailwindcss.com", domain: "tailwindcss.com", title: "Tailwind CSS" },
];

const existing = sqlite.prepare(`SELECT COUNT(*) AS c FROM font_families`).get();
if (existing.c > 0) {
  console.log("Already seeded. Skipping.");
  process.exit(0);
}

for (const [i, family] of families.entries()) {
  const familyId = Number(insertFamily.run({ ...family, firstSeenAt: now, updatedAt: now }).lastInsertRowid);
  const site = sites[i % sites.length];
  insertSighting.run({
    familyId,
    siteUrl: site.url,
    siteDomain: site.domain,
    pageTitle: site.title,
    usageCount: 1 + (i % 5),
    mode: "light",
    detectedAt: now,
  });

  const mdnSlug = i % 2 === 0 ? "font-family" : "@font-face";
  insertMdnRef.run({
    familyId,
    mdnSlug,
    description:
      mdnSlug === "font-family"
        ? "CSS の font-family プロパティは、選択した要素に対し、フォントファミリ名や総称ファミリ名の優先順位リストを指定します。"
        : "CSS の @font-face アットルールは、ウェブフォントとしてテキストを表示するためのフォントフェイスを指定します。",
    compatibilityNote: "MDN では主要ブラウザすべてに対応を確認済み。",
  });
}

console.log(`Seeded ${families.length} font families into ./font-lover.db`);