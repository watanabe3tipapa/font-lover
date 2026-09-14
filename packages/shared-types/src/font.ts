export interface FontFamily {
  id: number;
  familyName: string;
  category: FontCategory;
  sourceType: SourceType;
  popularityScore: number | null;
  firstSeenAt: string;
  updatedAt: string;
}

export interface FontFace {
  id: number;
  familyId: number;
  weight: string;
  style: string;
  sourceUrl: string | null;
  format: string | null;
}

export interface FontSighting {
  id: number;
  familyId: number;
  siteUrl: string;
  siteDomain: string;
  pageTitle: string | null;
  usageCount: number | null;
  mode: ScanMode;
  detectedAt: string;
}

export interface FontMdnRef {
  id: number;
  familyId: number;
  mdnSlug: string;
  description: string | null;
  compatibilityNote: string | null;
}

export type FontCategory = "sans-serif" | "serif" | "display" | "monospace" | "handwriting" | "unknown";
export type SourceType = "google-fonts" | "adobe-fonts" | "system" | "self-hosted" | "unknown";
export type ScanMode = "light" | "full";
