import sharp from "sharp";

/**
 * Generates 3 thumbnail sizes for each state image.
 * Fetches original images, resizes to WebP, uploads back to R2 via EMDash API.
 *
 * Sizes: small (300px), medium (600px), large (1200px).
 * Filenames follow convention: {slug}-{size}.webp
 *
 * Run: npm run thumbnails
 * Requires the dev server to be running.
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:4321/_emdash/api";

const SIZES = [
  { name: "sm", width: 300 },
  { name: "md", width: 600 },
  { name: "lg", width: 1200 },
] as const;

interface State {
  id: string;
  data: {
    slug: string;
    title: string;
    screenshot?: { url: string; id: string };
  };
}

async function fetchStates(): Promise<State[]> {
  const res = await fetch(`${API_BASE}/collections/states/entries`);
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.status}`);
  const json = await res.json();
  return json.entries ?? json;
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadThumbnail(
  buffer: Buffer,
  filename: string
): Promise<{ url: string }> {
  const blob = new Blob([buffer], { type: "image/webp" });
  const formData = new FormData();
  formData.append("file", blob, filename);

  const res = await fetch(`${API_BASE}/media`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

async function main() {
  const states = await fetchStates();
  console.log(`Processing ${states.length} states...`);

  let processed = 0;
  let skipped = 0;

  for (const state of states) {
    const imgUrl = state.data.screenshot?.url;
    if (!imgUrl) {
      skipped++;
      continue;
    }

    console.log(`[${processed + skipped + 1}/${states.length}] ${state.data.title}`);

    try {
      const original = await downloadImage(imgUrl);

      for (const size of SIZES) {
        const resized = await sharp(original)
          .resize(size.width, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const filename = `${state.data.slug}-${size.name}.webp`;
        await uploadThumbnail(resized, filename);
        console.log(`  ${size.name} (${size.width}px): ${(resized.length / 1024).toFixed(0)}KB`);
      }
      processed++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
    }
  }

  console.log(`\nDone. ${processed} processed, ${skipped} skipped (no image).`);
}

main();
