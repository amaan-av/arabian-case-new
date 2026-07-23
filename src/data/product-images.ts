/**
 * Maps product names to images dynamically from 'Website picture 2/today image'
 * using word-based similarity matching. Falls back to original keyword mapping
 * for existing products.
 */

import portfolioItems from "@/data/portfolio-items.json";
import { categories } from "@/data/catalog";

export interface ProductImage {
  large: string;
  thumb: string;
  type: "product" | "project";
}

export interface ProductImageSet {
  mainImage: ProductImage | null;
  galleryImages: ProductImage[];
}

export interface PortfolioItem {
  id: string;
  category: string;
  categoryLabel: string;
  large: string;
  thumb: string;
  type: "product" | "project";
  title: string;
}

// ── Dynamically load today's images ────────────────────────────────────
const todayImages = import.meta.glob(
  "/Website picture 2/today image/**/*.{png,jpg,jpeg,webp,JPG,JPEG,PNG,heic,HEIC}",
  { eager: true, import: "default" }
) as Record<string, string>;

interface ScannedImage {
  path: string;
  url: string;
  filename: string;
  stem: string;
  baseName: string;
  isGallery: boolean;
}

const scannedImages: ScannedImage[] = Object.entries(todayImages).map(([path, url]) => {
  const filename = path.split("/").pop() || "";
  const stem = filename.replace(/\.[^/.]+$/, "");
  
  // Clean stem of gallery keywords
  const baseName = stem
    .toLowerCase()
    .replace(/\b(angle|side|view|perspective|2|second)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
    
  const isGallery = /\b(angle|side|view|perspective|2|second)\b/i.test(stem);
  
  return {
    path,
    url,
    filename,
    stem,
    baseName,
    isGallery
  };
});

// ── Word-based similarity matcher ──────────────────────────────────────
function getSimilarityScore(str1: string, str2: string): number {
  const getWords = (s: string) =>
    s.toLowerCase()
     .replace(/[^a-z0-9]/g, " ")
     .split(/\s+/)
     .filter(Boolean)
     .map(w => {
       if (w === "wodden") return "wooden";
       if (w === "pallet" || w === "pallets") return "pallet";
       if (w === "box" || w === "boxes") return "box";
       if (w === "crate" || w === "crates") return "crate";
       if (w === "sheet" || w === "sheets") return "sheet";
       if (w === "table" || w === "tables") return "table";
       if (w === "insert" || w === "inserts") return "insert";
       if (w === "cover" || w === "covers" || w === "case" || w === "cases") return "case";
       return w;
     });

  const w1 = getWords(str1);
  const w2 = getWords(str2);
  
  if (w1.length === 0 || w2.length === 0) return 0;
  
  // Custom synonym handling: if both contain "custom", "sheet" and "insert" match
  const hasCustom = w1.includes("custom") && w2.includes("custom");
  const normalizedW1 = w1.map(w => (w === "sheet" && hasCustom ? "insert" : w));
  const normalizedW2 = w2.map(w => (w === "sheet" && hasCustom ? "insert" : w));

  let matches = 0;
  for (const word of normalizedW1) {
    if (normalizedW2.includes(word)) {
      matches++;
    }
  }
  
  const union = new Set([...normalizedW1, ...normalizedW2]).size;
  return matches / union;
}

function getTodayMatch(productName: string): { main: ScannedImage; gallery: ScannedImage[] } | null {
  let bestScore = 0;
  let bestBaseName = "";
  
  for (const img of scannedImages) {
    const score = getSimilarityScore(productName, img.baseName);
    if (score > bestScore) {
      bestScore = score;
      bestBaseName = img.baseName;
    }
  }
  
  if (bestScore < 0.6) {
    return null;
  }
  
  const matches = scannedImages.filter(img => img.baseName === bestBaseName);
  const main = matches.find(img => !img.isGallery) || matches[0];
  const gallery = matches.filter(img => img !== main);
  
  return { main, gallery };
}

// ── Original Keyword-based mapping for fallback ───────────────────────
const productKeywords: Record<string, string[][]> = {
  "flight-cases/rack-cases": [["rack-case"], ["rackcase"]],
  "flight-cases/cable-trunks": [["cable-trunk"]],
  "flight-cases/audio-equipment-cases": [
    ["speaker-case-j"],
  ],
  "flight-cases/utility-covers": [
    ["utility-case"],
    ["utility-box"],
    ["custom-covers"],
  ],
  "flight-cases/utility-flight-cases": [
    ["utility-case"],
    ["utility-box"],
    ["utility-case-j"],
    ["custom-covers"],
  ],
  "flight-cases/tv-screen-cases": [["screen-case"]],
  "flight-cases/dj-tables": [["keyboard-case"]],
  "foam-inserts/tool-control": [["tool-box"], ["toolbox"]],
  "foam-inserts/custom-foam-inserts": [["foam-insert"]],
  "foam-inserts/foam-sheets": [["foam-insert"]],
  "foam-inserts/foam-blocks": [["foam-insert"]],
  "hard-cases/pelican-cases": [["pelican"]],
  "shipping-crates/heavy-duty-wooden-crates": [["wooden-crate"], ["wooden-craated"]],
  "shipping-crates/custom-wooden-pallets": [["wooden-crate"], ["wooden-craated"]],
  "shipping-crates/custom-wooden-boxes": [["wooden-crate"], ["wooden-craated"]],
  "custom-bags/equipment-bags": [["equipment-tools-bag"], ["equipment"]],
  "custom-bags/custom-covers": [["custom-covers"]],
  "custom-bags/belt-pouches": [["belt-pouch"]],
  "custom-bags/medical-bags": [["medical-bag"]],
  "exhibition/shell-scheme-stand": [["exhibition-stand"], ["exhibitionstand"]],
  "exhibition/premium-exhibition-stand": [
    ["premium-exhibition"],
    ["premuim-exhibition"],
  ],
  "exhibition/outdoor-kiosk": [
    ["outdoor-kiosk"],
    ["outdoor-kioxk"],
    ["outdoor-kisok"],
    ["outdoorkiosk"],
  ],
  "exhibition/event-photo-ops": [
    ["event-photo"],
    ["eventphoto"],
    ["photobs"],
  ],
  "furniture/sofa-makers": [["sofa"]],
  "furniture/wooden-tables": [["furniture"]],
  "furniture/office-furniture": [["furniture"]],
  "furniture/school-furniture": [["furniture"]],
  "furniture/premium-furniture": [["furniture"], ["sofa"]],
  "furniture/custom-display-units": [
    ["display-stand"],
    ["custom-display"],
  ],
  "utility-covers/machinery-covers": [
    ["utility-case"],
    ["utility-box"],
    ["custom-covers"],
  ],
  "utility-covers/generator-covers": [
    ["utility-case"],
    ["custom-covers"],
  ],
  "utility-covers/equipment-covers": [
    ["utility-case"],
    ["utility-box"],
    ["custom-covers"],
  ],
  "utility-covers/outdoor-covers": [
    ["utility-case"],
    ["custom-covers"],
  ],
};

const allImages = portfolioItems as {
  id: string;
  category: string;
  categoryLabel: string;
  large: string;
  thumb: string;
  type: "product" | "project";
}[];

function matchImage(imageId: string, keywordGroups: string[][]): boolean {
  const id = imageId.toLowerCase();
  return keywordGroups.some((group) =>
    group.every((kw) => id.includes(kw.toLowerCase())),
  );
}

function getMatchingImages(
  categorySlug: string,
  productSlug: string,
): typeof allImages {
  const key = `${categorySlug}/${productSlug}`;
  const kwGroups = productKeywords[key];
  if (!kwGroups) return [];

  const matches = allImages.filter((img) => matchImage(img.id, kwGroups));

  matches.sort((a, b) => {
    if (a.type === "product" && b.type !== "product") return -1;
    if (a.type !== "product" && b.type === "product") return 1;
    return 0;
  });

  if (key === "flight-cases/utility-covers" || key === "flight-cases/utility-flight-cases") {
    const targetIdx = matches.findIndex((m) => m.id === "utility-case1");
    if (targetIdx > -1) {
      const [targetItem] = matches.splice(targetIdx, 1);
      matches.unshift(targetItem);
    }
  }

  // Audio equipment cases: only show the 10 numbered JPEG speaker cases (j2–j11)
  if (key === "flight-cases/audio-equipment-cases") {
    return matches.filter((m) => m.id !== "speaker-case-j1");
  }

  return matches;
}

// ── Reusable dynamic image loader utility ─────────────────────────────
export function getProductImages(productName: string): ProductImageSet {
  // 1. Get fallback images first
  let fallbackMain: ProductImage | null = null;
  let fallbackGallery: ProductImage[] = [];
  
  for (const cat of categories) {
    const product = cat.products.find(
      (p) => p.title.toLowerCase() === productName.toLowerCase()
    );
    if (product) {
      const matches = getMatchingImages(cat.slug, product.slug);
      if (matches.length > 0) {
        fallbackMain = {
          large: matches[0].large,
          thumb: matches[0].thumb,
          type: matches[0].type,
        };
        fallbackGallery = matches.slice(1).map((m) => ({
          large: m.large,
          thumb: m.thumb,
          type: m.type,
        }));
      }
    }
  }

  // 2. Get today's match
  const todayMatch = getTodayMatch(productName);

  // 3. Apply custom logic for Audio Equipment Cases to merge keyboard cases
  if (productName.toLowerCase() === "audio-equipment-cases" || productName.toLowerCase() === "audio equipment cases") {
    const keyboardGallery: ProductImage[] = [];
    if (todayMatch) {
      keyboardGallery.push({
        large: todayMatch.main.url,
        thumb: todayMatch.main.url,
        type: "product",
      });
      for (const img of todayMatch.gallery) {
        keyboardGallery.push({
          large: img.url,
          thumb: img.url,
          type: "product",
        });
      }
    }
    return {
      mainImage: fallbackMain,
      galleryImages: [...keyboardGallery, ...fallbackGallery],
    };
  }

  // 4. Standard match logic for other products
  if (todayMatch) {
    return {
      mainImage: {
        large: todayMatch.main.url,
        thumb: todayMatch.main.url,
        type: "product",
      },
      galleryImages: todayMatch.gallery.map((img) => ({
        large: img.url,
        thumb: img.url,
        type: "product",
      })),
    };
  }

  return {
    mainImage: fallbackMain,
    galleryImages: fallbackGallery,
  };
}

// ── Helper to format today's scanned images as PortfolioItems ─────────
export function getTodayPortfolioItems(): PortfolioItem[] {
  const getCategoryFromFilename = (filename: string): { category: string; categoryLabel: string } => {
    const lower = filename.toLowerCase();
    if (lower.includes("foam")) {
      return { category: "foam-inserts", categoryLabel: "Foam Inserts" };
    }
    if (lower.includes("pallet") || lower.includes("box") || lower.includes("crate")) {
      return { category: "shipping-crates", categoryLabel: "Shipping Crates" };
    }
    if (lower.includes("furniture") || lower.includes("sofa") || lower.includes("table")) {
      return { category: "furniture", categoryLabel: "Furniture" };
    }
    if (lower.includes("utility")) {
      return { category: "utility-covers", categoryLabel: "Utility Covers" };
    }
    return { category: "projects", categoryLabel: "Projects" };
  };

  return scannedImages.map((img) => {
    const { category, categoryLabel } = getCategoryFromFilename(img.filename);
    const id = img.stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return {
      id,
      category,
      categoryLabel,
      large: img.url,
      thumb: img.url,
      type: "product",
      title: img.stem,
    };
  });
}

