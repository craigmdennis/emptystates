import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// No framework integration: nothing here is an island. Both gallery layouts
// are one DOM under `[data-view]`, the filters are links, and the two scripts
// in `Base.astro` are inline. React went out with the last EMDash component.
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
