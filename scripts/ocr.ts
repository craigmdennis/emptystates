import Tesseract from "tesseract.js";

const API_BASE = process.env.API_BASE ?? "http://localhost:4321/_emdash/api";

interface State {
  id: string;
  data: {
    slug: string;
    title: string;
    ocr_text?: string;
    screenshot?: { url: string };
  };
}

async function fetchStates(): Promise<State[]> {
  const res = await fetch(`${API_BASE}/collections/states/entries`);
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.status}`);
  const json = await res.json();
  return json.entries ?? json;
}

async function updateOcrText(id: string, ocrText: string): Promise<void> {
  const res = await fetch(`${API_BASE}/collections/states/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ocr_text: ocrText }),
  });
  if (!res.ok) throw new Error(`Failed to update ${id}: ${res.status}`);
}

async function runOcr(imageUrl: string): Promise<string> {
  const { data } = await Tesseract.recognize(imageUrl, "eng");
  return data.text.trim();
}

async function main() {
  console.log("Fetching states...");
  const states = await fetchStates();
  const needsOcr = states.filter(
    (s) => s.data.screenshot?.url && !s.data.ocr_text
  );

  console.log(`${needsOcr.length} of ${states.length} states need OCR.`);

  for (const state of needsOcr) {
    const url = state.data.screenshot!.url;
    console.log(`OCR: ${state.data.title}...`);
    try {
      const text = await runOcr(url);
      if (text) {
        await updateOcrText(state.id, text);
        console.log(`  -> ${text.length} chars extracted`);
      } else {
        console.log(`  -> no text found`);
      }
    } catch (err) {
      console.error(`  -> FAILED: ${err}`);
    }
  }

  console.log("Done.");
}

main();
