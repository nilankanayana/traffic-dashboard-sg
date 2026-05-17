# Live Traffic Dashboard (Singapore)

A real-time traffic monitoring dashboard for Singapore using public data from data.gov.sg.

## Overview

This dashboard provides live visibility into Singapore's road traffic via official traffic camera feeds published by the Land Transport Authority (LTA). It offers a map-based interface with up-to-date imagery from cameras positioned across expressways and major arterial roads.

## Data Source

- **API**: [data.gov.sg](https://data.gov.sg) — Traffic Images endpoint
- **Endpoint**: `https://api.data.gov.sg/v1/transport/traffic-images`
- **Provider**: Land Transport Authority (LTA), Singapore
- **License**: Singapore Open Data License
- **Auth**: No API key required for the traffic-images endpoint (public)

## Features

- 🗺️ **Map View** — Interactive map of Singapore with camera markers at their geographic coordinates
- 📷 **Live Camera Feeds** — Click any marker to view the latest traffic image from that camera
- ⏱️ **Real-Time Updates** — Auto-refresh of camera images on a configurable interval (~1–5 min)
- 🔍 **Camera Browser** — Sortable/filterable list of all available cameras
- 📊 **Timestamp Display** — Last-updated time for each image so users can gauge freshness

## Stack

> **TBD** — to be decided. Candidates under consideration:
>
> - **Frontend**: React + Vite, or SvelteKit, or plain HTML/JS
> - **Map library**: Leaflet (OpenStreetMap), or Mapbox GL JS
> - **Backend**: None required (client-only) OR a thin Node/Express proxy for caching
> - **Hosting**: Vercel / Netlify / Cloudflare Pages

## Getting Started

```bash
# Clone or open the repo
cd traffic-dashboard-sg

# Copy environment template
cp .env.example .env

# Install dependencies (once stack is chosen)
# npm install

# Run dev server (once stack is chosen)
# npm run dev
```

## Project Structure

```
traffic-dashboard-sg/
├── README.md           # This file
├── .gitignore
├── .env.example        # Environment variable template
└── docs/
    └── API.md          # API reference & data shapes
```

## License

TBD
