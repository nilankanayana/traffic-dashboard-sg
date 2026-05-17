# API Reference — data.gov.sg Traffic Images

Reference for the public API powering this dashboard. Source of truth is the official documentation; this file summarizes the bits we depend on.

## Official Documentation

- **Portal**: <https://data.gov.sg/>
- **Developer guide**: <https://guide.data.gov.sg/developer-guide/api-overview>
- **Real-time APIs index**: <https://data.gov.sg/developer> (see "Real-time APIs")
- **Provider**: Land Transport Authority (LTA), Singapore

## Endpoint: Traffic Images

Returns the latest images from traffic cameras across Singapore.

```
GET https://api.data.gov.sg/v1/transport/traffic-images
```

### Query parameters

| Param      | Type    | Required | Description                                                              |
|------------|---------|----------|--------------------------------------------------------------------------|
| `date_time`| string  | No       | ISO 8601 timestamp (e.g. `2026-05-17T14:30:00`). Returns nearest snapshot.|

If `date_time` is omitted, the API returns the most recent available data.

### Authentication

The endpoint is publicly accessible without auth. An optional `x-api-key` header may be supplied for **higher rate limits** (no functional gating). The proxy attaches it automatically when `DATA_GOV_SG_API_KEY` is set in `.env`.

```
x-api-key: <your-key>
```

The machine-readable contract is checked into the repo as [`TrafficImages.json`](../TrafficImages.json) (OpenAPI 3.0).

### Response shape

```json
{
  "api_info": {
    "status": "healthy"
  },
  "items": [
    {
      "timestamp": "2026-05-17T14:30:00+08:00",
      "cameras": [
        {
          "timestamp": "2026-05-17T14:29:55+08:00",
          "image": "https://images.data.gov.sg/api/traffic-images/2026/05/<id>.jpg",
          "location": {
            "latitude": 1.29531332,
            "longitude": 103.871146
          },
          "camera_id": "1001",
          "image_metadata": {
            "height": 240,
            "width": 320,
            "md5": "<hash>"
          }
        }
      ]
    }
  ]
}
```

### Key fields we use

- `items[0].cameras[]` — array of camera snapshots (one entry per camera)
- `cameras[].camera_id` — stable identifier for joining/refresh
- `cameras[].image` — direct URL to the latest JPEG
- `cameras[].location.{latitude,longitude}` — for map marker placement
- `cameras[].timestamp` — when the image was captured (use to display freshness)

### Refresh cadence

Camera images typically update every **1–5 minutes**. There is no push/websocket — clients should poll on an interval (default: 60s, see `REFRESH_INTERVAL_MS`).

### Rate limits

Not formally published for this endpoint. Be a good citizen:

- Poll no faster than once per minute.
- Cache responses; do not re-fetch images that have the same `timestamp`.
- Respect HTTP cache headers on image URLs.

### Error responses

Standard HTTP status codes. The most common failure modes:

- `400` — malformed `date_time`
- `404` — no data for the requested time
- `5xx` — upstream LTA unavailable; retry with backoff

## Related endpoints (not yet used)

These may be added in future iterations:

- `/transport/taxi-availability` — live taxi locations
- `/transport/carpark-availability` — carpark lot availability
- `/environment/rainfall` — useful for overlaying weather context

## License & attribution

Data is provided under the **Singapore Open Data License**. When displaying, attribute as:
> Data from data.gov.sg, provided by the Land Transport Authority.
