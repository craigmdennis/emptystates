import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";

export const GET: APIRoute = async () => {
  const { entries } = await getEmDashCollection("states", {
    where: { status: "published" },
  });

  const index = entries.map((entry) => ({
    s: entry.data.slug,
    t: entry.data.title,
    a: entry.data.app_name ?? "",
    u: entry.data.app_url ?? "",
    d: entry.data.device_type,
    p: entry.data.platform ?? "",
    g: (entry.data.tags ?? []).join(" "),
    o: entry.data.ocr_text ?? "",
    i: entry.data.screenshot?.url ?? "",
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
