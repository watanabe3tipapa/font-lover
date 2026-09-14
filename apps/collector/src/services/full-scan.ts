import puppeteer from "@cloudflare/puppeteer";
import type {
  DetectedFont,
  ComputedStyleEntry,
  FontFaceEntry,
  ScanMode,
} from "@font-lover/shared-types";

export interface FullScanResult {
  url: string;
  mode: ScanMode;
  fonts: DetectedFont[];
  fontFaces: FontFaceEntry[];
  computedStyles: ComputedStyleEntry[];
}

export async function fullScan(url: string, browserFetcher: Fetcher): Promise<FullScanResult> {
  const browser = await puppeteer.launch(browserFetcher);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  // document.fonts から読み込まれたフォントを取得
  const fontData: DetectedFont[] = await page.evaluate(async () => {
    await document.fonts.ready;
    const entries: DetectedFont[] = [];
    const seen = new Set<string>();
    document.fonts.forEach((font) => {
      const key = `${font.family}:${font.weight}:${font.style}`;
      if (!seen.has(key)) {
        seen.add(key);
        entries.push({
          family: font.family,
          weight: String(font.weight),
          style: font.style,
          status: font.status,
        });
      }
    });
    return entries;
  });

  // computed styles をサンプリング
  const computedStyles: ComputedStyleEntry[] = await page.evaluate(() => {
    const map = new Map<string, number>();
    const elems = document.querySelectorAll("body, body *");
    elems.forEach((el) => {
      const style = window.getComputedStyle(el);
      const family = style.fontFamily;
      const weight = style.fontWeight;
      const size = style.fontSize;
      const key = `${family}::${weight}::${size}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([key, count]) => {
        const [family, weight, size] = key.split("::");
        return { family, weight, size, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);
  });

  // @font-face ルールを抽出
  const fontFaces: FontFaceEntry[] = await page.evaluate(() => {
    const results: FontFaceEntry[] = [];
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules).forEach((rule) => {
          if (rule instanceof CSSFontFaceRule) {
            const style = (rule as any).style;
            results.push({
              family: style.fontFamily?.replace(/["']/g, "") || "",
              src: style.src || "",
              weight: style.fontWeight || "400",
            });
          }
        });
      } catch {
        // cross-origin stylesheet はスキップ
      }
    });
    return results;
  });

  // 遅延読み込みフォントをトリガーするためにスクロール
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);

  await browser.close();

  return {
    url,
    mode: "full",
    fonts: fontData,
    fontFaces,
    computedStyles,
  };
}
