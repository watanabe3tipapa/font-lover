import { drizzle } from "drizzle-orm/d1";
import { fontFamilies } from "./schema";

async function seed() {
  // D1 binding は Wrangler / local D1 で注入
  const db = drizzle(process.env.DB as any);

  await db.insert(fontFamilies).values([
    { familyName: "Inter", category: "sans-serif", sourceType: "google-fonts", popularityScore: 0 },
    { familyName: "Merriweather", category: "serif", sourceType: "google-fonts", popularityScore: 0 },
    { familyName: "JetBrains Mono", category: "monospace", sourceType: "google-fonts", popularityScore: 0 },
  ]);

  console.log("Seed completed.");
}

seed().catch(console.error);
