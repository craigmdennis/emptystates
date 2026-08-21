import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// No framework integration: nothing here is an island. Both gallery layouts
// are one DOM under `[data-view]`, the filters are links, and the two scripts
// in `Base.astro` are inline. React went out with the last EMDash component.
export default defineConfig({
  // One address per page. Under Astro's default of 'ignore', `/2` and `/2/`
  // both answer 200 and the canonical is all that separates them. Under
  // 'never', the slashed form receives a 301 to the slashless one — a GET
  // gets 301 and any other method 308, both permanent.
  //
  // Master publishes every URL with a trailing slash, so this is the rule
  // that turns each of those into a redirect rather than a duplicate.
  trailingSlash: "never",
  output: "server",
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
