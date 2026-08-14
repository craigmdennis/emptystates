/**
 * Builds the device triage page: every imported entry, with a control to set
 * its device type or queue it for deletion.
 *
 *   npx tsx scripts/build-device-triage.ts     # or: npm run triage
 *
 * The page is static and writes nothing back. Decisions are kept in the
 * browser's local storage while the work is in progress, and exported as
 * `device-decisions.json` when it is done. `scripts/apply-decisions.ts` is what
 * changes the corpus, so nothing is retagged or deleted until that runs.
 *
 * Images are referenced from `content/states/` by relative path, so open the
 * file from disk. This is a local review tool and is not publishable.
 */

import { writeFile } from "node:fs/promises";
import { getPlatformProxy } from "wrangler";
import { legacyDir, readEntryMeta } from "./corpus";

const OUT_PATH = "docs/device-triage.html";
const DECISIONS_FILE = "device-decisions.json";

type StateRow = {
  slug: string;
  title: string;
  device_type: string;
  os: string | null;
  aspect_ratio: number;
  width: number;
  height: number;
  legacy_path: string | null;
};

type DeviceRow = {
  slug: string;
  label: string;
  sort_order: number;
  min_ratio: number | null;
  max_ratio: number | null;
};

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({
  remoteBindings: false,
});

try {
  const { results: devices } = await env.DB.prepare(
    `SELECT slug, label, sort_order, min_ratio, max_ratio
       FROM device_types WHERE is_active = 1 ORDER BY sort_order`,
  ).all<DeviceRow>();

  const { results: states } = await env.DB.prepare(
    `SELECT s.slug, s.title, s.device_type, s.os, s.aspect_ratio, s.width, s.height,
            (SELECT r.from_path FROM state_redirects r
              WHERE r.state_id = s.id AND r.from_path LIKE '/s/%'
              LIMIT 1) AS legacy_path
       FROM states s ORDER BY s.slug`,
  ).all<StateRow>();

  const rangeFor = new Map(devices.map((d) => [d.slug, d]));

  const entries = await Promise.all(
    states.map(async (s) => {
      const dir = legacyDir(s.slug, s.legacy_path);
      const meta = await readEntryMeta(dir);
      const range = rangeFor.get(s.device_type);
      // The same test the importer runs, including its exemption: a device
      // somebody chose is settled, however odd the shape, so the flagged list
      // empties as the work is done instead of re-raising decided cases.
      const disagrees =
        !meta.deviceOverride &&
        range?.min_ratio != null &&
        range.max_ratio != null &&
        (s.aspect_ratio < range.min_ratio || s.aspect_ratio > range.max_ratio);
      return {
        slug: s.slug,
        dir,
        title: s.title,
        device: s.device_type,
        os: s.os,
        ratio: Number(s.aspect_ratio.toFixed(4)),
        w: s.width,
        h: s.height,
        src: meta.src,
        setByHand: meta.deviceOverride,
        disagrees: Boolean(disagrees),
        // How far outside the range, for the worst-first sort. Zero when the
        // shape and the claim agree.
        off: disagrees
          ? Number(
              (s.aspect_ratio > range!.max_ratio!
                ? s.aspect_ratio - range!.max_ratio!
                : range!.min_ratio! - s.aspect_ratio
              ).toFixed(4),
            )
          : 0,
      };
    }),
  );

  const payload = {
    devices: devices.map((d) => ({
      slug: d.slug,
      label: d.label,
      min: d.min_ratio,
      max: d.max_ratio,
    })),
    entries,
  };

  const html = page(JSON.stringify(payload), entries.length);
  await writeFile(OUT_PATH, html, "utf8");

  const flagged = entries.filter((e) => e.disagrees).length;
  console.log(`${entries.length} entries (${flagged} flagged) -> ${OUT_PATH}`);
} finally {
  await dispose();
}

function page(dataJson: string, total: number): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Device triage — ${total} entries</title>
<style>
  :root {
    color-scheme: light dark;
    --bg:#fff; --fg:#111; --muted:#666; --line:#e2e2e2; --card:#fafafa;
    --accent:#1a56db; --accent-fg:#fff; --warn:#b45309; --warn-bg:#fef3c7;
    --danger:#b91c1c; --danger-bg:#fee2e2; --ok:#15803d;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#131313; --fg:#f0f0f0; --muted:#9a9a9a; --line:#2d2d2d; --card:#1c1c1c;
      --accent:#5b8def; --accent-fg:#0b1020; --warn:#fbbf24; --warn-bg:#3a2c07;
      --danger:#f87171; --danger-bg:#3b1414; --ok:#4ade80;
    }
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--fg);
         font:15px/1.5 ui-sans-serif,-apple-system,"Segoe UI",system-ui,sans-serif; }
  header { position:sticky; top:0; z-index:10; background:var(--bg);
           border-bottom:1px solid var(--line); padding:.9rem clamp(1rem,3vw,2rem); }
  .bar { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; }
  h1 { font-size:1.05rem; margin:0; letter-spacing:-.01em; white-space:nowrap; }
  .spacer { flex:1; }
  .tally { color:var(--muted); font-size:.85rem; font-variant-numeric:tabular-nums; }
  .tally b { color:var(--fg); }
  button { font:inherit; cursor:pointer; border:1px solid var(--line); background:var(--card);
           color:var(--fg); border-radius:6px; padding:.32rem .6rem; }
  button:hover { border-color:var(--muted); }
  button.primary { background:var(--accent); color:var(--accent-fg); border-color:transparent; font-weight:600; }
  button.primary[disabled] { opacity:.45; cursor:not-allowed; }
  .filters { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.7rem; }
  .filters button[aria-pressed="true"] { background:var(--fg); color:var(--bg); border-color:transparent; }
  main { padding:1.5rem clamp(1rem,3vw,2rem) 6rem; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:1.25rem; }
  figure { margin:0; background:var(--card); border:1px solid var(--line); border-radius:8px;
           overflow:hidden; display:flex; flex-direction:column; }
  figure:focus-visible { outline:3px solid var(--accent); outline-offset:2px; }
  figure.is-focused { border-color:var(--accent); box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 35%,transparent); }
  figure.queued { opacity:.55; }
  figure.queued .shot { filter:grayscale(1); }
  .shot { width:100%; background:repeating-conic-gradient(#8883 0% 25%, transparent 0% 50%) 50%/16px 16px; }
  .shot img { width:100%; height:100%; object-fit:contain; display:block; }
  .body { padding:.7rem .8rem .8rem; display:flex; flex-direction:column; gap:.45rem; flex:1; }
  .title { font-weight:600; font-size:.9rem; overflow-wrap:anywhere; }
  .meta { color:var(--muted); font-size:.78rem; font-variant-numeric:tabular-nums; }
  .slug { color:var(--muted); font-size:.72rem; overflow-wrap:anywhere;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  .flag { display:inline-block; background:var(--warn-bg); color:var(--warn); border-radius:4px;
          padding:.1rem .35rem; font-size:.7rem; font-weight:600; align-self:flex-start; }
  .flag.settled { background:transparent; color:var(--ok); border:1px solid currentColor; }
  .devices { display:flex; gap:.3rem; flex-wrap:wrap; margin-top:auto; }
  .devices button { padding:.28rem .5rem; font-size:.78rem; }
  .devices button.current { border-color:var(--muted); font-weight:600; }
  .devices button.chosen { background:var(--accent); color:var(--accent-fg); border-color:transparent; font-weight:700; }
  .row { display:flex; gap:.4rem; align-items:center; }
  .row .del { margin-left:auto; font-size:.78rem; padding:.28rem .5rem; }
  .row .del.on { background:var(--danger-bg); color:var(--danger); border-color:var(--danger); font-weight:700; }
  .state { font-size:.75rem; color:var(--ok); font-weight:600; min-height:1em; }
  .state.del { color:var(--danger); }
  .empty { color:var(--muted); padding:3rem 0; text-align:center; }
  kbd { font:inherit; font-family:ui-monospace,Menlo,monospace; font-size:.72rem; border:1px solid var(--line);
        border-bottom-width:2px; border-radius:4px; padding:0 .3rem; color:var(--muted); }
  .help { color:var(--muted); font-size:.78rem; margin-top:.6rem; }
</style>
</head>
<body>
<header>
  <div class="bar">
    <h1>Device triage</h1>
    <span class="tally" id="tally"></span>
    <span class="spacer"></span>
    <button id="import">Load decisions…</button>
    <button id="reset">Clear all</button>
    <button id="export" class="primary">Export ${DECISIONS_FILE}</button>
  </div>
  <div class="filters" id="filters"></div>
  <p class="help">Click a card, then <kbd>1</kbd>–<kbd>6</kbd> to set a device,
     <kbd>a</kbd> to approve the one it already has, <kbd>x</kbd> to queue for deletion,
     <kbd>0</kbd> to clear. <kbd>J</kbd>/<kbd>K</kbd> move.
     Decisions are saved in this browser until exported. Nothing changes on disk until
     <code>apply-decisions</code> runs.</p>
</header>
<main><div class="grid" id="grid"></div></main>
<input type="file" id="file" accept="application/json" hidden>
<script id="data" type="application/json">${dataJson}</script>
<script>
(function () {
  "use strict";
  var DATA = JSON.parse(document.getElementById("data").textContent);
  var DEVICES = DATA.devices;
  var ENTRIES = DATA.entries;
  var STORE_KEY = "emptystates.device-triage.v1";

  // slug -> {device:"tablet"} | {delete:true}
  var decisions = load();
  // Opens on the flagged list while one exists, and on everything once the
  // flagged list is empty, so a finished corpus never lands on a blank view.
  var filter = ENTRIES.some(function (e) { return e.disagrees; }) ? "flagged" : "all";
  var focused = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(decisions)); }
    catch (e) { /* private browsing; the export button still works */ }
  }

  function decisionFor(slug) { return decisions[slug] || null; }

  function counts() {
    var changed = 0, queued = 0;
    for (var slug in decisions) {
      if (decisions[slug].delete) queued++;
      else if (decisions[slug].device) changed++;
    }
    return { changed: changed, queued: queued };
  }

  var FILTERS = [
    { id: "flagged", label: "Shape disagrees", test: function (e) { return e.disagrees; } },
    { id: "all", label: "All", test: function () { return true; } },
    { id: "decided", label: "Decided", test: function (e) { return !!decisionFor(e.slug); } },
    { id: "queued", label: "Queued for deletion", test: function (e) {
        var d = decisionFor(e.slug); return !!(d && d.delete); } },
    { id: "undecided", label: "Undecided", test: function (e) { return !decisionFor(e.slug); } },
    { id: "settled", label: "Set by hand", test: function (e) { return !!e.setByHand; } }
  ];
  DEVICES.forEach(function (d) {
    FILTERS.push({
      id: "dev:" + d.slug,
      label: d.label,
      test: function (e) { return e.device === d.slug; }
    });
  });

  function visible() {
    var f = FILTERS.filter(function (x) { return x.id === filter; })[0] || FILTERS[1];
    var list = ENTRIES.filter(f.test);
    // Worst disagreement first, then by slug, so the flagged view opens on the
    // cases most likely to change something.
    return list.sort(function (a, b) {
      if (b.off !== a.off) return b.off - a.off;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }

  function renderFilters() {
    var host = document.getElementById("filters");
    host.textContent = "";
    FILTERS.forEach(function (f) {
      var n = ENTRIES.filter(f.test).length;
      var b = document.createElement("button");
      b.textContent = f.label + " (" + n + ")";
      b.setAttribute("aria-pressed", String(f.id === filter));
      b.addEventListener("click", function () { filter = f.id; render(); });
      host.appendChild(b);
    });
  }

  function renderTally() {
    var c = counts();
    var host = document.getElementById("tally");
    host.textContent = "";
    [[ENTRIES.length, "entries"], [c.changed, "retagged"],
     [c.queued, "queued for deletion"]].forEach(function (pair, i) {
      if (i) host.appendChild(document.createTextNode(" \\u00b7 "));
      var b = document.createElement("b");
      b.textContent = String(pair[0]);
      host.appendChild(b);
      host.appendChild(document.createTextNode(" " + pair[1]));
    });
    document.getElementById("export").disabled = (c.changed + c.queued) === 0;
  }

  function card(e) {
    var d = decisionFor(e.slug);
    var fig = document.createElement("figure");
    fig.tabIndex = 0;
    fig.dataset.slug = e.slug;
    if (d && d.delete) fig.classList.add("queued");
    if (focused === e.slug) fig.classList.add("is-focused");

    var shot = document.createElement("div");
    shot.className = "shot";
    shot.style.aspectRatio = e.w + "/" + e.h;
    var img = document.createElement("img");
    img.src = e.src; img.alt = e.title; img.loading = "lazy";
    shot.appendChild(img);
    fig.appendChild(shot);

    var body = document.createElement("div");
    body.className = "body";

    var t = document.createElement("div");
    t.className = "title"; t.textContent = e.title;
    body.appendChild(t);

    var meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = e.w + "\\u00d7" + e.h + " — ratio " + e.ratio.toFixed(3) +
      " — imported as " + e.device + (e.os ? " / " + e.os : "");
    body.appendChild(meta);

    if (e.disagrees) {
      var flag = document.createElement("span");
      flag.className = "flag";
      flag.textContent = "shape disagrees with " + e.device;
      body.appendChild(flag);
    }
    if (e.setByHand) {
      var settled = document.createElement("span");
      settled.className = "flag settled";
      settled.textContent = "set by hand: " + e.setByHand;
      body.appendChild(settled);
    }

    var slug = document.createElement("div");
    slug.className = "slug"; slug.textContent = "/s/" + e.slug;
    body.appendChild(slug);

    var devs = document.createElement("div");
    devs.className = "devices";
    DEVICES.forEach(function (dev, i) {
      var b = document.createElement("button");
      b.textContent = dev.label;
      b.title = "Set to " + dev.label + " (" + (i + 1) + ")";
      if (dev.slug === e.device) b.classList.add("current");
      if (d && d.device === dev.slug) b.classList.add("chosen");
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        setDevice(e, dev.slug);
      });
      devs.appendChild(b);
    });
    body.appendChild(devs);

    var row = document.createElement("div");
    row.className = "row";
    var state = document.createElement("span");
    state.className = "state";
    if (d && d.delete) { state.textContent = "queued for deletion"; state.classList.add("del"); }
    else if (d && d.device === e.device) { state.textContent = "approved as " + d.device; }
    else if (d && d.device) { state.textContent = e.device + " \\u2192 " + d.device; }
    row.appendChild(state);

    var del = document.createElement("button");
    del.className = "del" + (d && d.delete ? " on" : "");
    del.textContent = d && d.delete ? "Queued (x)" : "Delete (x)";
    del.addEventListener("click", function (ev) { ev.stopPropagation(); toggleDelete(e); });
    row.appendChild(del);
    body.appendChild(row);

    fig.appendChild(body);
    fig.addEventListener("click", function () { focused = e.slug; render(); });
    fig.addEventListener("focus", function () { focused = e.slug; });
    return fig;
  }

  // Choosing the device an entry already has is a decision in its own right:
  // it records that somebody looked and approved it, which is what takes the
  // entry off the flagged list. The 0 key is what clears one.
  function setDevice(e, device) {
    decisions[e.slug] = { device: device };
    focused = e.slug;
    save(); render();
  }

  function toggleDelete(e) {
    var d = decisionFor(e.slug);
    if (d && d.delete) delete decisions[e.slug];
    else decisions[e.slug] = { delete: true };
    focused = e.slug;
    save(); render();
  }

  function clearOne(e) { delete decisions[e.slug]; focused = e.slug; save(); render(); }

  function render() {
    renderFilters();
    renderTally();
    var grid = document.getElementById("grid");
    grid.textContent = "";
    var list = visible();
    if (!list.length) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Nothing in this view.";
      grid.appendChild(p);
      return;
    }
    list.forEach(function (e) { grid.appendChild(card(e)); });
    var f = grid.querySelector(".is-focused");
    if (f) f.focus({ preventScroll: true });
  }

  document.addEventListener("keydown", function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var list = visible();
    if (!list.length) return;
    var idx = list.findIndex(function (e) { return e.slug === focused; });

    if (ev.key === "j" || ev.key === "J" || ev.key === "ArrowRight") {
      focused = list[idx < 0 ? 0 : Math.min(idx + 1, list.length - 1)].slug;
      ev.preventDefault(); render(); return;
    }
    if (ev.key === "k" || ev.key === "K" || ev.key === "ArrowLeft") {
      focused = list[idx < 0 ? 0 : Math.max(idx - 1, 0)].slug;
      ev.preventDefault(); render(); return;
    }
    if (idx < 0) return;
    var entry = list[idx];
    if (ev.key === "x" || ev.key === "X") { ev.preventDefault(); toggleDelete(entry); return; }
    if (ev.key === "0") { ev.preventDefault(); clearOne(entry); return; }
    if (ev.key === "a" || ev.key === "A") { ev.preventDefault(); setDevice(entry, entry.device); return; }
    var n = parseInt(ev.key, 10);
    if (n >= 1 && n <= DEVICES.length) { ev.preventDefault(); setDevice(entry, DEVICES[n - 1].slug); }
  });

  document.getElementById("export").addEventListener("click", function () {
    var out = { version: 1, source: "docs/device-triage.html", decisions: [] };
    ENTRIES.forEach(function (e) {
      var d = decisionFor(e.slug);
      if (!d) return;
      out.decisions.push(d.delete
        ? { slug: e.slug, dir: e.dir, action: "delete", was: e.device }
        : { slug: e.slug, dir: e.dir, action: "device", device: d.device, was: e.device });
    });
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ${JSON.stringify(DECISIONS_FILE)};
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("import").addEventListener("click", function () {
    document.getElementById("file").click();
  });
  document.getElementById("file").addEventListener("change", function (ev) {
    var file = ev.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var next = {};
        (parsed.decisions || []).forEach(function (d) {
          next[d.slug] = d.action === "delete" ? { delete: true } : { device: d.device };
        });
        decisions = next; save(); render();
      } catch (e) { alert("Could not read that file: " + e.message); }
    };
    reader.readAsText(file);
    ev.target.value = "";
  });

  document.getElementById("reset").addEventListener("click", function () {
    if (!confirm("Clear every decision made in this browser?")) return;
    decisions = {}; save(); render();
  });

  render();
})();
</script>
</body>
</html>
`;
}
