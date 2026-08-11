// Augments the generated Cloudflare.Env (worker-configuration.d.ts) with the
// test-only binding supplied by vitest.config.ts.
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
