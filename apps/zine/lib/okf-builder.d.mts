export interface OkfMeta {
  type: string;
  title?: string;
  description?: string;
  resource?: string;
  tags?: string[];
  status?: string;
  generated?: { by: string; at: string };
  verified?: { by: string; at: string };
  stale_after?: string;
  sources?: Array<{
    id?: string;
    resource: string;
    title?: string;
    usage_count?: number;
    last_modified?: string;
  }>;
}

export interface OkfSection {
  heading: string;
  level: number;
  blocks: string[];
}

export interface OkfConcept {
  id: string;
  type: string;
  url: string;
  title: string;
  meta: OkfMeta;
  sections: OkfSection[];
  learnedAt: string;
  hash: string;
  status?: "new" | "updated" | "unchanged";
}

export interface OkfIndex {
  generatedAt: string;
  total: number;
  byStatus: Record<string, number>;
  concepts: Array<{ id: string; type: string; status: string; sections: number }>;
}

export interface OkfBundle {
  index: OkfIndex;
  concepts: OkfConcept[];
}

export interface BuildOptions {
  previousHashes?: Record<string, string>;
  now?: Date;
}

export function buildOkfKnowledge(
  sqlite: unknown,
  options?: BuildOptions,
): OkfBundle;

export function loadPreviousHashes(dir?: string): Record<string, string>;