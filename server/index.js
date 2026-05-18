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

function authHeaders() {
  const h = { Accept: 'application/json' };
  if (API_KEY) h['x-api-key'] = API_KEY;
  return h;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upstream ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function createCachedFetcher({ ttl, fetcher }) {
  let cache = null;
  let inflight = null;
  return {
    async get() {
      const now = Date.now();
      if (cache && now - cache.fetchedAt < ttl) {
        return { ...cache, fromCache: true };
      }
      if (inflight) return inflight;
      inflight = (async () => {
        try {
          const payload = await fetcher();
          cache = { fetchedAt: Date.now(), payload };
          return { ...cache, fromCache: false };
        } finally {
          inflight = null;
        }
      })();
      return inflight;
    },
    getCache() {
      return cache;
    },
  };
}

const cameras = createCachedFetcher({
  ttl: CACHE_TTL_MS,
  fetcher: () => fetchJson(`${API_BASE}/transport/traffic-images`),
});

const taxis = createCachedFetcher({
  ttl: CACHE_TTL_MS,
  fetcher: () => fetchJson(`${API_BASE}/transport/taxi-availability`),
});

function shapeCameras(fetchedAt, payload, extra = {}) {
  const item = payload?.items?.[0];
  return {
    fetchedAt,
    apiTimestamp: item?.timestamp ?? null,
    count: item?.cameras?.length ?? 0,
    cameras: item?.cameras ?? [],
    ...extra,
  };
}

function shapeTaxis(fetchedAt, payload, extra = {}) {
  const feature = payload?.features?.[0];
  const coords = feature?.geometry?.coordinates ?? [];
  return {
    fetchedAt,
    apiTimestamp: feature?.properties?.timestamp ?? null,
    count: feature?.properties?.taxi_count ?? coords.length,
    coordinates: coords,
    ...extra,
  };
}

function makeHandler(resource, shape) {
  return async (_req, res) => {
    try {
      const { fetchedAt, payload, fromCache } = await resource.get();
      res.set('Cache-Control', 'no-store');
      res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
      res.set('X-Fetched-At', new Date(fetchedAt).toISOString());
      res.json(shape(fetchedAt, payload));
    } catch (err) {
      console.error('[proxy] upstream failed:', err.message);
      const cached = resource.getCache();
      if (cached) {
        res.set('X-Cache', 'STALE');
        res.json(shape(cached.fetchedAt, cached.payload, { stale: true }));
      } else {
        res.status(502).json({ error: 'upstream_unavailable', message: err.message });
      }
    }
  };
}

app.get('/api/cameras', makeHandler(cameras, shapeCameras));
app.get('/api/taxis', makeHandler(taxis, shapeTaxis));

app.get('/api/health', (_req, res) => {
  const cc = cameras.getCache();
  const tc = taxis.getCache();
  res.json({
    ok: true,
    cacheTtlMs: CACHE_TTL_MS,
    cameras: {
      hasCache: !!cc,
      cacheAgeMs: cc ? Date.now() - cc.fetchedAt : null,
    },
    taxis: {
      hasCache: !!tc,
      cacheAgeMs: tc ? Date.now() - tc.fetchedAt : null,
    },
    hasApiKey: !!API_KEY,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[proxy] listening on http://${HOST}:${PORT}`);
  console.log(`[proxy] cache TTL ${CACHE_TTL_MS}ms · API key ${API_KEY ? 'set' : 'not set'}`);
});
