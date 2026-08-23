#!/usr/bin/env bash
# Empty the edge cache for emptystat.es.
#
# A deploy changes what the origin returns and nothing else. On 2026-08-23 the
# rollback reverted the Worker while the edge kept serving the version that had
# just been rolled back, and the site read as un-reverted for several minutes.
# Both the promote and the rollback workflow call this afterwards.
#
# Needs CLOUDFLARE_ZONE_ID and a CLOUDFLARE_API_TOKEN carrying Zone > Cache
# Purge. Purging is free on every plan.
set -euo pipefail

: "${CLOUDFLARE_ZONE_ID:?set CLOUDFLARE_ZONE_ID}"
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN}"

response=$(curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

# The API answers 200 with `"success": false` on a permission error, so the
# HTTP status alone does not say whether the cache was emptied.
node -e '
  const body = JSON.parse(process.argv[1]);
  if (body.success) { console.log("Zone cache purged."); process.exit(0); }
  console.error("Purge failed:", JSON.stringify(body.errors ?? body));
  process.exit(1);
' "$response"
