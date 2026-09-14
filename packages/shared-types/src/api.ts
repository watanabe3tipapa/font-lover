import { ScanMode } from "./font";

// POST /api/scan
export interface ScanRequest {
  url: string;
  mode?: ScanMode;
}

export interface DetectedFont {
  family: string;
  weight?: string;
  style?: string;
  source?: string;
  status?: string;
}

export interface ComputedStyleEntry {
  family: string;
  weight: string;
  size: string;
  count: number;
}

export interface FontFaceEntry {
  family: string;
  src: string;
  weight: string;
}

export interface ScanResponse {
  url: string;
  mode: ScanMode;
  fonts: DetectedFont[];
  fontFaces?: FontFaceEntry[];
  computedStyles?: ComputedStyleEntry[];
}

export interface ScanError {
  error: string;
}

// POST /api/collect (batch)
export interface CollectRequest {
  urls: string[];
  mode?: ScanMode;
}

export interface CollectResponse {
  results: (ScanResponse | ScanError)[];
  processed: number;
  failed: number;
}
