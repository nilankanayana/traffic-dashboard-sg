# traffic-dashboard-sg

Live Singapore traffic camera dashboard: Leaflet/OSM map + camera markers,
backed by the data.gov.sg traffic-images API.

## Stack

- **Client**: React 18 + Vite, Leaflet for the map, react-router-dom (adds a
  `/projects` page alongside the dashboard). Lives in `client/`.
- **Server (local dev)**: Node/Express proxy in `server/index.js`. Caches the
  upstream response in memory (TTL via `PROXY_CACHE_TTL_MS`, default 30s) and
  serves `/api/cameras` and `/api/health`.
- **Server (prod)**: Vercel serverless functions in `client/api/*.js`
  (`cameras.js`, `health.js`). Both the Express proxy and the Vercel functions
  share the same upstream logic from `client/api/_lib/upstream.js` — this is
  the one place to change fetch/cache/shaping behavior.
- **Deployment**: Vercel hosts both the built client and the `client/api/*`
  functions. The root `vercel.json` and `client/vercel.json` are kept in sync
  (Vercel roots the build in `client/`); `VITE_BASE_PATH` is baked in at build
  time for the `/projects/traffic-dashboard-sg` subpath deployment.

## Data source

- Upstream: `https://api.data.gov.sg/v1/transport/traffic-images` (LTA camera
  images + geo coordinates). Public endpoint — `DATA_GOV_SG_API_KEY` only
  raises rate-limit headroom, it is not required to run locally.
- `shapeCameras()` in `client/api/_lib/upstream.js` reads `payload.items[0]`
  and returns `{ fetchedAt, apiTimestamp, count, cameras }`.
- **Known issue (as of 2026-10-19)**: this v1 endpoint currently returns far
  fewer cameras than the historical ~80-90 (spot-checked at 8). This looks
  like an upstream data.gov.sg issue, not a bug in this repo's fetch/shape
  code — the request succeeds (200) and shape is correct, the `items[0].cameras`
  array itself is just short. Worth re-checking data.gov.sg's status/docs for
  a v1 → v2 migration before assuming the proxy is broken.

## Running locally

```bash
npm run dev          # root script: runs server + client concurrently
npm run dev:server   # server only — Express proxy, http://127.0.0.1:3001
npm run dev:client   # client only — Vite, http://127.0.0.1:8501
```

Env vars are read from `.env` at the repo root (see `.env.example`). Local dev
defaults to loopback (`127.0.0.1`) for both client and server — this
overrides the usual convention of binding to the Tailscale IP for this
project specifically.

Health check: `GET /api/health` reports cache age and whether an API key is
set — check this first when cameras look stale or missing.

## Gotchas

- Changing upstream fetch/shape logic must go in `client/api/_lib/upstream.js`
  — editing only `server/index.js` or only `client/api/cameras.js` will leave
  the other runtime (dev vs. prod) behind.
- Keep root `vercel.json` and `client/vercel.json` in sync — Vercel roots the
  build in `client/`, but both files set `VITE_BASE_PATH` for the subpath
  deploy and have drifted before.
- `docs/IDEAS.md` (if present) is local-only — never commit or push it.
