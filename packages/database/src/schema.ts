import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const fontFamilies = sqliteTable("font_families", {
  id: integer("id").primaryKey(),
  familyName: text("family_name").notNull().unique(),
  category: text("category", { enum: ["sans-serif", "serif", "display", "monospace", "handwriting", "unknown"] })
    .notNull()
    .default("unknown"),
  sourceType: text("source_type", { enum: ["google-fonts", "adobe-fonts", "system", "self-hosted", "unknown"] })
    .notNull()
    .default("unknown"),
  popularityScore: real("popularity_score"),
  firstSeenAt: text("first_seen_at"),
  updatedAt: text("updated_at"),
});

export const fontFaces = sqliteTable("font_faces", {
  id: integer("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  weight: text("weight"),
  style: text("style"),
  sourceUrl: text("source_url"),
  format: text("format"),
});

export const fontSightings = sqliteTable("font_sightings", {
  id: integer("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  siteUrl: text("site_url").notNull(),
  siteDomain: text("site_domain").notNull(),
  pageTitle: text("page_title"),
  usageCount: integer("usage_count"),
  mode: text("mode", { enum: ["light", "full"] }).notNull(),
  detectedAt: text("detected_at").default("CURRENT_TIMESTAMP"),
});

export const fontMdnRefs = sqliteTable("font_mdn_refs", {
  id: integer("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  mdnSlug: text("mdn_slug").notNull(),
  description: text("description"),
  compatibilityNote: text("compatibility_note"),
});
