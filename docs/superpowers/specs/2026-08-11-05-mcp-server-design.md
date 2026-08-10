# 05 — MCP server

**Date:** 2026-08-11
**Parent:** `2026-08-10-emptystates-architecture.md`
**Depends on:** 02
**Phase:** 2–3

Deliberately thin. This is a sketch to protect a phase-1 decision, not a build-ready
spec — it should be re-brainstormed before implementation, when the corpus is clean
and search is proven.

## Intent

Let someone ask Claude or another assistant to find empty states and get real
results, rather than a link to a search page. The catalogue is the valuable thing;
making it reachable by the tools designers now work in costs little.

Not a Mobbin clone. This site does one thing, and **monetisation is an explicit
non-goal** — which is what makes the auth decision easy.

## The phase-1 constraint

Spec 02 requires search to be a callable function, `searchStates()`, not logic
inside an Astro route. That requirement exists **for this spec**.

If `/api/search` and the MCP tools call the same function they cannot disagree. If
the MCP server reimplements search against the same tables, they will — and the
failure mode is an assistant confidently reporting results the site itself does not
return, which is worse than not having the server at all.

That is the only thing phase 1 must get right for phase 3 to be cheap. It is already
recorded as a cross-cutting convention in the parent.

## Shape

Cloudflare hosts remote MCP servers natively on Workers via the Agents SDK —
`createMcpHandler` for stateless servers, `McpAgent` for stateful — over Streamable
HTTP. Same account, same D1 binding, deployed alongside the site. Clients connect
directly, or through the `mcp-remote` proxy where remote transport is unsupported.

**Authless.** The catalogue is public, there is nothing to meter, and adding OAuth
would put a login in front of a public reference for nobody's benefit. Rate-limit by
IP instead.

### Tools

| Tool | Arguments | Returns |
|---|---|---|
| `search_empty_states` | query, device, os, tags, colour, limit | Ranked entries: title, app, device, OS, tags, image URL, page URL |
| `get_empty_state` | slug | Full detail including screen text and description |
| `list_facets` | — | Available devices, OSes, tags, colours with counts |

All three are thin wrappers over `searchStates()` and the existing queries.

`screen_text` and `description` are what make this worth doing. An assistant asking
"find empty states that use an illustration and offer a clear next action" can
reason over the description field, which is exactly the query a search box handles
badly.

## Open questions for the later brainstorm

- Whether results should carry image data or only URLs. URLs are cheaper and let the
  client fetch what it needs; embedded images make single-shot use work better.
- Whether to expose a `similar_to` tool, which would need vector embeddings and is a
  larger piece of work than the rest of this spec combined.
- Attribution and rate limits — a public authless endpoint reading a curated corpus
  should probably return a source URL with every result, so use of the data points
  back at the site.
- Whether `/mcp` lives in the same Worker as the site or its own, which is mostly a
  question about deployment blast radius.

## Verification

- [ ] Every tool calls `searchStates()`; no second search implementation exists
- [ ] A query through the MCP tool and the same query through `/api/search` return
      identical results in the same order
- [ ] Server reachable from Claude via `mcp-remote`
- [ ] Rate limiting works without authentication
