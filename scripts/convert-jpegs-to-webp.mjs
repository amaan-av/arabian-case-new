/**
 * convert-jpegs-to-webp.mjs
 * Converts all JPEG images in /public/portfolio/large to WebP,
 * creates thumbnails in /public/portfolio/thumbs,
 * and updates portfolio-items.json to point to the new .webp files.
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const largeDir = path.join(root, "public", "portfolio", "large");
const thumbsDir = path.join(root, "public", "portfolio", "thumbs");
const jsonPath = path.join(root, "src", "data", "portfolio-items.json");

// Read current JSON
const items = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

// Find all JPEG files in large
const jpegFiles = fs
  .readdirSync(largeDir)
  .filter((f) => /\.(jpe?g|JPE?G)$/i.test(f));

console.log(`Found ${jpegFiles.length} JPEG files to convert:\n`);

// Build a map: original jpeg filename -> json id
const filenameToId = {};
for (const item of items) {
  const largePath = item.large;
  const filename = largePath.split("/").pop();
  if (filename && /\.(jpe?g|JPE?G)$/i.test(filename)) {
    filenameToId[filename] = item.id;
  }
}

let converted = 0;
let skipped = 0;

for (const jpegFile of jpegFiles) {
  const id = filenameToId[jpegFile];
  if (!id) {
    console.log(`  Warning  Skipped (no JSON entry): ${jpegFile}`);
    skipped++;
    continue;
  }

  const webpFilename = `${id}.webp`;
  const inputPath = path.join(largeDir, jpegFile);
  const outputLargePath = path.join(largeDir, webpFilename);
  const outputThumbPath = path.join(thumbsDir, webpFilename);

  try {
    // Convert large - keep original resolution, quality 85
    await sharp(inputPath).webp({ quality: 85 }).toFile(outputLargePath);

    // Create thumbnail - resize to max 400px wide, quality 75
    await sharp(inputPath)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(outputThumbPath);

    console.log(`  OK  ${jpegFile} -> ${webpFilename}`);
    converted++;
  } catch (err) {
    console.error(`  ERROR  ${jpegFile}: ${err.message}`);
    skipped++;
  }
}

// Update JSON entries: replace jpeg paths with webp paths
let updated = 0;
for (const item of items) {
  if (/\.(jpe?g|JPE?G)$/i.test(item.large)) {
    const webpFilename = `${item.id}.webp`;
    item.large = `/portfolio/large/${webpFilename}`;
    item.thumb = `/portfolio/thumbs/${webpFilename}`;
    updated++;
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(items, null, 2), "utf-8");

console.log(`\nDone!`);
console.log(`  Converted : ${converted} files`);
console.log(`  Skipped   : ${skipped} files`);
console.log(`  JSON rows updated: ${updated}`);
console.log(`\nYou can now delete the original JPEG files from /public/portfolio/large`);
