// Augments the generated Cloudflare.Env (worker-configuration.d.ts) with the
// test-only bindings supplied by vitest.config.ts.
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
    /** Every file under `src/`, keyed by path. Read at config time. */
    TEST_SOURCES: Record<string, string>;
  }
}
