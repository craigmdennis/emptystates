#!/usr/bin/env bash
# Seed this checkout's local D1 with a copy of production.
#
# `wrangler d1 export` refuses a database that contains an FTS5 table, so the
# copy is made table by table with --no-schema and the FTS rows are rebuilt
# from the copied data at the end. Run from the repository root.
set -euo pipefail

# Each remote export asks "Ok to proceed?". Wrangler takes the default answer
# without asking when it thinks it runs under CI.
export CI=true

CFG=(--config wrangler.jsonc)
DB=emptystates-db
OUT="${TMPDIR:-/tmp}/emptystates-seed"
TABLES=(device_types operating_systems tags states state_tags state_colors
        state_relations state_redirects submissions)

mkdir -p "$OUT"
rm -rf .wrangler/state/v3/d1
npx wrangler d1 migrations apply "$DB" --local "${CFG[@]}"

# The migrations seed the taxonomy tables. Production is the authority.
npx wrangler d1 execute "$DB" --local "${CFG[@]}" \
  --command "DELETE FROM device_types; DELETE FROM operating_systems; DELETE FROM tags;"

for t in "${TABLES[@]}"; do
  npx wrangler d1 export "$DB" --remote "${CFG[@]}" --table "$t" --no-schema --output "$OUT/$t.sql"
  npx wrangler d1 execute "$DB" --local "${CFG[@]}" --file "$OUT/$t.sql"
done

npx wrangler d1 execute "$DB" --local "${CFG[@]}" --command "
INSERT INTO states_fts (title, app_name, tags, colors, screen_text, description, state_id)
SELECT s.title, s.app_name,
  (SELECT group_concat(t.label, ' ') FROM state_tags st JOIN tags t ON t.id = st.tag_id WHERE st.state_id = s.id),
  s.color_names, s.screen_text, s.description, s.id
FROM states s;"

echo "Local D1 seeded from production."
