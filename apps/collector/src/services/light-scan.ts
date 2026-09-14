import type { DetectedFont, FontFaceEntry, ScanMode } from "@font-lover/shared-types";

export interface LightScanResult {
  url: string;
  mode: ScanMode;
  fonts: DetectedFont[];
  fontFaces: FontFaceEntry[];
}

export async function lightScan(url: string): Promise<LightScanResult> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const fonts = new Map<string, DetectedFont>();
  const fontFaces: FontFaceEntry[] = [];

  // @font-face ブロックを抽出
  const fontFaceMatches = html.matchAll(/@font-face\s*\{([^}]+)\}/g);
  for (const m of fontFaceMatches) {
    const block = m[1];
    const familyMatch = block.match(/font-family:\s*["']?([^;"']+)["']?/i);
    const srcMatch = block.match(/src:\s*[^}]*url\(([^)]+)\)/i);
    const weightMatch = block.match(/font-weight:\s*([^;]+)/i);

    if (familyMatch) {
      const family = familyMatch[1].trim();
      fonts.set(family, { family });
      fontFaces.push({
        family,
        src: srcMatch?.[1]?.trim() || "",
        weight: weightMatch?.[1]?.trim() || "400",
      });
    }
  }

  // font-family 宣言を抽出
  const familyMatches = html.matchAll(/font-family:\s*([^;}{]+)/g);
  for (const m of familyMatches) {
    m[1].split(",").forEach((f) => {
      const name = f.trim().replace(/["']/g, "");
      if (name && !fonts.has(name)) {
        fonts.set(name, { family: name });
      }
    });
  }

  // Google Fonts link を検出
  const googleFontMatches = html.matchAll(
    /<link[^>]*fonts\.googleapis\.com[^>]*family=([^&"']+)/g);
  for (const m of googleFontMatches) {
    m[1].split("|").forEach((familyStr) => {
      familyStr.split(",").forEach((f) => {
        const name = f.trim().replace(/\+/g, " ");
        if (name && !fonts.has(name)) {
          fonts.set(name, { family: name, source: "google-fonts" });
        }
      });
    });
  }

  return {
    url,
    mode: "light",
    fonts: Array.from(fonts.values()),
    fontFaces,
  };
}
