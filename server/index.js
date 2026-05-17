import express from 'express';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '..', '.env') });

const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000);
const HOST = process.env.SERVER_HOST || '100.72.108.26';
const API_BASE = process.env.DATA_GOV_SG_API_BASE || 'https://api.data.gov.sg/v1';
const API_KEY = process.env.DATA_GOV_SG_API_KEY || '';
const CACHE_TTL_MS = Number(process.env.PROXY_CACHE_TTL_MS || 30_000);

const app = express();

let cache = null;
let inflight = null;

async function fetchUpstream() {
  const headers = { Accept: 'application/json' };
  if (API_KEY) headers['x-api-key'] = API_KEY;
  const url = `${API_BASE}/transport/traffic-images`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upstream ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function getCameras() {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { ...cache, fromCache: true };
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const payload = await fetchUpstream();
      cache = { fetchedAt: Date.now(), payload };
      return { ...cache, fromCache: false };
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function shapeResponse(fetchedAt, payload, extra = {}) {
  const item = payload?.items?.[0];
  return {
    fetchedAt,
    apiTimestamp: item?.timestamp ?? null,
    count: item?.cameras?.length ?? 0,
    cameras: item?.cameras ?? [],
    ...extra,
  };
}

app.get('/api/cameras', async (_req, res) => {
  try {
    const { fetchedAt, payload, fromCache } = await getCameras();
    res.set('Cache-Control', 'no-store');
    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    res.set('X-Fetched-At', new Date(fetchedAt).toISOString());
    res.json(shapeResponse(fetchedAt, payload));
  } catch (err) {
    console.error('[proxy] upstream failed:', err.message);
    if (cache) {
      res.set('X-Cache', 'STALE');
      res.json(shapeResponse(cache.fetchedAt, cache.payload, { stale: true }));
    } else {
      res.status(502).json({ error: 'upstream_unavailable', message: err.message });
    }
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    cacheTtlMs: CACHE_TTL_MS,
    hasCache: !!cache,
    cacheAgeMs: cache ? Date.now() - cache.fetchedAt : null,
    hasApiKey: !!API_KEY,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[proxy] listening on http://${HOST}:${PORT}`);
  console.log(`[proxy] cache TTL ${CACHE_TTL_MS}ms · API key ${API_KEY ? 'set' : 'not set'}`);
});
